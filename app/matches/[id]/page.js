import Link from "next/link";
import { notFound } from "next/navigation";
import { getMatch, loadMatches, loadPlayers, h2hMatrix } from "../../../lib/data";
import MapTabs from "./MapTabs";

export async function generateStaticParams() {
  return loadMatches().map((m) => ({ id: m.id }));
}

// 对位矩阵：B 方为行（压制视角），A 方为列
function H2HMatrix({ matrix, teamBName, teamAName }) {
  const players = loadPlayers();
  const { rows, cols, cells } = matrix;
  return (
    <div className="h2h-wrap">
      <div className="h2h-head">
        <span className="h2h-row-team">{teamBName}</span>
        <span className="h2h-col-team">{teamAName}</span>
      </div>
      <div className="h2h-grid">
        <div className="h2h-corner" />
        {cols.map((c) => (
          <div className="h2h-col-name" key={c.id}>
            {c.player?.nickname}
          </div>
        ))}
        {rows.map((r) => (
          <div className="h2h-row" key={r.id}>
            <div className="h2h-row-name">
              <Link href={`/players/${r.id}`}>{r.player?.nickname}</Link>
            </div>
            {cols.map((c) => {
              const cell = cells[`${r.id}|${c.id}`];
              const k = cell?.killed ?? 0;
              const d = cell?.death ?? 0;
              const net = k - d;
              const cls = net > 0 ? "pos-cell" : net < 0 ? "neg-cell" : "even-cell";
              return (
                <div className={`h2h-cell ${cls}`} key={c.id}>
                  <span className="h2h-k">{k}</span>
                  <span className="h2h-sep">:</span>
                  <span className="h2h-d">{d}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="h2h-legend">
        <span><i className="dot pos-cell" />行选手 击杀 列选手</span>
        <span><i className="dot neg-cell" />行选手 被列击杀</span>
        <span className="muted">（K:D = 压制击杀:被动）</span>
      </div>
    </div>
  );
}

export default async function MatchDetailPage({ params }) {
  const { id } = await params;
  const match = getMatch(id);
  if (!match) notFound();

  const aWon = match.scoreA > match.scoreB;
  const winScore = Math.max(match.scoreA, match.scoreB);
  const lossScore = Math.min(match.scoreA, match.scoreB);
  const matrix = h2hMatrix(id);
  const players = loadPlayers();

  return (
    <div>
      <h1 className="page-title">比赛详情 · {match.teamA} vs {match.teamB}</h1>

      <section className="panel">
        <div className="match-header">
          <div className="teams">
            <span className={aWon ? "winner" : "loser"}>{match.teamA}</span>
            {" vs "}
            <span className={!aWon ? "winner" : "loser"}>{match.teamB}</span>
          </div>
          <div className="big-score">
            <span className="s-win">{winScore}</span>
            <span className="sep">:</span>
            <span className="s-loss">{lossScore}</span>
          </div>
          <div className="meta">
            {match.date}{match.time ? ` ${match.time}` : ""} · {match.format} · {match.event}
          </div>
        </div>
      </section>

      {/* 多图切换（BO1 单图直接展示；BO3 提供地图 tab） */}
      <MapTabs match={match} players={players} />

      {/* 对位矩阵（全场聚合，不分图） */}
      {matrix.rows.length > 0 && (
        <section className="panel">
          <h2 className="panel-title">对位矩阵 · {match.teamB} (行) vs {match.teamA} (列)</h2>
          <H2HMatrix matrix={matrix} teamBName={match.teamB} teamAName={match.teamA} />
        </section>
      )}
    </div>
  );
}
