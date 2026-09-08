// 批量导入比赛结果（骨架：只有比分/队伍/格式，选手数据待补充）
// 写入 data/teams.json 新增战队 + data/matches.json 新增场次
import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
const teamsPath = path.join(dataDir, "teams.json");
const matchesPath = path.join(dataDir, "matches.json");

// ---------- 新增战队 ----------
const newTeams = [
  { id: "t9",  name: "天天禄",     shortName: "TLL", country: "中华人民共和国" },
  { id: "t10", name: "TeamGold",   shortName: "TG",  country: "中华人民共和国" },
  { id: "t11", name: "麦恩莉",      shortName: "MNL", country: "中华人民共和国" },
  { id: "t12", name: "C++",        shortName: "C++", country: "中华人民共和国" },
  { id: "t13", name: "牢霸道了",    shortName: "LBD", country: "中华人民共和国" },
  { id: "t14", name: "JK games",   shortName: "JK",  country: "中华人民共和国" },
  { id: "t15", name: "惊天五条区",  shortName: "JTW", country: "中华人民共和国" },
  { id: "t16", name: "总被炸",      shortName: "ZBZ", country: "中华人民共和国" },
  { id: "t17", name: "My Go Clan", shortName: "MGC", country: "中华人民共和国" },
];

// ---------- 新增场次 ----------
// 由 [scoreA, scoreB] 对构造一张图（地图名待补充，stats 为空占位）
const constMaps = (pairs) => {
  const mps = [];
  for (const [a, b] of pairs) mps.push({ map: "待补充", scoreA: a, scoreB: b, stats: [] });
  return mps;
};

// BO1：单图，一场 = 一张图
const bo1 = [
  { id: "m5",  date: "2026-03-21", teamA: "ADS",         teamB: "老年人",        s: [5, 13] },
  { id: "m6",  date: "2026-03-21", teamA: "常务副够特",   teamB: "TeamGold",      s: [13, 7] },
  { id: "m7",  date: "2026-03-21", teamA: "麦恩莉",       teamB: "C++",           s: [10, 13] },
  { id: "m8",  date: "2026-03-21", teamA: "牢霸道了",     teamB: "常务副够特",    s: [3, 13] },
  { id: "m9",  date: "2026-03-21", teamA: "JK games",    teamB: "惊天五条区",     s: [9, 13] },
  { id: "m10", date: "2026-03-21", teamA: "总被炸",       teamB: "My Go Clan",    s: [13, 2] },
  { id: "m11", date: "2026-03-21", teamA: "Team 9one",   teamB: "Black Horizon", s: [2, 13] },
  { id: "m12", date: "2026-03-21", teamA: "My Go Clan",  teamB: "Bizon",         s: [13, 8] },
  { id: "m13", date: "2026-03-21", teamA: "Team 9one",   teamB: "牢霸道了",       s: [6, 13] },
  { id: "m14", date: "2026-03-21", teamA: "痱子可烂",     teamB: "香香软软小蛋糕", s: [11, 13] },
  { id: "m15", date: "2026-03-21", teamA: "C++",         teamB: "天天禄",        s: [3, 13] },
  { id: "m16", date: "2026-03-21", teamA: "惊天五条区",   teamB: "总被炸",         s: [7, 13] },
  { id: "m17", date: "2026-03-21", teamA: "ADS",         teamB: "牢霸道了",       s: [13, 1] },
  { id: "m18", date: "2026-03-21", teamA: "My Go Clan",  teamB: "惊天五条区",     s: [7, 13] },
  { id: "m19", date: "2026-03-28", teamA: "Bizon",       teamB: "C++",           s: [13, 6] },
];

