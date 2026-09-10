// m37: 常务副够特 13:3 牢霸道了（远古遗迹，2026-03-21，NNU Major S1 Group Stage，BO1）
// 数据来源：完美电竞平台 6 张截图（基础数据 全场/CT/T + 对位数据 全场；半场对位按惯例不采集）
// teamA = 常务副够特（t3，半场先打 CT，胜方）；teamB = 牢霸道了（t13，先打 T）
// 自洽性已核：半场加和 10/10；对位行列累加=全场 K/D（坠机王6666 被杀矩阵 15 < 死亡 17，差 2 = 自杀/世界伤害）
import fs from "node:fs";

const root = new URL("../data/", import.meta.url);
const read = f => JSON.parse(fs.readFileSync(new URL(f, root), "utf8"));
const write = (f, d) => fs.writeFileSync(new URL(f, root), JSON.stringify(d, null, 2) + "\n");

const players = read("players.json");
const matches = read("matches.json");

// ---------- 选手解析 ----------
let nextPid = Math.max(...players.map(p => parseInt(p.id.slice(1)))) + 1;
const newPlayers = [];
function ref(nick, team) {
  let hit = players.find(p => p.nickname === nick);
  if (hit) return hit.id;
  const id = "p" + nextPid++;
  players.push({ id, nickname: nick, realName: "", team, role: "", joined: "2026-03" });
  newPlayers.push({ id, nick, team });
  return id;
}

// ---------- 比赛信息 ----------
const MID = "m37";
if (matches.some(m => m.id === MID)) { console.error("FAIL: " + MID + " 已存在"); process.exit(1); }

// ---------- 逐行数据（截图转录）----------
// row = [nick, team, k,d,a, hs, adr, rating, rws, we, ct[6], t[6], h2h{opNick:[killed,death]}]
const GOAT = "常务副够特", LBD = "牢霸道了";
const A = [
  { nick: "K1smet٩",    f: [21,7,7, 62,115,1.79, 19.49,13.3], ct: [15,7,6, 60,108,1.74], t: [6,0,1, 67,136,1.91],
    h2h: { "Xavier Sterlin":[6,2], "Ser1n":[5,1], "坠机王6666":[6,2], "何子疏":[3,2], "debating":[1,0] } },
  { nick: "傻里_",      f: [16,5,6, 44,116,1.46, 14.52,14.0], ct: [13,5,6, 54,134,1.63], t: [3,0,0, 0,62,0.95],
    h2h: { "Xavier Sterlin":[2,0], "Ser1n":[2,3], "坠机王6666":[3,1], "何子疏":[5,0], "debating":[4,1] } },
  { nick: "科维奇招斯网", f: [14,9,5, 57,102,1.32, 18.10,10.7], ct: [8,8,3, 38,77,1.01],  t: [6,1,2, 83,178,2.25],
    h2h: { "Xavier Sterlin":[2,4], "Ser1n":[3,2], "坠机王6666":[2,1], "何子疏":[5,2], "debating":[2,0] } },
  { nick: "皮克斯儿",    f: [11,10,7, 55,83,1.20, 13.41,10.3], ct: [10,8,5, 50,92,1.34],  t: [1,2,2, 100,56,0.79],
    h2h: { "Xavier Sterlin":[4,2], "Ser1n":[2,4], "坠机王6666":[1,2], "何子疏":[0,0], "debating":[4,2] } },
  { nick: "MoNoxide",   f: [13,8,3, 62,57,1.11, 10.11,9.8],  ct: [9,7,2, 78,56,1.04],  t: [4,1,1, 25,58,1.32],
    h2h: { "Xavier Sterlin":[1,3], "Ser1n":[3,2], "坠机王6666":[3,1], "何子疏":[2,2], "debating":[4,0] } },
];
const B = [
  { nick: "Ser1n",        f: [12,15,2, 77,76,0.99, 7.32,7.0], ct: [1,4,0, 0,24,0.09],  t: [11,11,2, 83,93,1.22],
    h2h: { "K1smet٩":[1,5], "傻里_":[3,2], "科维奇招斯网":[2,3], "皮克斯儿":[4,2], "MoNoxide":[2,3] } },
  { nick: "Xavier Sterlin", f: [11,15,1, 36,77,0.96, 5.36,7.1], ct: [1,4,0, 0,12,0.26],  t: [10,11,1, 40,99,1.19],
    h2h: { "K1smet٩":[2,6], "傻里_":[0,2], "科维奇招斯网":[4,2], "皮克斯儿":[2,4], "MoNoxide":[3,1] } },
  { nick: "坠机王6666",   f: [7,17,4, 57,57,0.71, 2.15,4.7], ct: [0,5,0, 0,21,0.06],  t: [7,12,4, 57,69,0.92],
    h2h: { "K1smet٩":[2,6], "傻里_":[1,3], "科维奇招斯网":[1,2], "皮克斯儿":[2,1], "MoNoxide":[1,3] } },
  { nick: "何子疏",       f: [6,15,2, 50,54,0.58, 2.68,4.5], ct: [1,4,1, 100,68,0.53], t: [5,11,1, 40,49,0.60],
    h2h: { "K1smet٩":[2,3], "傻里_":[0,5], "科维奇招斯网":[2,5], "皮克斯儿":[0,0], "MoNoxide":[2,2] } },
  { nick: "debating",     f: [3,15,2, 100,42,0.43, 1.25,2.5], ct: [1,4,0, 100,82,0.55], t: [2,11,2, 100,29,0.39],
    h2h: { "K1smet٩":[0,1], "傻里_":[1,4], "科维奇招斯网":[0,2], "皮克斯儿":[2,4], "MoNoxide":[0,4] } },
];

