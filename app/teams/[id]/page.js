import Link from "next/link";
import { notFound } from "next/navigation";
import { loadTeams, loadPlayers, getTeamTransfers } from "../../../lib/data";

export async function generateStaticParams() {
  return loadTeams().map((t) => ({ id: t.id }));
}

const TYPE_LABEL = {
  transfer: "转会",
  demote: "下放",
  rename: "改名",
  join: "加入",
};

export default function TeamDetailPage({ params }) {
  const { id } = params;
  const teams = loadTeams();
  const players = loadPlayers();
  const team = teams.find((t) => t.id === id);
  if (!team) notFound();

  const roster = players.filter((p) => p.team === team.name);
  const transfers = getTeamTransfers(team.name);
  const byId = new Map(players.map((p) => [p.id, p]));

  return (
    <div>
      <div className="team-detail-head">
        <div className="team-badge">{team.shortName || team.name}</div>
        <div>
          <h1>{team.name}</h1>
          <div className="team-meta">
            {team.shortName && team.shortName !== team.name ? `${team.shortName} · ` : ""}
            {team.country || "—"}
            {` · ${roster.length} 名选手`}
          </div>
        </div>
      </div>

      {/* 当前阵容 */}
      <section className="panel">
        <h2 className="panel-title">当前阵容 · {roster.length} 人</h2>
        {roster.length === 0 ? (
          <div className="empty">暂无注册选手</div>
        ) : (
          <div className="team-roster team-roster-detail">
            {roster.map((p) => (
              <Link className="roster-chip" href={`/players/${p.id}`} key={p.id}>
                {p.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="mini-av" src={p.avatar} alt={p.nickname} />
                ) : (
                  <span className="mini-av av-fallback" />
                )}
                {p.nickname}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 转会记录 */}
      <section className="panel">
        <h2 className="panel-title">转会记录 · {transfers.length} 条</h2>
        {transfers.length === 0 ? (
          <div className="empty">暂无转会记录</div>
        ) : (
          <div className="transfer-list">
            {transfers.map((tr) => {
              const p = byId.get(tr.playerId);
              const label = TYPE_LABEL[tr.type] || tr.type;
              const isBench = tr.type === "demote" && /替补/.test(tr.note || "");
              let desc;
              if (tr.type === "rename") {
                desc = `${tr.note}`;
              } else if (tr.type === "demote") {
                desc = isBench
                  ? `在 ${tr.from} 下放为替补`
                  : `在 ${tr.from} 下放`;
              } else if (tr.type === "join") {
                desc = `加入 ${tr.to}`;
              } else if (tr.to === "No Team") {
                desc = `从 ${tr.from} 转出，成为自由选手`;
              } else {
                desc = `从 ${tr.from} 转入 ${tr.to}`;
              }
              return (
                <div className="transfer-row" key={tr.id}>
                  <span className="transfer-date">{tr.date}</span>
                  <span className={`transfer-tag ${tr.type}`}>{label}</span>
                  <span className="transfer-player">
                    {p ? (
                      <Link href={`/players/${p.id}`}>{p.nickname}</Link>
                    ) : (
                      tr.playerId
                    )}
                  </span>
                  <span className="transfer-desc">{desc}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
