import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getPlayer,
  loadPlayers,
  aggregateAll,
  sideAggregate,
  playerMatchHistory,
  playerSideHistory,
  playerPerformanceHistory,
  playerH2HHistory,
  getPlayerTransfers,
  fmt,
} from "../../../lib/data";

const TYPE_LABEL = {
  transfer: "转会",
  demote: "下放",
  rename: "改名",
  join: "加入",
};

export async function generateStaticParams() {
  return loadPlayers().map((p) => ({ id: p.id }));
}

// 半场对比：HLTV 风格 CT/T 双面板
function SideCompare({ side }) {
  const box = (cls, title, rows) => (
    <div className={`side-box ${cls}`}>
      <div className="side-head">{title}</div>
      {rows.map(([k, v]) => (
        <div className="side-row" key={k}>
          <span className="k">{k}</span>
          <span className="v">{v ?? "-"}</span>
        </div>
      ))}
    </div>
  );
  return (
    <div className="side-grid">
      {box("ct", "CT 方", [
        ["击杀", side.ctKills],
        ["死亡", side.ctDeaths],
        ["助攻", side.ctAssists],
        ["K/D", side.avgCtKd != null ? fmt(side.avgCtKd) : "-"],
        ["场均 ADR", side.avgCtAdr != null ? fmt(side.avgCtAdr, 1) : "-"],
        ["评分", side.avgCtRating != null ? fmt(side.avgCtRating) : "-"],
      ])}
      {box("t", "T 方", [
        ["击杀", side.tKills],
        ["死亡", side.tDeaths],
        ["助攻", side.tAssists],
        ["K/D", side.avgTKd != null ? fmt(side.avgTKd) : "-"],
        ["场均 ADR", side.avgTAdr != null ? fmt(side.avgTAdr, 1) : "-"],
        ["评分", side.avgTRating != null ? fmt(side.avgTRating) : "-"],
      ])}
    </div>
  );
}

// 表现数据进度条
function PerfBar({ label, value, suffix = "%", warn = false }) {
  if (value == null || Number.isNaN(value)) {
    return (
      <div className="perf-item">
        <div className="perf-label">{label}<span className="perf-val muted">-</span></div>
        <div className="perf-track"><div className="perf-fill" style={{ width: 0 }} /></div>
      </div>
    );
  }
  const v = warn ? Math.min(100, (value / 600) * 100) : Math.min(100, value);
  return (
    <div className="perf-item">
      <div className="perf-label">{label}<span className="perf-val">{value}{suffix}</span></div>
      <div className="perf-track"><div className="perf-fill" style={{ width: `${v}%` }} /></div>
    </div>
  );
}

// 多杀 / MVP卡片
function MultiKillCards({ mk, mvp, rws, we }) {
  return (
    <div className="mk-strip">
      {(["5K", "4K", "3K", "2K"]).map((k) => (
        <div className="mk-cell" key={k}>
          <div className="mk-num">{mk?.[k] ?? 0}</div>
          <div className="mk-label">{k}</div>
        </div>
      ))}
      <div className="mk-cell">
        <div className="mk-num accent">{mvp ?? 0}</div>
        <div className="mk-label">MVP</div>
      </div>
      <div className="mk-cell">
        <div className="mk-num">{fmt(rws, 1)}</div>
        <div className="mk-label">RWS</div>
      </div>
      <div className="mk-cell">
        <div className="mk-num">{fmt(we, 1)}</div>
        <div className="mk-label">WE</div>
      </div>
    </div>
  );
}

