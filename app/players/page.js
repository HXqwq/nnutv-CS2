import Link from "next/link";
import { aggregateAll, fmt } from "../../lib/data";

export default function PlayersPage() {
  const rows = aggregateAll().sort((a, b) =>
    a.player.team.localeCompare(b.player.team) || (b.avgRating ?? 0) - (a.avgRating ?? 0)
  );

  return (
    <div>
      <h1 className="page-title">选手</h1>
      {rows.length === 0 ? (
        <div className="panel empty">暂无选手数据</div>
      ) : (
        <div className="player-cards">
          {rows.map((r) => (
            <Link
              href={`/players/${r.player.id}`}
              key={r.player.id}
              style={{ color: "inherit" }}
            >
              <div className="player-card">
                <div className="avatar">{r.player.nickname.slice(0, 2).toUpperCase()}</div>
                <div className="info">
                  <span className="nick">{r.player.nickname}</span>
                  <span className="sub">
                    {r.player.team} · {r.player.role}
                  </span>
                  <span className="sub">
                    Rating {fmt(r.avgRating)} · {r.maps} 图
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
