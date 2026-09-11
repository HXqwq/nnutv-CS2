"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const STAR_LIST = [1, 2, 3, 4, 5];
const API = {
  ratings: "/api/ratings",
  comments: "/api/comments",
};

function readLS(key) {
  try {
    return window.localStorage.getItem(key) || "";
  } catch (_) {
    return "";
  }
}

function writeLS(key, val) {
  try {
    window.localStorage.setItem(key, val);
  } catch (_) {
    /* 隐私模式下可能失败，忽略 */
  }
}

function getVoter() {
  let v = readLS("nnutv-voter");
  if (!v) {
    try {
      v =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : String(Date.now()) + Math.random().toString(36).slice(2);
    } catch (_) {
      v = String(Date.now()) + Math.random().toString(36).slice(2);
    }
    writeLS("nnutv-voter", v);
  }
  return v;
}

// 统一的请求包装：区分「接口不可用」与「业务失败」
async function callApi(path, init) {
  const res = await fetch(path, {
    cache: "no-store",
    headers: init && init.body ? { "Content-Type": "application/json" } : undefined,
    ...init,
  });
  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    throw new Error("unavailable");
  }
  if (!data || data.ok === false) {
    const reason = (data && data.reason) || "error";
    if (reason === "kv_not_configured") throw new Error("unavailable");
    throw new Error(reason);
  }
  return data;
}

function fmtTime(ts) {
  try {
    const d = new Date(ts);
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  } catch (_) {
    return "";
  }
}

function StarRow({ value, avg, count, onPick, disabled }) {
  const [hover, setHover] = useState(0);
  const active = hover || value || 0;
  return (
    <div className="rate-row" onMouseLeave={() => setHover(0)}>
      <div className="rate-stars" role="group" aria-label="打分">
        {STAR_LIST.map((s) => (
          <button
            key={s}
            type="button"
            className={`rate-star${s <= active ? " on" : ""}${value === s ? " mine" : ""}`}
            disabled={disabled}
            onMouseEnter={() => setHover(s)}
            onClick={() => onPick(s)}
            title={`${s} 星`}
            aria-label={`${s} 星`}
          >
            ★
          </button>
        ))}
      </div>
      <span className="rate-avg">
        {count > 0 ? `${avg.toFixed(1)}` : "—"}
        {count > 0 ? <em>（{count} 人）</em> : null}
      </span>
    </div>
  );
}

