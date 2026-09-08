import Link from "next/link";
import { loadPlayers, aggregateAll, fmt } from "../../lib/data";

export default function PlayersPage() {
  const players = loadPlayers();
  const statsById = new Map(aggregateAll().map((a) => [a.player.id, a]));

  // 全部选手都展示（没打过比赛的排在有数据的之后），有数据的按评分排
  const rows = players
    .map((p) => ({ player: p, stats: statsById.get(p.id) || null }))
    .sort(
      (a, b) =>
        a.player.team.localeCompare(b.player.team) ||
        Number(Boolean(b.stats)) - Number(Boolean(a.stats)) ||
        (b.stats?.avgRating ?? 0) - (a.stats?.avgRating ?? 0) ||
        a.player.nickname.localeCompare(b.player.nickname)
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
                <div className={r.player.avatar ? "avatar" : "avatar av-fallback"}>
                  {r.player.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.player.avatar} alt={r.player.nickname} />
                  ) : (
                    ""
                  )}
                </div>
                <div className="info">
                  <span className="nick">{r.player.nickname}</span>
                  <span className="team">
                    {r.player.team}
                    {r.player.role ? ` · ${r.player.role}` : ""}
                    {!r.stats ? " · 暂无比赛" : ""}
                  </span>
                </div>
                <div className="kpis">
                  <span className="kpi">图数<b>{r.stats?.maps ?? "-"}</b></span>
                  <span className="kpi">K/D<b>{r.stats ? fmt(r.stats.kd) : "-"}</b></span>
                  <span className="kpi">ADR<b>{r.stats ? fmt(r.stats.avgAdr, 1) : "-"}</b></span>
                  <span className="kpi">HS%<b>{r.stats ? fmt(r.stats.avgHs, 1) : "-"}</b></span>
                  <span className="kpi">Rating<b className={(r.stats?.avgRating ?? 0) >= 1.05 ? "rating-high" : ""}>{r.stats ? fmt(r.stats.avgRating) : "-"}</b></span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
