import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");

export function loadPlayers() {
  return JSON.parse(fs.readFileSync(path.join(dataDir, "players.json"), "utf8"));
}

export function loadMatches() {
  const matches = JSON.parse(fs.readFileSync(path.join(dataDir, "matches.json"), "utf8"));
  return [...matches].sort((a, b) => b.date.localeCompare(a.date));
}

export function getPlayer(id) {
  return loadPlayers().find((p) => p.id === id);
}

export function getMatch(id) {
  return loadMatches().find((m) => m.id === id);
}

// 汇总每名选手在所有地图中的表现（简单聚合，非 HLTV Rating 2.0 公式）
export function aggregateAll() {
  const players = loadPlayers();
  const matches = loadMatches();
  const agg = new Map();

  for (const p of players) {
    agg.set(p.id, {
      player: p,
      maps: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      adrSum: 0,
      adrN: 0,
      hsSum: 0,
      hsN: 0,
      ratingSum: 0,
      ratingN: 0,
      wins: 0,
    });
  }

  for (const m of matches) {
    for (const map of m.maps) {
      for (const s of map.stats) {
        const a = agg.get(s.playerId);
        if (!a) continue;
        a.maps += 1;
        a.kills += s.kills;
        a.deaths += s.deaths;
        a.assists += s.assists;
        if (typeof s.adr === "number") { a.adrSum += s.adr; a.adrN++; }
        if (typeof s.hs === "number") { a.hsSum += s.hs; a.hsN++; }
        if (typeof s.rating === "number") { a.ratingSum += s.rating; a.ratingN++; }
        const won = s.side === "A" ? map.scoreA > map.scoreB : map.scoreB > map.scoreA;
        if (won) a.wins++;
      }
    }
  }

  return [...agg.values()]
    .map((a) => ({
      ...a,
      kd: a.deaths > 0 ? a.kills / a.deaths : a.kills,
      avgAdr: a.adrN ? a.adrSum / a.adrN : null,
      avgHs: a.hsN ? a.hsSum / a.hsN : null,
      avgRating: a.ratingN ? a.ratingSum / a.ratingN : null,
      winRate: a.maps ? a.wins / a.maps : 0,
    }))
    .filter((a) => a.maps > 0);
}

export function rankings() {
  return aggregateAll().sort((x, y) => (y.avgRating ?? 0) - (x.avgRating ?? 0));
}

// 某选手的逐图比赛记录（按日期倒序）
export function playerMatchHistory(playerId) {
  const matches = loadMatches();
  const rows = [];
  for (const m of matches) {
    for (const map of m.maps) {
      const s = map.stats.find((x) => x.playerId === playerId);
      if (!s) continue;
      const won = s.side === "A" ? map.scoreA > map.scoreB : map.scoreB > map.scoreA;
      const opponent = s.side === "A" ? m.teamB : m.teamA;
      rows.push({
        matchId: m.id,
        date: m.date,
        event: m.event,
        map: map.map,
        scoreA: map.scoreA,
        scoreB: map.scoreB,
        side: s.side,
        teamA: m.teamA,
        teamB: m.teamB,
        opponent,
        won,
        ...s,
      });
    }
  }
  return rows;
}

export function fmt(n, digits = 2) {
  if (n == null || Number.isNaN(n)) return "-";
  return n.toFixed(digits);
}
