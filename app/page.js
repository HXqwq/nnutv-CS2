import Link from "next/link";
import { loadMatches, loadPlayers, rankings, fmt, getPlayerOfTheWeek, getRecentTransfers } from "../lib/data";

export default function HomePage() {
  const matches = loadMatches().slice(0, 8);
  const top = rankings().slice(0, 10);
  const players = loadPlayers();
  const teams = [...new Set(players.map((p) => p.team))];
  const pow = getPlayerOfTheWeek();
  const transfers = getRecentTransfers(11);
  const playersById = new Map(players.map((p) => [p.id, p]));

  return (
    <div>
      <div className="brand-banner">
        <div className="brand-text">
          <img className="brand-logo" src="/logo.png" alt="NNUTV" />
          <h2>NNUTV</h2>
        </div>
        <div className="brand-stats">
          <div className="stat"><b>{players.length}</b><span>选手</span></div>
          <div className="stat"><b>{teams.length}</b><span>战队</span></div>
          <div className="stat"><b>{matches.length}</b><span>近期比赛</span></div>
        </div>
      </div>

      <div className="two-col">
        <div>
          <section className="panel pow-panel">
            <h2 className="panel-title">
              Player of the Week
              {pow && (
                <span className="pow-range">{pow.week.start} ~ {pow.week.end}</span>
              )}
            </h2>
            {!pow ? (
              <div className="empty">暂无选手数据</div>
            ) : (
              <div className="pow-body">
                <div className="pow-avatar">
                  {pow.player.avatar ? (
                    <img src={pow.player.avatar} alt={pow.player.nickname} />
                  ) : (
                    <div className="av-fallback" />
                  )}
                </div>
                <div className="pow-info">
                  <div className="pow-nickname">
                    <Link href={`/players/${pow.player.id}`}>{pow.player.nickname}</Link>
                  </div>
                  <div className="pow-subtitle">Player of the week</div>
                  <div className="pow-stats">
                    <div className="pow-stat">
                      <span className="pow-value">{fmt(pow.avgRating)}</span>
                      <span className="pow-label">平均 Rating / map</span>
                    </div>
                    <div className="pow-stat">
                      <span className="pow-value">{pow.maps}</span>
                      <span className="pow-label">出场地图数</span>
                    </div>
                    {pow.avgAdr != null && (
                      <div className="pow-stat">
                        <span className="pow-value">{Math.round(pow.avgAdr)}</span>
                        <span className="pow-label">ADR / map</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="panel">
            <h2 className="panel-title">
              最新比赛 <span className="more"><Link href="/matches">查看全部 →</Link></span>
            </h2>
            {matches.length === 0 && <div className="empty">暂无比赛数据</div>}
            {matches.map((m) => {
              const aWon = m.scoreA > m.scoreB;
              const bWon = m.scoreB > m.scoreA;
              return (
                <div className="match-row" key={m.id}>
                  <Link className="match-link" href={`/matches/${m.id}`}>
                <span className="match-meta">
                  <span className="match-date">
                    {m.time ? `${m.date.slice(5)} ${m.time}` : m.date.slice(5)}
                  </span>
                  <span className="dot">·</span>
                  <span>{m.format}</span>
                  <span className="dot">·</span>
                  <span className="match-event">{m.event}</span>
                </span>
                    <span className="match-main">
                      <span className={`match-team ${aWon ? "winner" : "loser"}`}>
                        <span className="team-name">{m.teamA}</span>
                      </span>
                      <span className="match-score">
                        <span className={aWon ? "win" : ""}>{m.scoreA}</span>
                        {" : "}
                        <span className={bWon ? "win" : ""}>{m.scoreB}</span>
                      </span>
                      <span className={`match-team ${bWon ? "winner" : "loser"}`}>
                        <span className="team-name">{m.teamB}</span>
                      </span>
                    </span>
                  </Link>
                </div>
              );
            })}
          </section>

          <section className="panel">
            <h2 className="panel-title">
              Top 选手 · Rating
              <span className="more"><Link href="/rankings">完整排行榜 →</Link></span>
            </h2>
            <table className="tbl">
              <thead>
                <tr>
                  <th className="no-sort">#</th>
                  <th className="no-sort">选手</th>
                  <th className="no-sort">队伍</th>
                  <th className="no-sort num">图数</th>
                  <th className="no-sort num">K/D</th>
                  <th className="no-sort num">ADR</th>
                  <th className="no-sort num">HS%</th>
                  <th className="no-sort num">Rating</th>
                </tr>
              </thead>
              <tbody>
                {top.map((r, i) => (
                  <tr key={r.player.id}>
                    <td className="muted">{i + 1}</td>
                    <td className="player-cell">
                      <Link href={`/players/${r.player.id}`}>{r.player.nickname}</Link>
                    </td>
                    <td className="muted">{r.player.team}</td>
                    <td className="num">{r.maps}</td>
                    <td className="num">{fmt(r.kd)}</td>
                    <td className="num">{fmt(r.avgAdr, 1)}</td>
                    <td className="num">{fmt(r.avgHs, 1)}</td>
                    <td className={`num ${(r.avgRating ?? 0) >= 1.05 ? "rating-high" : ""}`}>
                      {fmt(r.avgRating)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="panel transfers-panel">
            <h2 className="panel-title">
              转会信息
              {transfers.length > 0 && <span className="more"><Link href="/teams">查看战队 →</Link></span>}
            </h2>
            {transfers.length === 0 ? (
              <div className="empty">暂无转会记录</div>
            ) : (
              <ul className="transfers-list">
                {transfers.map((t) => {
                  const player = playersById.get(t.playerId);
                  const tagClass = t.type === "transfer" ? "tag-transfer" : "tag-demote";
                  const tagLabel = t.type === "transfer" ? "转会" : "下放";
                  const fromText = t.from || "No Team";
                  const toText = t.to || "No Team";
                  return (
                    <li className="transfer-row" key={t.id}>
                      <span className={`transfer-tag ${tagClass}`}>{tagLabel}</span>
                      <Link className="transfer-player" href={`/players/${t.playerId}`}>
                        {player?.nickname || t.playerId}
                      </Link>
                      <span className="transfer-route">
                        <span className="transfer-team">{fromText}</span>
                        <span className="transfer-arrow">→</span>
                        <span className="transfer-team">{toText}</span>
                      </span>
                      <span className="transfer-date">{t.date}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <aside className="sidebar">
          <div className="side-panel">
            <div className="side-title">最新结果</div>
            <ul className="side-list">
              {matches.slice(0, 6).map((m) => {
                const aWon = m.scoreA > m.scoreB;
                return (
                  <li key={m.id}>
                    <span className="time">
                      {m.time ? `${m.date.slice(5)} ${m.time}` : m.date.slice(5)}
                    </span>
                    <span className="title">
                      <Link href={`/matches/${m.id}`} style={{ color: "inherit" }}>
                        {aWon ? m.teamA : m.teamB} 胜 {aWon ? m.teamB : m.teamA}
                      </Link>
                    </span>
                    <span className="badge-mini done">终</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="side-panel">
            <div className="side-title">近期赛事</div>
            <ul className="side-list">
              {[...new Set(loadMatches().map((m) => m.event))].slice(0, 6).map((e) => (
                <li key={e}>
                  <span className="badge-mini live">赛</span>
                  <span className="title">{e}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="side-panel">
            <div className="side-title">战队</div>
            <ul className="side-list">
              {teams.map((t) => (
                <li key={t}>
                  <span className="badge-mini soon">TE</span>
                  <span className="title">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
