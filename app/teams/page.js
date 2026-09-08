import Link from "next/link";
import { loadTeams, loadPlayers } from "../../lib/data";

export default function TeamsPage() {
  const teams = loadTeams();
  const players = loadPlayers();

  // 面板 8 支队伍 + 只存在于比赛记录中的历史队伍（如 天天禄）
  const rosterTeams = new Map();
  for (const t of teams) rosterTeams.set(t.name, t);
  for (const p of players) {
    if (p.team && !rosterTeams.has(p.team)) {
      rosterTeams.set(p.team, { id: "", name: p.team, shortName: "", country: "" });
    }
  }

  const all = [...rosterTeams.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "zh-CN")
  );

  return (
    <div>
      <h1 className="page-title">战队 · Teams</h1>
      {all.length === 0 ? (
        <div className="panel empty">暂无战队数据</div>
      ) : (
        all.map((t) => {
          const roster = players.filter((p) => p.team === t.name);
          return (
            <div className="team-card" key={t.name} id={t.id || undefined}>
              <div className="team-card-head">
                <div className="team-badge">
                  {(t.shortName || t.name).slice(0, 3).toUpperCase()}
                </div>
                <div>
                  <h2>{t.name}</h2>
                  <div className="team-meta">
                    {t.shortName && t.shortName !== t.name ? `${t.shortName} · ` : ""}
                    {t.country || "—"}
                    {t.id ? "" : " · 历史队伍"}
                    {` · ${roster.length} 名选手`}
                  </div>
                </div>
              </div>
              <div className="team-roster">
                {roster.length === 0 ? (
                  <span className="muted">暂无注册选手</span>
                ) : (
                  roster.map((p) => (
                    <Link className="roster-chip" href={`/players/${p.id}`} key={p.id}>
                      {p.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img className="mini-av" src={p.avatar} alt={p.nickname} />
                      ) : (
                        <span className="mini-av av-fallback" />
                      )}
                      {p.nickname}
                    </Link>
                  ))
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
