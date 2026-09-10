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

export function loadEvents() {
  const file = path.join(dataDir, "events.json");
  if (!fs.existsSync(file)) return [];
  const events = JSON.parse(fs.readFileSync(file, "utf8"));
  return [...events].sort((a, b) => (b.startDate || "").localeCompare(a.startDate || ""));
}

export function loadTransfers() {
  const file = path.join(dataDir, "transfers.json");
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

// 某战队的转会记录（含转入、转出、下放、改名），按日期倒序
export function getTeamTransfers(teamName) {
  const transfers = loadTransfers();
  return transfers
    .filter((t) => t.from === teamName || t.to === teamName)
    .sort((a, b) => b.date.localeCompare(a.date));
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

// 全站纪录与统计概览（/stats 页）——全部从 matches.json 已收录数据计算，不引入任何编造数值
export function statsRecords() {
  const players = loadPlayers();
  const matches = loadMatches();
  const teams = loadTeams();
  const byId = new Map(players.map((p) => [p.id, p]));

  // 收集所有「有详细数据」的单图选手行
  const rows = [];
  for (const m of matches) {
    for (const map of m.maps) {
      for (const s of map.stats || []) {
        if (s.kills == null && s.rating == null) continue;
        rows.push({ s, m, map });
      }
    }
  }

  const top = (getVal, n = 3) =>
    rows
      .map((r) => ({ ...r, val: getVal(r) }))
      .filter((r) => r.val != null)
      .sort((a, b) => b.val - a.val)
      .slice(0, n);

  const mapRecords = [
    { label: "单图最高 Rating", unit: "", rows: top((r) => (typeof r.s.rating === "number" ? r.s.rating : null)), show: (v) => fmt(v) },
    { label: "单图最多击杀", unit: " K", rows: top((r) => r.s.kills), show: (v) => v },
    { label: "单图最高 ADR", unit: "", rows: top((r) => (typeof r.s.adr === "number" ? r.s.adr : null)), show: (v) => fmt(v, 1) },
    { label: "单图最高爆头率", unit: "%", rows: top((r) => (typeof r.s.hs === "number" ? r.s.hs : null)), show: (v) => fmt(v, 1) },
    { label: "单图最多助攻", unit: " A", rows: top((r) => r.s.assists), show: (v) => v },
    { label: "单图最佳 K/D", unit: "", rows: top((r) => (r.s.deaths > 0 ? r.s.kills / r.s.deaths : r.s.kills)), show: (v) => fmt(v) },
  ].map((rec) => ({
    ...rec,
    rows: rec.rows.map((r) => ({
      player: byId.get(r.s.playerId),
      val: r.val,
      matchId: r.m.id,
      date: r.m.date,
      mapName: r.map.map,
      teams: `${r.m.teamA} vs ${r.m.teamB}`,
    })),
  }));

  // 最大分差的地图（比分来自比赛结果截图，真实数据）
  let lopsided = null;
  for (const m of matches) {
    for (const map of m.maps) {
      const diff = Math.abs(map.scoreA - map.scoreB);
      if (!lopsided || diff > lopsided.diff) lopsided = { diff, m, map };
    }
  }

  // 生涯累计 Top5（aggregateAll 已过滤无数据选手）
  const agg = aggregateAll();
  const careerTop = (key, n = 5, f) =>
    [...agg]
      .sort((a, b) => (b[key] ?? 0) - (a[key] ?? 0))
      .slice(0, n)
      .map((a) => ({ player: a.player, val: f ? f(a) : a[key], maps: a.maps }));

  return {
    overview: {
      totalMatches: matches.length,
      totalMaps: matches.reduce((n, m) => n + m.maps.length, 0),
      matchesWithStats: new Set(rows.map((r) => r.m.id)).size,
      totalPlayers: players.length,
      playersWithData: new Set(rows.map((r) => r.s.playerId)).size,
      totalTeams: teams.length,
      statRows: rows.length,
    },
    mapRecords,
    lopsided: lopsided
      ? { diff: lopsided.diff, matchId: lopsided.m.id, teams: `${lopsided.m.teamA} vs ${lopsided.m.teamB}`, score: `${lopsided.map.scoreA}:${lopsided.map.scoreB}`, mapName: lopsided.map.map, date: lopsided.m.date }
      : null,
    careerKills: careerTop("kills"),
    careerAssists: careerTop("assists"),
    careerMaps: careerTop("maps"),
  };
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
