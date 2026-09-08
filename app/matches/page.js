import Link from "next/link";
import { loadMatches } from "../../lib/data";

export default function MatchesPage() {
  const matches = loadMatches();

  return (
    <div>
      <h1 className="page-title">比赛列表</h1>
      <section className="panel">
        {matches.length === 0 && <div className="empty">暂无比赛数据</div>}
        {matches.map((m) => (
          <div className="match-row" key={m.id}>
            <Link className="match-link" href={`/matches/${m.id}`}>
              <span className="match-date">{m.date}</span>
              <span className="match-main">
                <span className={`match-team ${m.scoreA > m.scoreB ? "winner" : ""}`}>
                  <span className="team-name">{m.teamA}</span>
                </span>
                <span className="match-score">
                  <b>{m.scoreA}</b> : <b>{m.scoreB}</b>
                </span>
                <span className={`match-team ${m.scoreB > m.scoreA ? "winner" : ""}`}>
                  <span className="team-name">{m.teamB}</span>
                </span>
              </span>
              <span className="match-event">
                {m.format} · {m.event}
              </span>
            </Link>
          </div>
        ))}
      </section>
    </div>
  );
}
