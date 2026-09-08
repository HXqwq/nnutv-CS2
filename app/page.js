import Link from "next/link";
import { loadMatches, loadPlayers, rankings, fmt } from "../lib/data";

export default function HomePage() {
  const matches = loadMatches().slice(0, 8);
  const top = rankings().slice(0, 10);
  const players = loadPlayers();
  const teams = [...new Set(players.map((p) => p.team))];

  return (
    <div>
      <div className="brand-banner">
        <div className="brand-text">
          <h2>NNUTV CS2</h2>
          <p></p>
        </div>
        <div className="brand-stats">
          <div className="stat"><b>{players.length}</b><span>选手</span></div>
          <div className="stat"><b>{teams.length}</b><span>战队</span></div>
          <div className="stat"><b>{matches.length}</b><span>近期比赛</span></div>
        </div>
      </div>

      <div className="two-col">
        <div>
          <section className="panel">
            <h2 className="panel-title">
              最新比赛 <span className="more"><Link href="/matches">查看全部 →</Link></span>
            </h2>
            {matches.length === 0 && <div className="empty">暂无比赛数据</div>}
            {matches.map((m) => {
              const aWon = m.scoreA > m.scoreB;
              const bWon = m.scoreB > m.scoreA;
              const same = m.scoreA === m.scoreB;
              return (
                <div className="match-row" key={m.id}>
                  <Link className="match-link" href={`/matches/${m.id}`}>
                    <span className="match-date">{m.date.slice(5)}</span>
                    <span className="match-main">
                      <span className={`match-team ${aWon ? "winner" : same ? "" : "loser"}`}>
                        <span className="team-name">{m.teamA}</span>
                      </span>
                      <span className="match-score">
                        <span className={aWon ? "win" : ""}>{aWon ? m.scoreA : m.scoreB}</span>
                        {" : "}
                        <span className={aWon ? "" : bWon ? "win" : ""}>{aWon ? m.scoreB : m.scoreA}</span>
                      </span>
                      <span className={`match-team ${bWon ? "winner" : same ? "" : "loser"}`}>
                        <span className="team-name">{m.teamB}</span>
                      </span>
                    </span>
                    <span className="match-event">{m.event}</span>
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
        </div>

        <aside className="sidebar">
          <div className="side-panel">
            <div className="side-title">最新结果</div>
            <ul className="side-list">
              {matches.slice(0, 6).map((m) => {
                const aWon = m.scoreA > m.scoreB;
                return (
                  <li key={m.id}>
                    <span className="time">{m.date.slice(5)}</span>
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
