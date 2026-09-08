import Link from "next/link";
import { statsRecords } from "../../lib/data";

export const metadata = {
  title: "数据之最 · Stats · NNUTV CS2",
};

export default function StatsPage() {
  const { overview, mapRecords, lopsided, careerKills, careerAssists, careerMaps } = statsRecords();

  const careerTables = [
    { title: "总击杀最多", rows: careerKills, fmt: (v) => v },
    { title: "总助攻最多", rows: careerAssists, fmt: (v) => v },
    { title: "参赛图数最多", rows: careerMaps, fmt: (v) => v },
  ];

  return (
    <div>
      <h1 className="page-title">数据之最 · Stats</h1>

      <section className="panel" style={{ marginBottom: 16 }}>
        <h2 className="panel-title">收录概览</h2>
        <div className="stat-cards">
          <div className="stat-card">
            <div className="label">收录比赛</div>
            <div className="value">{overview.totalMatches}</div>
          </div>
          <div className="stat-card">
            <div className="label">收录地图</div>
            <div className="value">{overview.totalMaps}</div>
          </div>
          <div className="stat-card">
            <div className="label">详细数据场次</div>
            <div className="value">{overview.matchesWithStats}</div>
          </div>
          <div className="stat-card">
            <div className="label">选手数据行</div>
            <div className="value">{overview.statRows}</div>
          </div>
          <div className="stat-card">
            <div className="label">注册选手</div>
            <div className="value">{overview.totalPlayers}</div>
          </div>
          <div className="stat-card">
            <div className="label">战队</div>
            <div className="value">{overview.totalTeams}</div>
          </div>
        </div>
        {lopsided && (
          <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>
            最大分差地图：
            <Link href={`/matches/${lopsided.matchId}`} className="rating-high">
              {lopsided.teams} {lopsided.score}
            </Link>
            <span className="muted">
              （{lopsided.mapName}，{lopsided.date}，净胜 {lopsided.diff} 分）
            </span>
          </p>
        )}
      </section>

      <section className="panel" style={{ marginBottom: 16 }}>
        <h2 className="panel-title">单图纪录 Top 3</h2>
        {overview.statRows === 0 ? (
          <div className="empty">暂无选手数据</div>
        ) : (
          <div className="rec-cards">
            {mapRecords.map((rec) => (
              <div className="rec-card" key={rec.label}>
                <div className="rec-title">{rec.label}</div>
                {rec.rows.length === 0 ? (
                  <div className="muted" style={{ fontSize: 12, padding: "10px 0" }}>
                    暂无数据
                  </div>
                ) : (
                  rec.rows.map((r, i) => (
                    <div className="rec-row" key={i}>
                      <span className="rec-rank muted">{i + 1}</span>
                      {r.player ? (
                        <Link href={`/players/${r.player.id}`} className="rec-player">
                          {r.player.nickname}
                        </Link>
                      ) : (
                        <span className="rec-player muted">未知选手</span>
                      )}
                      <span className="rec-val">{rec.show(r.val)}{rec.unit}</span>
                      <Link href={`/matches/${r.matchId}`} className="muted rec-match">
                        {r.mapName}
                      </Link>
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <h2 className="panel-title">生涯累计 Top 5</h2>
        {careerKills.length === 0 ? (
          <div className="empty">暂无选手数据</div>
        ) : (
          <div className="career-grid">
            {careerTables.map((t) => (
              <table className="tbl" key={t.title}>
                <thead>
                  <tr>
                    <th className="no-sort">#</th>
                    <th className="no-sort">选手</th>
                    <th className="no-sort">数值</th>
                    <th className="no-sort num">图数</th>
                  </tr>
                </thead>
                <tbody>
                  {t.rows.map((r, i) => (
                    <tr key={r.player.id}>
                      <td className="muted">{i + 1}</td>
                      <td className="player-cell">
                        <Link href={`/players/${r.player.id}`}>{r.player.nickname}</Link>
                      </td>
                      <td className="num rating-high">{t.fmt(r.val)}</td>
                      <td className="num muted">{r.maps}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ))}
          </div>
        )}
        <p className="muted" style={{ fontSize: 11, marginTop: 12 }}>
          * 单图纪录与生涯累计仅统计已收录详细选手数据的 {overview.matchesWithStats} 场比赛，其余场次为结果骨架，待补充数据后自动纳入计算。
        </p>
      </section>
    </div>
  );
}
