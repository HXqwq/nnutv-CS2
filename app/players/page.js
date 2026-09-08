import Link from "next/link";
import { aggregateAll, fmt } from "../../lib/data";

export default function PlayersPage() {
  const rows = aggregateAll().sort(
    (a, b) =>
      a.player.team.localeCompare(b.player.team) ||
      (b.avgRating ?? 0) - (a.avgRating ?? 0)
  );

  return (
    <div>
      <h1 className="page-title">选手 · Players</h1>
      {rows.length === 0 ? (
        <div className="panel empty">暂无选手数据</div>
      ) : (
        <div className="player-rows">
          {rows.map((r, i) => (
            <Link
              className="row-link"
              href={`/players/${r.player.id}`}
              key={r.player.id}
            >
              <div className="player-row">
                <span className="rank">{i + 1}</span>
                <div className="avatar">
                  {r.player.nickname.slice(0, 2).toUpperCase()}
                </div>
                <div className="info">
                  <span className="nick">{r.player.nickname}</span>
                  <span className="team">
                    {r.player.team} · {r.player.role}
                  </span>
                </div>
                <div className="kpis">
                  <span className="kpi">图数<b>{r.maps}</b></span>
                  <span className="kpi">K/D<b>{fmt(r.kd)}</b></span>
                  <span className="kpi">ADR<b>{fmt(r.avgAdr, 1)}</b></span>
                  <span className="kpi">HS%<b>{fmt(r.avgHs, 1)}</b></span>
                  <span className="kpi">Rating<b className={(r.avgRating ?? 0) >= 1.05 ? "rating-high" : ""}>{fmt(r.avgRating)}</b></span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
