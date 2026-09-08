"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import playersData from "../../data/players.json";
import teamsData from "../../data/teams.json";
import matchesData from "../../data/matches.json";

// SSR/预渲染时无 window，返回空；客户端首挂载时读 URL 的 ?q=
function initialQ() {
  if (typeof window === "undefined") return "";
  try {
    return new URLSearchParams(window.location.search).get("q") || "";
  } catch {
    return "";
  }
}

const matchFields = (m) => [
  m.teamA,
  m.teamB,
  m.event,
  m.stage,
  m.format,
  m.date,
  ...(Array.isArray(m.maps) ? m.maps.map((mp) => mp.map) : []),
];

const hit = (term, fields) =>
  fields.some((f) => f && String(f).toLowerCase().includes(term));

export default function SearchInner() {
  const [q, setQ] = useState(initialQ);

  // 已在 /search 页时，顶栏搜索框再搜索 → 同步关键词（跨页由 URL ?q= 初始化）
  useEffect(() => {
    const onSearch = (e) => setQ(e.detail || "");
    window.addEventListener("nnutv-search", onSearch);
    return () => window.removeEventListener("nnutv-search", onSearch);
  }, []);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return null;
    return {
      players: playersData.filter((p) => hit(term, [p.nickname, p.realName, p.team])),
      teams: teamsData.filter((t) => hit(term, [t.name, t.shortName, t.country])),
      matches: matchesData.filter((m) => hit(term, matchFields(m))),
    };
  }, [q]);

  const total = results
    ? results.players.length + results.teams.length + results.matches.length
    : 0;

  return (
    <div>
      <h1 className="search-title">站内搜索</h1>

      <input
        className="search-input"
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="输入选手、战队、比赛队伍、地图、赛事名…"
        autoFocus
      />

      {results === null ? (
        <div className="search-hint">
          输入关键词即可搜索全部选手、战队与比赛（支持队名、选手 ID、真名、地图、赛事、日期）。
        </div>
      ) : total === 0 ? (
        <div className="search-hint">
          没有找到与「{q.trim()}」相关的选手、战队或比赛。
        </div>
      ) : (
        <>
          <div className="search-hint">
            「{q.trim()}」共匹配 {total} 条结果：选手 {results.players.length} · 战队{" "}
            {results.teams.length} · 比赛 {results.matches.length}
          </div>

          {results.players.length > 0 && (
            <section className="search-section">
              <h2>选手</h2>
              <div className="search-rows">
                {results.players.map((p) => (
                  <Link className="search-row" href={`/players/${p.id}`} key={p.id}>
                    <div className={p.avatar ? "avatar" : "avatar av-fallback"}>
                      {p.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.avatar} alt={p.nickname} />
                      ) : (
                        ""
                      )}
                    </div>
                    <span className="sr-name">{p.nickname}</span>
                    {p.realName ? <span className="sr-sub">{p.realName}</span> : null}
                    <span className="sr-sub sr-right">{p.team || "无战队"}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {results.teams.length > 0 && (
            <section className="search-section">
              <h2>战队</h2>
              <div className="search-rows">
                {results.teams.map((t) => (
                  <Link className="search-row" href={`/teams#${t.id}`} key={t.id}>
                    <span className="sr-name">{t.name}</span>
                    {t.shortName && t.shortName !== t.name ? (
                      <span className="sr-sub">{t.shortName}</span>
                    ) : null}
                    <span className="sr-sub sr-right">{t.country || ""}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {results.matches.length > 0 && (
            <section className="search-section">
              <h2>比赛</h2>
              <div className="search-rows">
                {results.matches.map((m) => {
                  const aWon = m.scoreA > m.scoreB;
                  const bWon = m.scoreB > m.scoreA;
                  return (
                    <Link className="search-row search-row-match" href={`/matches/${m.id}`} key={m.id}>
                      <span className="sr-name">
                        <span className={`sr-team ${aWon ? "sr-win" : ""}`}>{m.teamA}</span>
                        <span className="sr-score">
                          <span className={aWon ? "sr-win" : ""}>{m.scoreA}</span>
                          {" : "}
                          <span className={bWon ? "sr-win" : ""}>{m.scoreB}</span>
                        </span>
                        <span className={`sr-team ${bWon ? "sr-win" : ""}`}>{m.teamB}</span>
                      </span>
                      <span className="sr-sub sr-right">
                        {m.date} · {m.format}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