export default function PostMatch({ matchId, teamA, teamB, rosterA, rosterB }) {
  const [state, setState] = useState("loading"); // loading | ready | unavailable
  const [ratings, setRatings] = useState({});
  const [mine, setMine] = useState({});
  const [comments, setComments] = useState([]);
  const [nick, setNick] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [voter, setVoter] = useState("");

  const hasRoster = (rosterA && rosterA.length) || (rosterB && rosterB.length);

  useEffect(() => {
    const v = getVoter();
    setVoter(v);
    setNick(readLS("nnutv-nick"));
    let alive = true;
    (async () => {
      try {
        const [r, c] = await Promise.all([
          hasRoster ? callApi(`${API.ratings}?match=${encodeURIComponent(matchId)}&voter=${encodeURIComponent(v)}`) : Promise.resolve({ ratings: {}, mine: {} }),
          callApi(`${API.comments}?match=${encodeURIComponent(matchId)}`),
        ]);
        if (!alive) return;
        setRatings(r.ratings || {});
        setMine(r.mine || {});
        setComments(c.comments || []);
        setState("ready");
      } catch (e) {
        if (!alive) return;
        setState(e && e.message === "unavailable" ? "unavailable" : "error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [matchId, hasRoster]);

  const toastSoon = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2600);
  }, []);

  const pick = useCallback(
    async (playerId, stars) => {
      if (busy) return;
      setBusy(true);
      setMine((m) => ({ ...m, [playerId]: stars }));
      try {
        const d = await callApi(API.ratings, {
          method: "POST",
          body: JSON.stringify({ match: matchId, voter, playerId, stars }),
        });
        setRatings(d.ratings || {});
        setMine(d.mine || {});
      } catch (e) {
        toastSoon("评分提交失败，请稍后重试");
        // 回滚乐观更新
        try {
          const d = await callApi(`${API.ratings}?match=${encodeURIComponent(matchId)}&voter=${encodeURIComponent(voter)}`);
          setRatings(d.ratings || {});
          setMine(d.mine || {});
        } catch (_) {
          /* ignore */
        }
      } finally {
        setBusy(false);
      }
    },
    [busy, matchId, voter, toastSoon]
  );

  const submit = useCallback(async () => {
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true);
    const n = nick.trim() || "匿名";
    writeLS("nnutv-nick", n);
    try {
      const d = await callApi(API.comments, {
        method: "POST",
        body: JSON.stringify({ action: "add", match: matchId, nick: n, text: t }),
      });
      setComments(d.comments || []);
      setText("");
      toastSoon("已发布");
    } catch (e) {
      const r = e && e.message;
      toastSoon(
        r === "rate_limited"
          ? "发得太快了，歇一分钟再来"
          : r === "unavailable"
            ? "评论服务未启用"
            : "发布失败，请稍后重试"
      );
    } finally {
      setBusy(false);
    }
  }, [text, nick, busy, matchId, toastSoon]);

  const totalRated = useMemo(() => Object.keys(ratings).length, [ratings]);

  if (state === "loading") {
    return (
      <section className="panel post-match">
        <h2 className="panel-title">赛后评价</h2>
        <p className="pm-hint">加载中…</p>
      </section>
    );
  }

  if (state === "unavailable") {
    return (
      <section className="panel post-match">
        <h2 className="panel-title">赛后评价</h2>
        <p className="pm-hint">
          评分与评论服务尚未启用。需要在 EdgeOne Pages 控制台开通 KV 存储，并把命名空间绑定到本项目
          （变量名 <code>nnutv_kv</code>）后即可使用。
        </p>
      </section>
    );
  }

  if (state === "error") {
    return (
      <section className="panel post-match">
        <h2 className="panel-title">赛后评价</h2>
        <p className="pm-hint">服务暂时不可用，请稍后再试。</p>
      </section>
    );
  }

  const teamBlock = (name, roster) =>
    roster && roster.length ? (
      <div className="pm-team" key={name}>
        <div className="pm-team-name">{name}</div>
        {roster.map((p) => (
          <div className="pm-player" key={p.id}>
            <span className="pm-player-name">{p.nickname}</span>
            <StarRow
              value={mine[p.id] || 0}
              avg={(ratings[p.id] && ratings[p.id].avg) || 0}
              count={(ratings[p.id] && ratings[p.id].count) || 0}
              disabled={busy}
              onPick={(s) => pick(p.id, s)}
            />
          </div>
        ))}
      </div>
    ) : null;

  return (
    <section className="panel post-match">
      <h2 className="panel-title">赛后评价</h2>

      {hasRoster ? (
        <>
          <p className="pm-hint">
            给这场比赛的选手打个星（1～5），点击即可提交，可以随时改。
            {totalRated > 0 ? <span className="pm-mine-tip"> 你已评 {Object.keys(mine).length} 人</span> : null}
          </p>
          <div className="pm-teams">
            {teamBlock(teamA, rosterA)}
            {teamBlock(teamB, rosterB)}
          </div>
        </>
      ) : (
        <p className="pm-hint">本场比赛暂无选手数据，评分待补充数据后开放。</p>
      )}

      <h3 className="pm-subtitle">评论（{comments.length}）</h3>
      <div className="pm-form">
        <input
          className="pm-nick"
          type="text"
          maxLength={16}
          placeholder="昵称（可留空）"
          value={nick}
          onChange={(e) => setNick(e.target.value)}
          aria-label="昵称"
        />
        <textarea
          className="pm-text"
          maxLength={300}
          rows={3}
          placeholder="说点什么…（最多 300 字）"
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="评论内容"
        />
        <div className="pm-form-foot">
          <span className="pm-count">{text.length}/300</span>
          <button type="button" className="pm-submit" disabled={busy || !text.trim()} onClick={submit}>
            {busy ? "发送中…" : "发布"}
          </button>
        </div>
      </div>

      {toast ? <p className="pm-toast">{toast}</p> : null}

      {comments.length === 0 ? (
        <p className="pm-hint">还没有评论，来抢第一条。</p>
      ) : (
        <ul className="pm-list">
          {comments.map((c) => (
            <li className="pm-item" key={c.id}>
              <div className="pm-item-head">
                <span className="pm-item-nick">{c.nick}</span>
                <span className="pm-item-time">{fmtTime(c.ts)}</span>
              </div>
              <div className="pm-item-text">{c.text}</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
