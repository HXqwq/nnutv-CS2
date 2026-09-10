import Link from "next/link";
import { loadEvents, loadMatches } from "../../lib/data";

export default function EventsPage() {
  const events = loadEvents();
  const matches = loadMatches();

  return (
    <div>
      <h1 className="page-title">赛事 · Events</h1>
      {events.length === 0 && (
        <div className="panel empty">暂无赛事数据</div>
      )}
      {events.map((ev) => {
        const evMatches = matches.filter((m) => m.event === ev.name);
        const isOngoing = ev.status === "ongoing";
        return (
          <div className="event-card" key={ev.id}>
            <div className="event-card-head">
              <div className="team-badge">{ev.name.slice(0, 3).toUpperCase()}</div>
              <div>
                <h2>{ev.name}</h2>
                <div className="team-meta">
                  {ev.season}
                  {isOngoing ? " · 进行中" : " · 已结束"}
                  {` · ${evMatches.length} 场比赛`}
                </div>
              </div>
              {isOngoing && (
                <span className="live-pill">LIVE</span>
              )}
            </div>

            {ev.description && <p className="event-desc">{ev.description}</p>}

            {ev.livestream && (
              <div className="event-live">
                <span className="event-live-label">赛事直播间</span>
                <a href={ev.livestream.url} target="_blank" rel="noopener noreferrer">
                  {ev.livestream.platform} · {ev.livestream.note || ev.livestream.url}
                </a>
              </div>
            )}

            <details className="event-details" open={isOngoing}>
              <summary className="event-details-toggle">
                {isOngoing ? "赛事详情" : "展开往期赛事详情"}
                <span className="event-details-arrow">▾</span>
              </summary>
              <div className="event-details-body">
                {ev.replays && ev.replays.length > 0 && (
                  <div className="event-replays">
                    <div className="event-replays-title">往期赛事回放</div>
                    {ev.replays.map((r) => (
                      <a
                        className="replay-row"
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        key={r.url}
                      >
                        <span className="replay-stage">{r.stage}</span>
                        <span className="replay-name">{r.title}</span>
                        <span className="replay-duration muted">{r.duration}</span>
                        <span className="replay-external">↗</span>
                      </a>
                    ))}
                  </div>
                )}

                {evMatches.length > 0 && (
                  <div className="event-replays">
                    <div className="event-replays-title">已收录比赛数据</div>
                    {evMatches.map((m) => {
                      const aWon = m.scoreA > m.scoreB;
                      return (
                        <Link className="replay-row" href={`/matches/${m.id}`} key={m.id}>
                          <span className="replay-stage">{m.stage}</span>
                          <span className="replay-name">
                            {m.teamA} <span className={aWon ? "win" : ""}>{m.scoreA}</span>
                            {" : "}
                            <span className={!aWon ? "win" : ""}>{m.scoreB}</span> {m.teamB}
                          </span>
                          <span className="replay-duration muted">{m.date}</span>
                          <span className="replay-external">›</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </details>
          </div>
        );
      })}
    </div>
  );
}