// BO3：系列比分用 map 胜场数；每张图保留 map-level 比分
const bo3 = [
  { id: "m20", date: "2026-03-21", teamA: "天天禄",       teamB: "Black Horizon", maps: [[7, 13], [3, 13]],             series: [0, 2] },
  { id: "m21", date: "2026-03-21", teamA: "老年人",        teamB: "常务副够特",    maps: [[13, 8], [5, 13], [13, 4]],    series: [2, 1] },
  { id: "m22", date: "2026-03-21", teamA: "Team 9one",    teamB: "痱子可烂",       maps: [[5, 13], [13, 10], [22, 25]],  series: [1, 2] },
  { id: "m23", date: "2026-03-21", teamA: "麦恩莉",        teamB: "Bizon",         maps: [[10, 13], [13, 8], [7, 13]],   series: [1, 2] },
  { id: "m24", date: "2026-03-22", teamA: "痱子可烂",      teamB: "Bizon",         maps: [[13, 8], [4, 13], [10, 13]],   series: [1, 2] },
  { id: "m25", date: "2026-03-22", teamA: "常务副够特",    teamB: "TeamGold",      maps: [[13, 11], [13, 9]],            series: [2, 0] },
  { id: "m26", date: "2026-03-29", teamA: "老年人",        teamB: "TeamGold",      maps: [[16, 13], [13, 7]],            series: [2, 0] },
  { id: "m27", date: "2026-03-28", teamA: "Bizon",        teamB: "TeamGold",      maps: [[4, 13], [3, 13]],             series: [0, 2] },
  { id: "m28", date: "2026-03-22", teamA: "惊天五条区",    teamB: "C++",           maps: [[13, 8], [13, 1]],             series: [2, 0] },
  { id: "m29", date: "2026-03-22", teamA: "牢霸道了",      teamB: "C++",           maps: [[10, 13], [11, 13]],           series: [0, 2] },
  { id: "m30", date: "2026-03-22", teamA: "My Go Clan",   teamB: "痱子可烂",       maps: [[7, 13], [6, 13]],             series: [0, 2] },
  { id: "m31", date: "2026-04-01", teamA: "Black Horizon", teamB: "常务副够特",    maps: [[5, 13], [13, 11], [3, 13]],    series: [1, 2] },
  { id: "m32", date: "2026-03-30", teamA: "天天禄",        teamB: "总被炸",         maps: [[11, 13], [4, 13]],            series: [0, 2] },
  { id: "m33", date: "2026-04-15", teamA: "ADS",          teamB: "老年人",        maps: [[12, 16], [5, 13]],            series: [0, 2] },
  { id: "m34", date: "2026-04-12", teamA: "老年人",        teamB: "常务副够特",    maps: [[13, 10], [18, 22], [13, 8]],  series: [2, 1] },
];

const EVENT = "NNU Major S1";
const STAGE = "Group Stage";

// ---------- 写入 teams.json ----------
let teams = JSON.parse(fs.readFileSync(teamsPath, "utf8"));
const teamNames = new Set(teams.map((t) => t.name));
const addedTeams = [];
for (const t of newTeams) {
  if (teamNames.has(t.name)) continue;
  teams.push(t);
  addedTeams.push(t.name);
}
fs.writeFileSync(teamsPath, JSON.stringify(teams, null, 2) + "\n");

// ---------- 组装新场次 ----------
const newMatches = [];

for (const x of bo1) {
  newMatches.push({
    id: x.id,
    date: x.date,
    event: EVENT,
    stage: STAGE,
    format: "BO1",
    teamA: x.teamA,
    teamB: x.teamB,
    scoreA: x.s[0],
    scoreB: x.s[1],
    maps: constMaps([[x.s[0], x.s[1]]]),
  });
}

for (const x of bo3) {
  newMatches.push({
    id: x.id,
    date: x.date,
    event: EVENT,
    stage: STAGE,
    format: "BO3",
    teamA: x.teamA,
    teamB: x.teamB,
    scoreA: x.series[0],
    scoreB: x.series[1],
    maps: constMaps(x.maps),
  });
}

// ---------- 写入 matches.json ----------
let matches = JSON.parse(fs.readFileSync(matchesPath, "utf8"));
const matchById = new Map(matches.map((m) => [m.id, m]));

for (const m of newMatches) {
  matchById.set(m.id, m); // 按 id 覆盖/新增，便于修正后重跑
}
matches = [...matchById.values()];
fs.writeFileSync(matchesPath, JSON.stringify(matches, null, 2) + "\n");

console.log("teams: " + teams.length);
console.log("added teams: " + addedTeams.join(", "));
console.log("matches: " + matches.length + " (ids: " + matches.map((m) => m.id).join(",") + ")");
console.log("new matches: " + newMatches.map((m) => m.id).join(","));