export default async function PlayerDetailPage({ params }) {
  const { id } = await params;
  const player = getPlayer(id);
  if (!player) notFound();

  const agg = aggregateAll().find((a) => a.player.id === id);
  const side = sideAggregate().find((a) => a.player.id === id);
  const history = playerMatchHistory(id);
  const sideHistory = playerSideHistory(id);
  const perfHistory = playerPerformanceHistory(id);
  const h2hHistory = playerH2HHistory(id);
  const transfers = getPlayerTransfers(id);
  const players = loadPlayers();

  // 合并出第一场比赛的表现(目前只有一场)
  const firstH2H = h2hHistory[0];

  return (
    <div>
      <div className="player-head">
        <div className={player.avatar ? "avatar" : "avatar av-fallback"}>
          {player.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={player.avatar} alt={player.nickname} />
          ) : (
            ""
          )}
        </div>
        <div>
          <h1>{player.nickname}</h1>
          <div className="sub">
            {player.team} · {player.role}
            {player.realName ? ` · ${player.realName}` : ""}
            {player.joined ? ` · 入社 ${player.joined}` : ""}
          </div>
          {player.steamId && (
            <div className="steam-id">
              <a
                href={`https://steamcommunity.com/profiles/${player.steamId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Steam {player.steamId}
              </a>
            </div>
          )}
        </div>
      </div>

      {agg ? (
        <>
          <div className="stat-cards">
            <div className="stat-card">
              <div className="label">图数</div>
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

          {/* 半场对比 */}
          {side && (side.ctN > 0 || side.tN > 0) && (
            <section className="panel">
              <h2 className="panel-title">半场表现对比</h2>
              <SideCompare side={side} />
            </section>
          )}

          {/* 表现数据 + 多杀 */}
          {perfHistory.map((ph, i) => (
            <section className="panel" key={i}>
              <h2 className="panel-title">
                表现数据 · {ph.map} vs {ph.opponent}
              </h2>
              <div className="perf-grid">
                <PerfBar label="精准度" value={ph.performance.accuracy} />
                <PerfBar label="急停成功率" value={ph.performance.stopSuccess} />
                <PerfBar label="拉枪成功率" value={ph.performance.spraySuccess} />
                <PerfBar label="补枪成功率" value={ph.performance.tradeSuccess} />
                <PerfBar label="反应时间" value={ph.performance.reactionMs} suffix="ms" warn />
                <PerfBar label="武器总价值" value={ph.performance.weaponValue} />
              </div>
              {ph.multiKills && (
                <div className="perf-bottom">
                  <MultiKillCards mk={ph.multiKills} mvp={ph.mvp} rws={ph.rws} we={ph.we} />
                </div>
              )}
            </section>
          ))}

          {/* 对位数据 */}
          {firstH2H && (
            <section className="panel">
              <h2 className="panel-title">对位数据 · {firstH2H.map} vs {firstH2H.opponent}</h2>
              <div className="h2h-list">
                <div className="h2h-head">
                  <span>对手</span><span>击杀</span><span>被杀</span><span>净值</span>
                </div>
                {Object.keys(firstH2H.h2h).map((oppId) => {
                  const opp = players.find((p) => p.id === oppId);
                  if (!opp) return null;
                  const e = firstH2H.h2h[oppId];
                  const net = (e.killed || 0) - (e.death || 0);
                  return (
                    <div className="h2h-row" key={oppId}>
                      <Link href={`/players/${opp.id}`} className="h2h-opp">{opp.nickname}</Link>
                      <span className="h2h-num pos">{e.killed ?? 0}</span>
                      <span className="h2h-num neg">{e.death ?? 0}</span>
                      <span className={`h2h-num ${net >= 0 ? "pos" : "neg"}`}>
                        {net > 0 ? `+${net}` : net}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className="panel">
            <h2 className="panel-title">比赛记录 · {history.length} 场</h2>
            {history.length === 0 ? (
              <div className="empty">该选手暂无比赛记录</div>
            ) : (
              <table className="tbl player-tbl">
                <thead>
                  <tr>
                    <th className="no-sort">日期</th>
                    <th className="no-sort">地图</th>
                    <th className="no-sort">对阵</th>
                    <th className="no-sort">比分</th>
                    <th className="no-sort">结果</th>
                    <th className="no-sort num">K / D / A</th>
                    <th className="no-sort num">ADR</th>
                    <th className="no-sort num">HS%</th>
                    <th className="no-sort num">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={i}>
                      <td className="muted">{h.date}</td>
                      <td>{h.map}</td>
                      <td className="player-cell">
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
                      <td className="num">{h.kills} / {h.deaths} / {h.assists}</td>
                      <td className="num">{fmt(h.adr, 1)}</td>
                      <td className="num">{h.hs ?? "-"}</td>
                      <td className={`num ${(h.rating ?? 0) >= 1.05 ? "rating-high" : ""}`}>
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

      {/* 转会记录（独立于比赛数据，无比赛记录的选手也可能有转会） */}
      {transfers.length > 0 && (
        <section className="panel">
          <h2 className="panel-title">转会记录 · {transfers.length} 条</h2>
          <div className="transfer-list">
            {transfers.map((tr) => {
              const label = TYPE_LABEL[tr.type] || tr.type;
              let desc;
              if (tr.type === "demote") {
                desc = `在 ${tr.from} 下放`;
              } else if (tr.type === "join") {
                desc = `加入 ${tr.to}`;
              } else if (tr.to === "No Team") {
                desc = `从 ${tr.from} 转出至 No Team`;
              } else {
                desc = `从 ${tr.from} 转入 ${tr.to}`;
              }
              return (
                <div className="transfer-row" key={tr.id}>
                  <span className="transfer-date">{tr.date}</span>
                  <span className={`transfer-tag ${tr.type}`}>{label}</span>
                  <span className="transfer-desc">{desc}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
