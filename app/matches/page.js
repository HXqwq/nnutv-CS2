import Link from "next/link";
import { loadMatches } from "../../lib/data";
import { isScheduled } from "../../lib/match-status";

export default function MatchesPage() {
  const matches = loadMatches();

  return (
    <div>
      <h1 className="page-title">比赛 · Matches</h1>
      <section className="panel">
        <h2 className="panel-title">全部比赛 · {matches.length} 场</h2>
        {matches.length === 0 && <div className="empty">暂无比赛数据</div>}
        {matches.map((m) => {
          const soon = isScheduled(m);
          const aWon = !soon && m.scoreA > m.scoreB;
          const bWon = !soon && m.scoreB > m.scoreA;
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
                  {soon && <span className="pill-soon">即将开始</span>}
                </span>
                <span className="match-main">
                  <span className={`match-team ${soon ? "" : aWon ? "winner" : "loser"}`}>
                    <span className="team-name">{m.teamA}</span>
                  </span>
                  <span className="match-score">
                    {soon ? (
                      <span className="vs">VS</span>
                    ) : (
                      <>
                        <span className={aWon ? "win" : ""}>{m.scoreA}</span>
                        {" : "}
                        <span className={bWon ? "win" : ""}>{m.scoreB}</span>
                      </>
                    )}
                  </span>
                  <span className={`match-team ${soon ? "" : bWon ? "winner" : "loser"}`}>
                    <span className="team-name">{m.teamB || "待定"}</span>
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