function mkRow(r, side, team) {
  const [k, d, a, hs, adr, rating, rws, we] = r.f;
  const half = h => ({ kills: h[0], deaths: h[1], assists: h[2], adr: h[3], hs: h[4], rating: h[5] });
  const h2h = {};
  for (const [op, [killed, death]] of Object.entries(r.h2h)) {
    const opId = players.find(p => p.nickname === op)?.id || ref(op, side === "A" ? LBD : GOAT);
    h2h[opId] = { killed, death };
  }
  return { playerId: ref(r.nick, team), side, kills: k, deaths: d, assists: a, adr, hs, rating,
    ctStats: half(r.ct), tStats: half(r.t), multiKills: null, mvp: 0, rws, we, performance: null, h2h };
}

const stats = [
  ...A.map(r => mkRow(r, "A", GOAT)),
  ...B.map(r => mkRow(r, "B", LBD)),
];

const match = {
  id: MID, date: "2026-03-21", event: "NNU Major S1", stage: "Group Stage", format: "BO1",
  teamA: GOAT, teamB: LBD, scoreA: 13, scoreB: 3,
  maps: [{ map: "远古遗迹", scoreA: 13, scoreB: 3, stats }],
};

// ---------- 校验 ----------
let fail = 0;
const chk = (cond, msg) => { if (!cond) { console.error("FAIL:", msg); fail++; } };
for (const s of stats) {
  for (const key of ["kills", "deaths", "assists"])
    chk(s[key] === s.ctStats[key] + s.tStats[key], `半场加和 ${s.playerId} ${key}`);
  const ks = Object.values(s.h2h).reduce((t, x) => t + x.killed, 0);
  const ds = Object.values(s.h2h).reduce((t, x) => t + x.death, 0);
  chk(ks === s.kills, `h2h击杀累加 ${s.playerId}: ${ks} != ${s.kills}`);
  chk(ds <= s.deaths, `h2h被杀累加 ${s.playerId}: ${ds} > ${s.deaths}`);
  if (ds < s.deaths) console.log(`  NOTE: ${s.playerId} 被杀累加 ${ds} < 死亡 ${s.deaths}（差 ${s.deaths - ds}，自杀/世界伤害）`);
}
// 镜像对称
for (const a of stats.filter(s => s.side === "A"))
  for (const [opId, v] of Object.entries(a.h2h)) {
    const b = stats.find(s => s.playerId === opId);
    chk(b.h2h[a.playerId].killed === v.death && b.h2h[a.playerId].death === v.killed, `镜像 ${a.playerId}<->${opId}`);
  }
// 团队交叉
const sum = (arr, f) => arr.reduce((t, s) => t + f(s), 0);
const As = stats.filter(s => s.side === "A"), Bs = stats.filter(s => s.side === "B");
chk(sum(As, s => s.kills) <= sum(Bs, s => s.deaths), "A方总击杀 > B方总死亡");
chk(sum(Bs, s => s.kills) === sum(As, s => s.deaths), "B方总击杀 != A方总死亡");
if (sum(As, s => s.kills) !== sum(Bs, s => s.deaths))
  console.log(`  NOTE: A方总击杀 ${sum(As, s => s.kills)} < B方总死亡 ${sum(Bs, s => s.deaths)}（差 ${sum(Bs, s => s.deaths) - sum(As, s => s.kills)}，自杀/世界伤害）`);
if (fail) { console.error(`共 ${fail} 处校验失败，中止`); process.exit(1); }

// ---------- 写入 ----------
matches.push(match);
write("matches.json", matches);
write("players.json", players);
console.log(`OK ${MID}: ${GOAT} 13:3 ${LBD} 远古遗迹 | 选手行 ${stats.length} | 新增选手: ${newPlayers.map(p => p.id + "=" + p.nick).join(", ") || "无"}`);
