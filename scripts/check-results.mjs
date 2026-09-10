// 数据校验：队伍引用 / id 唯一 / 系列比分一致性 / 比赛数据完整性（半场加和、对位自洽与镜像）
import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");
const load = (f) => JSON.parse(fs.readFileSync(path.join(dataDir, f), "utf8"));
const teams = load("teams.json");
const players = load("players.json");
const matches = load("matches.json");

// 已知别名：matches.json 里用赛事展示名，teams.json 用 Get5 面板名
const TEAM_ALIAS = { TeamGold: "TeamGoldRain" };

const teamNames = new Set(teams.map((t) => t.name));
const aliasUse = new Set();
const playerIds = new Set(players.map((p) => p.id));
const ids = new Set();
let errs = 0;
const ok = (cond, msg) => { if (!cond) { console.error("FAIL: " + msg); errs++; } };
const teamOk = (name, tag) => {
  if (teamNames.has(name)) return;
  if (TEAM_ALIAS[name] && teamNames.has(TEAM_ALIAS[name])) { aliasUse.add(name); return; }
  ok(false, `${tag} 队伍不存在: ${name}`);
};

for (const m of matches) {
  ok(!ids.has(m.id), `match id ${m.id} 唯一`);
  ids.add(m.id);
  teamOk(m.teamA, `${m.id} teamA`);
  teamOk(m.teamB, `${m.id} teamB`);

  if (m.format === "BO1") {
    ok(m.maps.length === 1, `${m.id} BO1 只含 1 图`);
    const mp = m.maps[0];
    ok(m.scoreA === mp.scoreA && m.scoreB === mp.scoreB, `${m.id} BO1 系列比分=图比分 ${m.scoreA}:${m.scoreB}`);
  } else if (m.format === "BO3") {
    const winA = m.maps.filter((mp) => mp.scoreA > mp.scoreB).length;
    const winB = m.maps.filter((mp) => mp.scoreB > mp.scoreA).length;
    ok(m.scoreA === winA && m.scoreB === winB, `${m.id} BO3 系列比分=胜场数 ${winA}:${winB}（记录 ${m.scoreA}:${m.scoreB}）`);
  }

  for (const [i, mp] of m.maps.entries()) {
    const tag = `${m.id}/图${i + 1}`;
    if (!mp.stats || mp.stats.length === 0) continue;

    ok(mp.stats.length === 10, `${tag} 应有 10 行数据，实际 ${mp.stats.length}`);
    const seen = new Set();
    const byId = new Map();
    for (const s of mp.stats) {
      ok(playerIds.has(s.playerId), `${tag} 选手存在: ${s.playerId}`);
      ok(!seen.has(s.playerId), `${tag} 选手不重复: ${s.playerId}`);
      seen.add(s.playerId);
      ok(s.side === "A" || s.side === "B", `${tag} side 合法: ${s.playerId}`);
      byId.set(s.playerId, s);

      if (s.ctStats && s.tStats) {
        for (const key of ["kills", "deaths", "assists"]) {
          if (s[key] == null) continue;
          const sum = (s.ctStats[key] || 0) + (s.tStats[key] || 0);
          ok(sum === s[key], `${tag} ${s.playerId} 半场${key}加和 ${sum} ≠ 全场 ${s[key]}`);
        }
      }
    }

    const countA = mp.stats.filter((s) => s.side === "A").length;
    const countB = mp.stats.filter((s) => s.side === "B").length;
    ok(countA === 5 && countB === 5, `${tag} A/B 各 5 人（${countA}/${countB}）`);

    for (const s of mp.stats) {
      const h = s.h2h || {};
      const hk = Object.values(h).reduce((a, b) => a + b.killed, 0);
      const hd = Object.values(h).reduce((a, b) => a + b.death, 0);
      if (Object.keys(h).length) {
        ok(hk === s.kills, `${tag} ${s.playerId} 对位击杀合计 ${hk} ≠ 全场击杀 ${s.kills}`);
        ok(hd <= s.deaths, `${tag} ${s.playerId} 对位死亡合计 ${hd} > 全场死亡 ${s.deaths}`);
      }
      for (const [opp, v] of Object.entries(h)) {
        const back = byId.get(opp)?.h2h?.[s.playerId];
        if (!back) { ok(false, `${tag} ${s.playerId}↔${opp} 对位记录不双向`); continue; }
        ok(back.killed === v.death && back.death === v.killed, `${tag} ${s.playerId}↔${opp} 对位不镜像`);
      }
    }
  }
}

const withStats = matches.filter((m) => m.maps.some((mp) => mp.stats && mp.stats.length));
console.log(`比赛总数 ${matches.length}，含数据 ${withStats.length} 场：${withStats.map((m) => m.id).join(" ")}`);
console.log(`选手总数 ${players.length}`);
if (aliasUse.size) console.log(`提示：以下队名使用了别名（teams.json 中为全称）：${[...aliasUse].map((a) => a + "→" + TEAM_ALIAS[a]).join(" ")}`);
console.log(errs ? `\n${errs} 处错误` : "\n全部通过 ✓");
process.exit(errs ? 1 : 0);
