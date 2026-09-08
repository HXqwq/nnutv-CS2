import fs from "fs";
import path from "path";

const dir = path.join(process.cwd(), "data");
const players = JSON.parse(fs.readFileSync(path.join(dir, "players.json"), "utf8"));
const matches = JSON.parse(fs.readFileSync(path.join(dir, "matches.json"), "utf8"));

const m4 = matches.find((m) => m.id === "m4");
if (!m4) { console.error("m4 not found"); process.exit(1); }
const map = m4.maps[0];
const stats = map.stats;

let errs = 0;
const log = (ok, msg) => { if (!ok) { console.error("FAIL: " + msg); errs++; } else { console.log("ok: " + msg); } };

const pid = (_) => players.find((p) => p.id === _) || {};

// 1. 校验 playerId 引用有效
for (const s of stats) {
  const p = pid(s.playerId);
  log(!!p.id, `player ${s.playerId} exists`);
}

// 2. 队伍归属
const sideA = stats.filter((s) => s.side === "A");
const sideB = stats.filter((s) => s.side === "B");
log(sideA.length === 5 && sideB.length === 5, `side A=${sideA.length} side B=${sideB.length}`);

// 3. CT + T = 全场（K/D/A）
for (const s of stats) {
  const c = s.ctStats || {}, t = s.tStats || {};
  const ck = c.kills||0, td = t.deaths||0;
  const kOk = ck + (t.kills||0) === s.kills;
  const dOk = (c.deaths||0) + td === s.deaths;
  const aOk = (c.assists||0) + (t.assists||0) === s.assists;
  log(kOk && dOk && aOk, `${pid(s.playerId).nickname} CT+T=全场 K${s.kills} D${s.deaths} A${s.assists}`);
}

// 4. h2h 累加 = 全场 K/D（对位-全场为唯一权威来源）
for (const s of stats) {
  let killed = 0, death = 0;
  for (const k of Object.keys(s.h2h || {})) {
    killed += s.h2h[k].killed || 0;
    death += s.h2h[k].death || 0;
  }
  log(killed === s.kills && death === s.deaths, `${pid(s.playerId).nickname} h2h 累加=${killed}/${death} 全场=${s.kills}/${s.deaths}`);
}

// 5. A/B 互为镜像对称
const byId = {};
for (const s of stats) byId[s.playerId] = s;
let mirrorOk = true;
for (const a of sideA) {
  for (const b of sideB) {
    const ab = a.h2h?.[b.playerId];
    const ba = b.h2h?.[a.playerId];
    if (!ab || !ba) { mirrorOk = false; continue; }
    if (ab.killed !== ba.death || ab.death !== ba.killed) mirrorOk = false;
  }
}
log(mirrorOk, "A/B h2h 互为镜像对称");

// 6. 分数和
log(map.scoreA === 13 && map.scoreB === 3, `map score ${map.scoreA}:${map.scoreB}`);

console.log(errs ? `\n${errs} 处错误` : "\n全部通过 ✓");
process.exit(errs ? 1 : 0);
