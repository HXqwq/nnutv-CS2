import Link from "next/link";
import { notFound } from "next/navigation";
import { getMatch, loadMatches, loadPlayers, h2hMatrix, fmt } from "../../../lib/data";

export async function generateStaticParams() {
  return loadMatches().map((m) => ({ id: m.id }));
}

function StatsTable({ stats, side, teamName, scoreA, scoreB }) {
  const players = loadPlayers();
  const rows = stats
    .filter((s) => s.side === side)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  const teamScore = side === "A" ? scoreA : scoreB;

  return (
    <div>
      <div className="map-team-label">
        <span>{teamName}</span>
        <span className="team-score-mini">{teamScore} 分</span>
      </div>
      <table className="tbl">
        <thead>
          <tr>
            <th className="no-sort">选手</th>
            <th className="no-sort num">K</th>
            <th className="no-sort num">D</th>
            <th className="no-sort num">A</th>
            <th className="no-sort num">+/-</th>
            <th className="no-sort num">ADR</th>
            <th className="no-sort num">HS%</th>
            <th className="no-sort num">Rating</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => {
            const p = players.find((x) => x.id === s.playerId);
            const diff = s.kills - s.deaths;
            const rating = s.rating ?? 0;
            return (
              <tr key={s.playerId}>
                <td className="player-cell">
                  {p && p.avatar && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="mini-av" src={p.avatar} alt={p.nickname} />
                  )}
                  {p ? <Link href={`/players/${p.id}`}>{p.nickname}</Link> : s.playerId}
                </td>
                <td className="num">{s.kills}</td>
                <td className="num">{s.deaths}</td>
                <td className="num">{s.assists}</td>
                <td className={`num ${diff >= 0 ? "pos" : "neg"}`}>
                  {diff > 0 ? `+${diff}` : diff}
                </td>
                <td className="num">{fmt(s.adr, 1)}</td>
                <td className="num">{s.hs ?? "-"}</td>
                <td className={`num ${rating >= 1.05 ? "rating-high" : ""}`}>{fmt(rating)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// 半场 split 表：每名选手 CT/T 分开对比
function HalfTimeTable({ stats, side, teamName }) {
  const players = loadPlayers();
  const rows = stats
    .filter((s) => s.side === side && (s.ctStats || s.tStats))
    .sort((a, b) => (b.kills - b.deaths) - (a.kills - a.deaths));

  return (
    <div>
      <div className="map-team-label"><span>{teamName}</span></div>
      <table className="tbl">
        <thead>
          <tr>
            <th className="no-sort" rowSpan="2">选手</th>
            <th className="no-sort num" colSpan="3">CT方</th>
            <th className="no-sort num" colSpan="3">T方</th>
          </tr>
          <tr>
            <th className="no-sort num">K</th>
            <th className="no-sort num">D</th>
            <th className="no-sort num">ADR</th>
            <th className="no-sort num">K</th>
            <th className="no-sort num">D</th>
            <th className="no-sort num">ADR</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => {
            const p = players.find((x) => x.id === s.playerId);
            const ct = s.ctStats || {};
            const t = s.tStats || {};
            return (
              <tr key={s.playerId}>
                <td className="player-cell">
                  {p && p.avatar && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="mini-av" src={p.avatar} alt={p.nickname} />
                  )}
                  {p ? <Link href={`/players/${p.id}`}>{p.nickname}</Link> : s.playerId}
                </td>
                <td className="num">{ct.kills ?? "-"}</td>
                <td className="num">{ct.deaths ?? "-"}</td>
                <td className="num">{fmt(ct.adr, 1)}</td>
                <td className="num">{t.kills ?? "-"}</td>
                <td className="num">{t.deaths ?? "-"}</td>
                <td className="num">{fmt(t.adr, 1)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
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
            {match.date} · {match.format} · {match.event}
          </div>
        </div>
      </section>

      {match.maps.map((map, idx) => (
        <section className="panel" key={`${map.map}-${idx}`}>
          <div className="map-head">
            <span className="map-name">{map.map}</span>
            <span className={`map-score ${map.scoreA > map.scoreB ? "pos" : "neg"}`}>
              {Math.max(map.scoreA, map.scoreB)} : {Math.min(map.scoreA, map.scoreB)}
            </span>
          </div>
          <StatsTable
            stats={map.stats}
            side="A"
            teamName={match.teamA}
            scoreA={map.scoreA}
            scoreB={map.scoreB}
          />
          <StatsTable
            stats={map.stats}
            side="B"
            teamName={match.teamB}
            scoreA={map.scoreA}
            scoreB={map.scoreB}
          />
        </section>
      ))}

      {/* 半场 split */}
      {match.maps.map((map, idx) => {
        const hasHalf = map.stats.some((s) => s.ctStats || s.tStats);
        if (!hasHalf) return null;
        return (
          <section className="panel" key={`half-${idx}`}>
            <h2 className="panel-title">半场表现 · {map.map}</h2>
            <HalfTimeTable stats={map.stats} side="A" teamName={match.teamA} />
            <HalfTimeTable stats={map.stats} side="B" teamName={match.teamB} />
          </section>
        );
      })}

      {/* 对位矩阵 */}
      {matrix.rows.length > 0 && (
        <section className="panel">
          <h2 className="panel-title">对位矩阵 · {match.teamB} (行) vs {match.teamA} (列)</h2>
          <H2HMatrix matrix={matrix} teamBName={match.teamB} teamAName={match.teamA} />
        </section>
      )}
    </div>
  );
}
