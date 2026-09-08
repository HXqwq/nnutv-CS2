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

export function loadTeams() {
  const file = path.join(dataDir, "teams.json");
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf8"));
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

// 某场比赛某张图的对位矩阵（rows 为一行方向视角，cols 为列方向）
// 从 stat.h2h 反向聚合出完整 5v5 矩阵，方便页面直接渲染
export function h2hMatrix(matchId) {
  const match = getMatch(matchId);
  if (!match) return { rows: [], cols: [], cells: {} };
  const players = loadPlayers();
  const rows = [];
  const cols = [];
  const cells = {};

  for (const map of match.maps) {
    const teamAStats = map.stats.filter((s) => s.side === "A" && s.h2h);
    const teamBStats = map.stats.filter((s) => s.side === "B" && s.h2h);
    // 以 B 方为行（香香软软小蛋糕视角），A 方为列（老年人）
    for (const b of teamBStats) {
      if (!rows.includes(b.playerId)) rows.push(b.playerId);
      for (const a of teamAStats) {
        if (!cols.includes(a.playerId)) cols.push(a.playerId);
        const entry = b.h2h?.[a.playerId];
        if (entry) {
          const key = `${b.playerId}|${a.playerId}`;
          if (!cells[key]) cells[key] = { killed: 0, death: 0 };
          cells[key].killed += entry.killed || 0;
          cells[key].death += entry.death || 0;
        }
      }
    }
  }

  return {
    rows: rows.map((id) => ({ id, player: players.find((p) => p.id === id) })),
    cols: cols.map((id) => ({ id, player: players.find((p) => p.id === id) })),
    cells,
  };
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

// 汇总半场表现（按场图维度）
export function sideAggregate() {
  const players = loadPlayers();
  const matches = loadMatches();
  const agg = new Map();
  for (const p of players) {
    agg.set(p.id, {
      player: p,
      maps: 0,
      ctN: 0, tN: 0,
      ctKills: 0, ctDeaths: 0, ctAssists: 0, ctAdrSum: 0, ctAdrN: 0, ctRatingSum: 0, ctRatingN: 0,
      tKills: 0,  tDeaths: 0,  tAssists: 0,  tAdrSum: 0,  tAdrN: 0,  tRatingSum: 0,  tRatingN: 0,
    });
  }
  for (const m of matches) {
    for (const map of m.maps) {
      for (const s of map.stats) {
        const a = agg.get(s.playerId);
        if (!a) continue;
        if (s.ctStats) {
          a.maps += 1;
          a.ctN += 1;
          a.ctKills += s.ctStats.kills || 0;
          a.ctDeaths += s.ctStats.deaths || 0;
          a.ctAssists += s.ctStats.assists || 0;
          if (s.ctStats.adr != null) { a.ctAdrSum += s.ctStats.adr; a.ctAdrN++; }
          if (s.ctStats.rating != null) { a.ctRatingSum += s.ctStats.rating; a.ctRatingN++; }
        }
        if (s.tStats) {
          a.maps += 1;
          a.tN += 1;
          a.tKills += s.tStats.kills || 0;
          a.tDeaths += s.tStats.deaths || 0;
          a.tAssists += s.tStats.assists || 0;
          if (s.tStats.adr != null) { a.tAdrSum += s.tStats.adr; a.tAdrN++; }
          if (s.tStats.rating != null) { a.tRatingSum += s.tStats.rating; a.tRatingN++; }
        }
      }
    }
  }
  return [...agg.values()].map((a) => ({
    ...a,
    ctKd: a.ctDeaths > 0 ? a.ctKills / a.ctDeaths : a.ctKills,
    tKd: a.tDeaths > 0 ? a.tKills / a.tDeaths : a.tKills,
    avgCtAdr: a.ctAdrN ? a.ctAdrSum / a.ctAdrN : null,
    avgTAdr: a.tAdrN ? a.tAdrSum / a.tAdrN : null,
    avgCtRating: a.ctRatingN ? a.ctRatingSum / a.ctRatingN : null,
    avgTRating: a.tRatingN ? a.tRatingSum / a.tRatingN : null,
  }));
}

// 某选手在每张图中的半场数据（用于选手详情页半场表）
export function playerSideHistory(playerId) {
  const matches = loadMatches();
  const rows = [];
  for (const m of matches) {
    for (const map of m.maps) {
      const s = map.stats.find((x) => x.playerId === playerId);
      if (!s) continue;
      if (!s.ctStats && !s.tStats) continue;
      rows.push({
        matchId: m.id,
        date: m.date,
        map: map.map,
        side: s.side,
        opponent: s.side === "A" ? m.teamB : m.teamA,
        score: s.side === "A" ? `${map.scoreA}:${map.scoreB}` : `${map.scoreB}:${map.scoreA}`,
        won: s.side === "A" ? map.scoreA > map.scoreB : map.scoreB > map.scoreA,
        ctStats: s.ctStats,
        tStats: s.tStats,
      });
    }
  }
  return rows;
}

// 某选手在每张图中的表现指标（精准度/急停/拉枪/补枪/反应/武器）
export function playerPerformanceHistory(playerId) {
  const matches = loadMatches();
  const rows = [];
  for (const m of matches) {
    for (const map of m.maps) {
      const s = map.stats.find((x) => x.playerId === playerId);
      if (!s || !s.performance) continue;
      rows.push({
        matchId: m.id,
        date: m.date,
        map: map.map,
        opponent: s.side === "A" ? m.teamB : m.teamA,
        performance: s.performance,
        multiKills: s.multiKills || null,
        mvp: s.mvp ?? 0,
        rws: s.rws ?? null,
        we: s.we ?? null,
      });
    }
  }
  return rows;
}

// 某选手在每张图中的对位矩阵
export function playerH2HHistory(playerId) {
  const matches = loadMatches();
  const rows = [];
  for (const m of matches) {
    for (const map of m.maps) {
      const s = map.stats.find((x) => x.playerId === playerId);
      if (!s || !s.h2h) continue;
      rows.push({
        matchId: m.id,
        date: m.date,
        map: map.map,
        h2h: s.h2h,
        opponent: s.side === "A" ? m.teamB : m.teamA,
      });
    }
  }
  return rows;
}
