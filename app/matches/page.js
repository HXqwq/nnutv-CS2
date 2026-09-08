import Link from "next/link";
import { loadMatches } from "../../lib/data";

export default function MatchesPage() {
  const matches = loadMatches();

  return (
    <div>
      <h1 className="page-title">比赛 · Matches</h1>
      <section className="panel">
        <h2 className="panel-title">全部比赛 · {matches.length} 场</h2>
        {matches.length === 0 && <div className="empty">暂无比赛数据</div>}
        {matches.map((m) => {
          const aWon = m.scoreA > m.scoreB;
          const bWon = m.scoreB > m.scoreA;
          return (
            <div className="match-row" key={m.id}>
              <Link className="match-link" href={`/matches/${m.id}`}>
                <span className="match-meta">
                  <span className="match-date">{m.date}</span>
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
    </div>
  );
}
