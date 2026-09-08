import Link from "next/link";
import { loadMatches, rankings, fmt } from "../lib/data";

export default function HomePage() {
  const matches = loadMatches().slice(0, 6);
  const top = rankings().slice(0, 8);

  return (
    <div>
      <h1 className="page-title">Counter-Strike News</h1>
      <div className="two-col">
        <section className="panel">
          <h2 className="panel-title">最近比赛</h2>
          {matches.length === 0 && <div className="empty">暂无比赛数据</div>}
          {matches.map((m) => (
            <div className="match-row" key={m.id}>
              <Link className="match-link" href={`/matches/${m.id}`}>
                <span className="match-date">{m.date.slice(5)}</span>
                <span className="match-main">
                  <span className={`match-team ${m.scoreA > m.scoreB ? "winner" : ""}`}>
                    <span className="team-name">{m.teamA}</span>
                  </span>
                  <span className="match-score">
                    <b>{m.scoreA > m.scoreB ? m.scoreA : m.scoreB}</b>
                    {" : "}
                    <b>{m.scoreA > m.scoreB ? m.scoreB : m.scoreA}</b>
                  </span>
                  <span className={`match-team ${m.scoreB > m.scoreA ? "winner" : ""}`}>
                    <span className="team-name">{m.teamB}</span>
                  </span>
                </span>
                <span className="match-event">{m.event}</span>
              </Link>
            </div>
          ))}
          <div style={{ padding: "10px 14px" }}>
            <Link href="/matches">查看全部比赛 →</Link>
          </div>
        </section>

        <section className="panel">
          <h2 className="panel-title">选手榜 · Rating</h2>
          <table className="tbl">
            <thead>
              <tr>
                <th className="no-sort">#</th>
                <th className="no-sort">选手</th>
                <th className="no-sort num">Rating</th>
                <th className="no-sort num">ADR</th>
              </tr>
            </thead>
            <tbody>
              {top.map((r, i) => (
                <tr key={r.player.id}>
                  <td className="muted">{i + 1}</td>
                  <td>
                    <Link href={`/players/${r.player.id}`}>{r.player.nickname}</Link>
                  </td>
                  <td className="num">{fmt(r.avgRating)}</td>
                  <td className="num">{fmt(r.avgAdr, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: "10px 14px" }}>
            <Link href="/rankings">完整排行榜 →</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
