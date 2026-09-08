// 校验：新增场次的队伍引用、id 唯一、BO1/BO3 比分一致、地图为空占位
import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
const teams = JSON.parse(fs.readFileSync(path.join(dataDir, "teams.json"), "utf8"));
const matches = JSON.parse(fs.readFileSync(path.join(dataDir, "matches.json"), "utf8"));

const teamNames = new Set(teams.map((t) => t.name));
const ids = new Set();
let errs = 0;
const log = (ok, msg) => { if (!ok) { console.error("FAIL: " + msg); errs++; } else { console.log("ok: " + msg); } };

const newIds = matches.filter((m) => /^m(5|[2-9]\d)$/.test(m.id)).map((m) => m.id);

for (const m of matches) {
  log(!ids.has(m.id), `match id ${m.id} 唯一`);
  ids.add(m.id);
  log(teamNames.has(m.teamA) && teamNames.has(m.teamB), `${m.id} 队伍引用有效: ${m.teamA} vs ${m.teamB}`);
  if (m.format === "BO1") {
    const map = m.maps[0];
    log(m.maps.length === 1, `${m.id} BO1 只含 1 图`);
    log(m.scoreA === map.scoreA && m.scoreB === map.scoreB, `${m.id} BO1 系列比分=图比分 ${m.scoreA}:${m.scoreB}`);
  } else if (m.format === "BO3") {
    const winA = m.maps.filter((mp) => mp.scoreA > mp.scoreB).length;
    const winB = m.maps.filter((mp) => mp.scoreB > mp.scoreA).length;
    log(m.scoreA === winA && m.scoreB === winB, `${m.id} BO3 系列比分=胜场数 ${winA}:${winB}`);
  }
  // 占位图：地图名待补充、stats 为空（仅校验新增占位场次，排除 m2/m3/m4 真实数据）
  if (newIds.includes(m.id)) {
    for (const mp of m.maps) {
      log(mp.map === "待补充", `${m.id} 地图名为待补充`);
      log(Array.isArray(mp.stats) && mp.stats.length === 0, `${m.id} stats 为空占位`);
    }
  }
}

console.log(errs ? `\n${errs} 处错误` : "\n全部通过 ✓");
process.exit(errs ? 1 : 0);
