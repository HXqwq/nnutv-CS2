import Link from "next/link";
import { notFound } from "next/navigation";
import { getMatch, loadMatches, loadPlayers, fmt } from "../../../lib/data";

export async function generateStaticParams() {
  return loadMatches().map((m) => ({ id: m.id }));
}

function StatsTable({ stats, side, teamName, scoreA, scoreB }) {
  const players = loadPlayers();
  const rows = stats
    .filter((s) => s.side === side)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

  return (
    <div>
      <div className="map-team-label">
        {teamName}
        {side === "A" ? ` ${scoreA} : ${scoreB}` : ` ${scoreB} : ${scoreA}`}
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
            return (
              <tr key={s.playerId}>
                <td>
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
                <td className="num" style={{ fontWeight: 600, color: (s.rating ?? 0) >= 1 ? "#fff" : undefined }}>
                  {fmt(s.rating)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default async function MatchDetailPage({ params }) {
  const { id } = await params;
  const match = getMatch(id);
  if (!match) notFound();

  const aWon = match.scoreA > match.scoreB;

  return (
    <div>
      <h1 className="page-title">比赛详情</h1>
      <section className="panel">
        <div className="match-header">
          <div className="teams">
            <span className={aWon ? "win-text" : "loss-text"}>{match.teamA}</span>
            {" vs "}
            <span className={!aWon ? "win-text" : "loss-text"}>{match.teamB}</span>
          </div>
          <div className="big-score">
            <span className="s-win">{Math.max(match.scoreA, match.scoreB)}</span>
            {" : "}
            <span className="s-loss">{Math.min(match.scoreA, match.scoreB)}</span>
          </div>
          <div className="meta">
            {match.date} · {match.format} · {match.event}
          </div>
        </div>
      </section>

      {match.maps.map((map) => (
        <section className="panel" key={map.map}>
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
    </div>
  );
}
