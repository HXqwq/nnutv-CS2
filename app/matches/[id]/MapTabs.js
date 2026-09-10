"use client";

import { useState } from "react";
import Link from "next/link";

// 纯函数格式化（避免 client 端 import 依赖 fs 的 lib/data）
function fmt(n, digits = 2) {
  if (n == null || Number.isNaN(n)) return "-";
  return n.toFixed(digits);
}

// 单队数据表
function StatsTable({ stats, side, teamName, scoreA, scoreB, players }) {
  const rows = stats
    .filter((s) => s.side === side)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  const teamScore = side === "A" ? scoreA : scoreB;

  if (rows.length === 0) {
    return (
      <div>
        <div className="map-team-label">
          <span>{teamName}</span>
          <span className="team-score-mini">{teamScore} 分</span>
        </div>
        <div className="empty">选手数据待补充（占位，后续补充）</div>
      </div>
    );
  }

  return (
    <div>
      <div className="map-team-label">
        <span>{teamName}</span>
        <span className="team-score-mini">{teamScore} 分</span>
      </div>
      <table className="tbl">
        <thead>
          <tr>
            <th className="no-sort">选手</th>
            <th className="no-sort num">K</th>
            <th className="no-sort num">D</th>
            <th className="no-sort num">A</th>
            <th className="no-sort num">+/-</th>
            <th className="no-sort num">ADR</th>
            <th className="no-sort num">HS%</th>
            <th className="no-sort num">Rating</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => {
            const p = players.find((x) => x.id === s.playerId);
            const diff = s.kills - s.deaths;
            const rating = s.rating ?? 0;
            return (
              <tr key={s.playerId}>
                <td className="player-cell">
                  {p && (
                    p.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="mini-av" src={p.avatar} alt={p.nickname} />
                    ) : (
                      <span className="mini-av av-fallback" />
                    )
                  )}
                  {p ? <Link href={`/players/${p.id}`}>{p.nickname}</Link> : s.playerId}
                </td>
                <td className="num">{s.kills}</td>
                <td className="num">{s.deaths}</td>
                <td className="num">{s.assists}</td>
                <td className={`num ${diff >= 0 ? "pos" : "neg"}`}>
                  {diff > 0 ? `+${diff}` : diff}
                </td>
                <td className="num">{fmt(s.adr, 1)}</td>
                <td className="num">{s.hs ?? "-"}</td>
                <td className={`num ${rating >= 1.05 ? "rating-high" : ""}`}>{fmt(rating)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// 半场 split 表
function HalfTimeTable({ stats, side, teamName, players }) {
  const rows = stats
    .filter((s) => s.side === side && (s.ctStats || s.tStats))
    .sort((a, b) => (b.kills - b.deaths) - (a.kills - a.deaths));

  return (
    <div>
      <div className="map-team-label"><span>{teamName}</span></div>
      <table className="tbl">
        <thead>
          <tr>
            <th className="no-sort" rowSpan="2">选手</th>
            <th className="no-sort num" colSpan="3">CT方</th>
            <th className="no-sort num" colSpan="3">T方</th>
          </tr>
          <tr>
            <th className="no-sort num">K</th>
            <th className="no-sort num">D</th>
            <th className="no-sort num">ADR</th>
            <th className="no-sort num">K</th>
            <th className="no-sort num">D</th>
            <th className="no-sort num">ADR</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => {
            const p = players.find((x) => x.id === s.playerId);
            const ct = s.ctStats || {};
            const t = s.tStats || {};
            return (
              <tr key={s.playerId}>
                <td className="player-cell">
                  {p && (
                    p.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="mini-av" src={p.avatar} alt={p.nickname} />
                    ) : (
                      <span className="mini-av av-fallback" />
                    )
                  )}
                  {p ? <Link href={`/players/${p.id}`}>{p.nickname}</Link> : s.playerId}
                </td>
                <td className="num">{ct.kills ?? "-"}</td>
                <td className="num">{ct.deaths ?? "-"}</td>
                <td className="num">{fmt(ct.adr, 1)}</td>
                <td className="num">{t.kills ?? "-"}</td>
                <td className="num">{t.deaths ?? "-"}</td>
                <td className="num">{fmt(t.adr, 1)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// 多图切换容器：tab 栏 + 选中图的数据
export default function MapTabs({ match, players }) {
  const maps = match.maps || [];
  const [active, setActive] = useState(0);
  const cur = maps[active] || maps[0];

  if (maps.length === 0) {
    return <div className="empty">暂无地图数据</div>;
  }

  // 单图（BO1）不显示 tab 栏
  const single = maps.length === 1;

  return (
    <div>
      {!single && (
        <div className="map-tabs">
          {maps.map((map, idx) => (
            <button
              key={idx}
              className={`map-tab ${idx === active ? "active" : ""}`}
              onClick={() => setActive(idx)}
            >
              <span className="map-tab-name">
                {map.map && map.map !== "待补充" ? map.map : `第${idx + 1}图`}
              </span>
              <span className="map-tab-score">
                {map.scoreA} : {map.scoreB}
              </span>
            </button>
          ))}
        </div>
      )}

      {cur && (
        <section className="panel">
          <div className="map-head">
            <span className="map-name">
              {cur.map && cur.map !== "待补充" ? cur.map : `第${active + 1}图`}
            </span>
            <span className={`map-score ${cur.scoreA > cur.scoreB ? "pos" : "neg"}`}>
              {cur.scoreA} : {cur.scoreB}
            </span>
          </div>
          <StatsTable
            stats={cur.stats || []}
            side="A"
            teamName={match.teamA}
            scoreA={cur.scoreA}
            scoreB={cur.scoreB}
            players={players}
          />
          <StatsTable
            stats={cur.stats || []}
            side="B"
            teamName={match.teamB}
            scoreA={cur.scoreA}
            scoreB={cur.scoreB}
            players={players}
          />
        </section>
      )}

      {cur && cur.stats && cur.stats.some((s) => s.ctStats || s.tStats) && (
        <section className="panel">
          <h2 className="panel-title">半场表现 · {cur.map && cur.map !== "待补充" ? cur.map : `第${active + 1}图`}</h2>
          <HalfTimeTable stats={cur.stats} side="A" teamName={match.teamA} players={players} />
          <HalfTimeTable stats={cur.stats} side="B" teamName={match.teamB} players={players} />
        </section>
      )}
    </div>
  );
}
