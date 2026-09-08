import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlayer, loadPlayers, aggregateAll, playerMatchHistory, fmt } from "../../../lib/data";

export async function generateStaticParams() {
  return loadPlayers().map((p) => ({ id: p.id }));
}

export default async function PlayerDetailPage({ params }) {
  const { id } = await params;
  const player = getPlayer(id);
  if (!player) notFound();

  const agg = aggregateAll().find((a) => a.player.id === id);
  const history = playerMatchHistory(id);

  return (
    <div>
      <div className="player-head">
        <div className="avatar">{player.nickname.slice(0, 2).toUpperCase()}</div>
        <div>
          <h1>{player.nickname}</h1>
          <div className="sub">
            {player.team} · {player.role}
            {player.realName ? ` · ${player.realName}` : ""}
            {player.joined ? ` · 入社 ${player.joined}` : ""}
          </div>
        </div>
      </div>

      {agg ? (
        <>
          <div className="stat-cards">
            <div className="stat-card">
              <div className="label">地图数</div>
              <div className="value">{agg.maps}</div>
            </div>
            <div className="stat-card">
              <div className="label">胜率</div>
              <div className="value">{Math.round(agg.winRate * 100)}%</div>
            </div>
            <div className="stat-card">
              <div className="label">总击杀</div>
              <div className="value">{agg.kills}</div>
            </div>
            <div className="stat-card">
              <div className="label">K/D</div>
              <div className="value">{fmt(agg.kd)}</div>
            </div>
            <div className="stat-card">
              <div className="label">场均 ADR</div>
              <div className="value">{fmt(agg.avgAdr, 1)}</div>
            </div>
            <div className="stat-card">
              <div className="label">平均 Rating</div>
              <div className="value">{fmt(agg.avgRating)}</div>
            </div>
          </div>

          <section className="panel">
            <h2 className="panel-title">比赛记录</h2>
            {history.length === 0 ? (
              <div className="empty">该选手暂无比赛记录</div>
            ) : (
              <table className="tbl">
                <thead>
                  <tr>
                    <th className="no-sort">日期</th>
                    <th className="no-sort">赛事</th>
                    <th className="no-sort">地图</th>
                    <th className="no-sort">对阵</th>
                    <th className="no-sort">比分</th>
                    <th className="no-sort">结果</th>
                    <th className="no-sort num">K</th>
                    <th className="no-sort num">D</th>
                    <th className="no-sort num">A</th>
                    <th className="no-sort num">ADR</th>
                    <th className="no-sort num">HS%</th>
                    <th className="no-sort num">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={i}>
                      <td className="muted">{h.date}</td>
                      <td className="muted">{h.event}</td>
                      <td>{h.map}</td>
                      <td>
                        <Link href={`/matches/${h.matchId}`}>{h.opponent}</Link>
                      </td>
                      <td className="num">
                        {h.side === "A" ? `${h.scoreA}:${h.scoreB}` : `${h.scoreB}:${h.scoreA}`}
                      </td>
                      <td>
                        <span className={`badge ${h.won ? "w" : "l"}`}>
                          {h.won ? "胜" : "负"}
                        </span>
                      </td>
                      <td className="num">{h.kills}</td>
                      <td className="num">{h.deaths}</td>
                      <td className="num">{h.assists}</td>
                      <td className="num">{fmt(h.adr, 1)}</td>
                      <td className="num">{h.hs ?? "-"}</td>
                      <td className="num" style={{ fontWeight: 600 }}>
                        {fmt(h.rating)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      ) : (
        <div className="panel empty">该选手暂无比赛数据</div>
      )}
    </div>
  );
}
