#!/usr/bin/env node
// CSV 批量导入工具：把从完美电竞平台整理的比赛数据导入 data/*.json
//
// 用法：npm run import -- path/to/your.csv
//
// CSV 格式（UTF-8，第一行为表头，顺序固定）：
// date,event,format,teamA,teamB,map,scoreA,scoreB,playerId,nickname,team,role,side,kills,deaths,assists,adr,hs,rating
//
// 说明：
// - 一行 = 一名选手在一张图的数据
// - 同一场比赛（date+event+teamA+teamB 相同）的多张图会自动归到同一场比赛
// - playerId 已存在则更新选手信息（昵称/队伍/角色），不存在则新增
// - side 填 A（属于 teamA）或 B（属于 teamB）
// - 昵称或队名含逗号时用英文双引号包住该字段

import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else cur += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") { out.push(cur); cur = ""; }
      else cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

const csvPath = process.argv[2];
if (!csvPath) {
  console.error("用法: npm run import -- path/to/your.csv");
  process.exit(1);
}

const lines = fs.readFileSync(csvPath, "utf8").split(/\r?\n/).filter((l) => l.trim());
const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
const required = ["date", "event", "format", "teama", "teamb", "map", "scorea", "scoreb", "playerid", "nickname", "team", "role", "side", "kills", "deaths", "assists", "adr", "hs", "rating"];
for (const r of required) {
  if (!header.includes(r)) {
    console.error(`CSV 缺少列: ${r}，请按 README 中的表头格式排列`);
    process.exit(1);
  }
}

const col = (name) => header.indexOf(name);
const players = JSON.parse(fs.readFileSync(path.join(dataDir, "players.json"), "utf8"));
const matches = JSON.parse(fs.readFileSync(path.join(dataDir, "matches.json"), "utf8"));

const playerIds = new Set(players.map((p) => p.id));
const matchMap = new Map(matches.map((m) => [`${m.date}|${m.event}|${m.teamA}|${m.teamB}`, m]));

let nextMatchId = matches.length + 1;

for (const line of lines.slice(1)) {
  const v = parseCsvLine(line);
  const row = {
    date: v[col("date")],
    event: v[col("event")],
    format: v[col("format")] || "BO1",
    teamA: v[col("teama")],
    teamB: v[col("teamb")],
    map: v[col("map")],
    scoreA: parseInt(v[col("scorea")], 10),
    scoreB: parseInt(v[col("scoreb")], 10),
    playerId: v[col("playerid")],
    nickname: v[col("nickname")],
    team: v[col("team")],
    role: v[col("role")],
    side: (v[col("side")] || "A").toUpperCase(),
    kills: parseInt(v[col("kills")], 10),
    deaths: parseInt(v[col("deaths")], 10),
    assists: parseInt(v[col("assists")], 10),
    adr: v[col("adr")] === "" ? null : parseFloat(v[col("adr")]),
    hs: v[col("hs")] === "" ? null : parseInt(v[col("hs")], 10),
    rating: v[col("rating")] === "" ? null : parseFloat(v[col("rating")]),
  };

  // upsert 选手
  if (!playerIds.has(row.playerId)) {
    players.push({ id: row.playerId, nickname: row.nickname, realName: "", team: row.team, role: row.role, joined: row.date.slice(0, 7) });
    playerIds.add(row.playerId);
    console.log(`+ 新增选手: ${row.nickname} (${row.playerId})`);
  }

  // 找/建比赛
  const mKey = `${row.date}|${row.event}|${row.teamA}|${row.teamB}`;
  let match = matchMap.get(mKey);
  if (!match) {
    match = { id: `m${nextMatchId++}`, date: row.date, event: row.event, format: row.format, teamA: row.teamA, teamB: row.teamB, scoreA: 0, scoreB: 0, maps: [] };
    matches.push(match);
    matchMap.set(mKey, match);
  }

  // 找/建地图
  let mapEntry = match.maps.find((mp) => mp.map === row.map);
  if (!mapEntry) {
    mapEntry = { map: row.map, scoreA: row.scoreA, scoreB: row.scoreB, stats: [] };
    match.maps.push(mapEntry);
  }
  mapEntry.scoreA = row.scoreA;
  mapEntry.scoreB = row.scoreB;

  // upsert 该选手本图数据
  const existing = mapEntry.stats.find((s) => s.playerId === row.playerId);
  const stat = { playerId: row.playerId, side: row.side, kills: row.kills, deaths: row.deaths, assists: row.assists, adr: row.adr, hs: row.hs, rating: row.rating };
  if (existing) Object.assign(existing, stat);
  else mapEntry.stats.push(stat);
}

// 重算系列赛比分
for (const m of matches) {
  m.scoreA = m.maps.filter((mp) => mp.scoreA > mp.scoreB).length;
  m.scoreB = m.maps.filter((mp) => mp.scoreB > mp.scoreA).length;
}

fs.writeFileSync(path.join(dataDir, "players.json"), JSON.stringify(players, null, 2) + "\n");
fs.writeFileSync(path.join(dataDir, "matches.json"), JSON.stringify(matches, null, 2) + "\n");
console.log(`导入完成：共 ${matches.length} 场比赛、${players.length} 名选手。刷新网站即可看到。`);
