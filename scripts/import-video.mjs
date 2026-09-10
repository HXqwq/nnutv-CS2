// 从录屏视频转录的数据导入 matches.json / players.json
// 数据源：完美世界竞技平台 比赛详情页「基础数据(全部)」+「对位数据(全场)」
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const matchesPath = path.join(ROOT, "data", "matches.json");
const playersPath = path.join(ROOT, "data", "players.json");

const matches = JSON.parse(fs.readFileSync(matchesPath, "utf8"));
const players = JSON.parse(fs.readFileSync(playersPath, "utf8"));

// ---------- 选手ID映射（视频昵称 -> 库内ID），null 表示新建 ----------
const NEW_PLAYERS = [
  // 麦恩莉
  { key: "saber", nickname: "saber", team: "麦恩莉" },
  { key: "逆光", nickname: "逆光バックライト", team: "麦恩莉" },
  { key: "chengxiaoya", nickname: "chengxiaoya", team: "麦恩莉" },
  { key: "Mr.CLeaN", nickname: "Mr.CLeaN", team: "麦恩莉" },
  { key: "用户7312342", nickname: "用户7312342", team: "麦恩莉" },
  // C++
  { key: "Maletinda", nickname: "Maletinda", team: "C++" },
  { key: "新用户85585", nickname: "新用户85585", team: "C++" },
  { key: "失策z", nickname: "失策z", team: "C++" },
  { key: "Chyannie Lee", nickname: "Chyannie Lee", team: "C++" },
  { key: "MaoXZhe", nickname: "MaoXZhe", team: "C++" },
];

let maxId = Math.max(...players.map((p) => parseInt(String(p.id).replace("p", ""), 10)).filter(Number.isFinite));
const keyToId = {};
for (const np of NEW_PLAYERS) {
  const exist = players.find((p) => p.nickname === np.nickname);
  if (exist) { keyToId[np.key] = exist.id; continue; }
  maxId += 1;
  const id = "p" + maxId;
  players.push({ id, nickname: np.nickname, realName: "", team: np.team, role: "", joined: "2026-03" });
  keyToId[np.key] = id;
  console.log("  + 新增选手", id, np.nickname, "(" + np.team + ")");
}

// 已有选手
const ID = {
  // m5
  Luminoth: "p47", "24级": "p45", Ruingalaxy: "p46", AT: "p43", starSky: "p44",
  "用户2144462": "p11", EnovEN7: "p13", 瓦洛兰特: "p15", 自信: "p12", 陳奕迅: "p14",
  // m6
  傻里: "p35", 科维奇: "p34", K1smetq: "p37", 皮克斯儿: "p33", MoNoxide: "p36",
  葡萄糖: "p107", 纽希拉: "p109", 偷地雷: "p110", 方王: "p106", "96w1M": "p108",
  // m16
  shdd: "p129", "用户8712099": "p132", MAGENIF1CENT: "p133", N1k0: "p130", "用户7708979": "p131",
  爱翠嘴: "p64", Adun: "p67", 山看水: "p66", frozen1: "p68", 吴意: "p65",
  // m27
  Apple_Pie: "p26", _C1el: "p30", psychical1: "p31", BIGBANBOO: "p29", "b1g B": "p28",
  // m7
  saber: keyToId.saber, 逆光: keyToId["逆光"], chengxiaoya: keyToId.chengxiaoya,
  "Mr.CLeaN": keyToId["Mr.CLeaN"], "用户7312342": keyToId["用户7312342"],
  Maletinda: keyToId.Maletinda, "新用户85585": keyToId["新用户85585"],
  失策z: keyToId["失策z"], "Chyannie Lee": keyToId["Chyannie Lee"], MaoXZhe: keyToId.MaoXZhe,
};

// ---------- 各场比赛数据 ----------
// row = 视频中「对位数据」矩阵的行(上→下)，col = 列(左→右)
// cells[ri][ci] = [该行选手击杀列选手数, 该行选手被列选手击杀数]
const JOBS = [
  {
    id: "m5", matchId: "3484144400", mapName: "核子危机", mapIndex: 0,
    A: [ // ADS（视频上方组）
      { pid: ID.Luminoth, k: 14, d: 13, a: 0, hs: 64, adr: 77, rws: 7.69, rating: 1.07, we: 7.5 },
      { pid: ID["24级"], k: 11, d: 14, a: 3, hs: 64, adr: 72, rws: 5.96, rating: 0.92, we: 7.6 },
      { pid: ID.Ruingalaxy, k: 8, d: 16, a: 4, hs: 50, adr: 52, rws: 5.27, rating: 0.78, we: 5.9 },
      { pid: ID.AT, k: 9, d: 13, a: 2, hs: 50, adr: 50, rws: 4.93, rating: 0.75, we: 6.7 },
      { pid: ID.starSky, k: 4, d: 15, a: 2, hs: 50, adr: 26, rws: 0.59, rating: 0.41, we: 4.1 },
    ],
    B: [ // 老年人（视频下方组）
      { pid: ID["用户2144462"], k: 19, d: 11, a: 6, hs: 17, adr: 128, rws: 19.83, rating: 1.58, we: 12.6 },
      { pid: ID.EnovEN7, k: 17, d: 9, a: 5, hs: 65, adr: 96, rws: 17.15, rating: 1.37, we: 11.5 },
      { pid: ID.瓦洛兰特, k: 13, d: 9, a: 4, hs: 15, adr: 78, rws: 13.15, rating: 1.07, we: 10.7 },
      { pid: ID.自信, k: 12, d: 10, a: 1, hs: 42, adr: 66, rws: 10.19, rating: 0.94, we: 7.9 },
      { pid: ID.陳奕迅, k: 10, d: 7, a: 3, hs: 43, adr: 43, rws: 8.57, rating: 0.83, we: 9.5 },
    ],
    h2h: {
      rows: [ID["用户2144462"], ID.EnovEN7, ID.瓦洛兰特, ID.陳奕迅, ID.自信],
      cols: [ID["24级"], ID.Luminoth, ID.AT, ID.Ruingalaxy, ID.starSky],
      cells: [
        [[3, 2], [1, 7], [4, 1], [5, 1], [6, 0]],
        [[5, 2], [2, 1], [4, 2], [2, 3], [4, 1]],
        [[2, 3], [3, 2], [3, 2], [3, 1], [2, 1]],
        [[1, 1], [5, 3], [0, 1], [1, 1], [3, 1]],
        [[3, 3], [2, 1], [2, 3], [5, 2], [0, 1]],
      ],
    },
  },
  {
    id: "m6", matchId: "3484141968", mapName: "死亡乐园", mapIndex: 0,
    A: [ // 常务副够特（视频下方组，13）
      { pid: ID.傻里, k: 19, d: 12, a: 5, hs: 74, adr: 95, rws: 15.74, rating: 1.35, we: 9.9 },
      { pid: ID.科维奇, k: 16, d: 12, a: 7, hs: 31, adr: 90, rws: 15.53, rating: 1.3, we: 10.4 },
      { pid: ID.K1smetq, k: 15, d: 14, a: 4, hs: 45, adr: 75, rws: 9.46, rating: 1.11, we: 9.1 },
      { pid: ID.皮克斯儿, k: 15, d: 13, a: 3, hs: 67, adr: 75, rws: 6.89, rating: 1.09, we: 9.5 },
      { pid: ID.MoNoxide, k: 12, d: 10, a: 7, hs: 42, adr: 71, rws: 9.88, rating: 1.08, we: 9.7 },
    ],
    B: [ // TeamGold（视频上方组，7）
      { pid: ID.葡萄糖, k: 17, d: 13, a: 1, hs: 65, adr: 69, rws: 6.23, rating: 1.12, we: 10.1 },
      { pid: ID.纽希拉, k: 14, d: 18, a: 4, hs: 54, adr: 74, rws: 9.13, rating: 1.05, we: 7.3 },
      { pid: ID.偷地雷, k: 11, d: 17, a: 8, hs: 36, adr: 73, rws: 8.12, rating: 0.97, we: 7.5 },
      { pid: ID.方王, k: 13, d: 15, a: 0, hs: 67, adr: 56, rws: 5.77, rating: 0.83, we: 7.7 },
      { pid: ID["96w1M"], k: 6, d: 16, a: 6, hs: 50, adr: 46, rws: 4.25, rating: 0.63, we: 6.8 },
    ],
    h2h: {
      rows: [ID.科维奇, ID.傻里, ID.MoNoxide, ID.皮克斯儿, ID.K1smetq],
      cols: [ID.葡萄糖, ID.方王, ID.偷地雷, ID.纽希拉, ID["96w1M"]],
      cells: [
        [[2, 1], [4, 2], [1, 4], [4, 3], [5, 2]],
        [[5, 4], [4, 2], [3, 2], [5, 3], [2, 1]],
        [[1, 3], [2, 5], [5, 0], [3, 2], [1, 0]],
        [[1, 5], [1, 3], [4, 1], [6, 2], [3, 2]],
        [[4, 4], [4, 1], [4, 4], [0, 4], [3, 1]],
      ],
    },
  },
  {
    id: "m7", matchId: "3484081808", mapName: "荒漠迷城", mapIndex: 0,
    A: [ // 麦恩莉（视频上方组，10）
      { pid: ID.saber, k: 25, d: 18, a: 9, hs: 42, adr: 134, rws: 14.87, rating: 1.64, we: 12.7 },
      { pid: ID.逆光, k: 16, d: 16, a: 2, hs: 40, adr: 70, rws: 6.38, rating: 0.98, we: 8.2 },
      { pid: ID.chengxiaoya, k: 14, d: 18, a: 4, hs: 9, adr: 59, rws: 4.78, rating: 0.88, we: 7.1 },
      { pid: ID["Mr.CLeaN"], k: 13, d: 17, a: 4, hs: 46, adr: 63, rws: 7.33, rating: 0.88, we: 7.1 },
      { pid: ID["用户7312342"], k: 8, d: 19, a: 4, hs: 50, adr: 42, rws: 6.2, rating: 0.6, we: 5.5 },
    ],
    B: [ // C++（视频下方组，13）
      { pid: ID.Maletinda, k: 26, d: 15, a: 7, hs: 58, adr: 111, rws: 17.17, rating: 1.61, we: 12.0 },
      { pid: ID["新用户85585"], k: 19, d: 17, a: 10, hs: 47, adr: 81, rws: 9.75, rating: 1.3, we: 8.8 },
      { pid: ID.失策z, k: 18, d: 17, a: 8, hs: 33, adr: 86, rws: 14.07, rating: 1.21, we: 9.5 },
      { pid: ID["Chyannie Lee"], k: 16, d: 13, a: 9, hs: 38, adr: 76, rws: 10.36, rating: 1.13, we: 9.2 },
      { pid: ID.MaoXZhe, k: 8, d: 14, a: 8, hs: 13, adr: 44, rws: 2.56, rating: 0.69, we: 6.3 },
    ],
    h2h: {
      rows: [ID.Maletinda, ID.失策z, ID["Chyannie Lee"], ID["新用户85585"], ID.MaoXZhe],
      cols: [ID.saber, ID.逆光, ID["Mr.CLeaN"], ID.chengxiaoya, ID["用户7312342"]],
      cells: [
        [[6, 1], [4, 4], [7, 2], [5, 5], [4, 3]],
        [[5, 10], [4, 3], [1, 1], [4, 1], [4, 2]],
        [[2, 4], [3, 3], [5, 5], [3, 0], [3, 1]],
        [[5, 4], [3, 3], [1, 4], [4, 5], [6, 1]],
        [[0, 6], [2, 3], [3, 1], [2, 3], [1, 1]],
      ],
    },
  },
  {
    id: "m16", matchId: "3484144656", mapName: "远古遗迹", mapIndex: 0,
    A: [ // 惊天五条区（视频上方组，7）
      { pid: ID.shdd, k: 17, d: 18, a: 8, hs: 61, adr: 96, rws: 9.04, rating: 1.31, we: 8.7 },
      { pid: ID["用户8712099"], k: 13, d: 15, a: 4, hs: 62, adr: 72, rws: 9.23, rating: 1.03, we: 8.9 },
      { pid: ID.MAGENIF1CENT, k: 14, d: 17, a: 1, hs: 57, adr: 59, rws: 5.91, rating: 0.95, we: 6.6 },
      { pid: ID.N1k0, k: 13, d: 13, a: 3, hs: 38, adr: 57, rws: 5.52, rating: 0.9, we: 7.5 },
      { pid: ID["用户7708979"], k: 5, d: 17, a: 9, hs: 40, adr: 53, rws: 2.31, rating: 0.66, we: 5.2 },
    ],
    B: [ // 总被炸（视频下方组，13）
      { pid: ID.爱翠嘴, k: 22, d: 12, a: 5, hs: 58, adr: 106, rws: 15.26, rating: 1.59, we: 12.3 },
      { pid: ID.Adun, k: 20, d: 13, a: 9, hs: 35, adr: 112, rws: 20.58, rating: 1.55, we: 11.6 },
      { pid: ID.山看水, k: 10, d: 15, a: 11, hs: 80, adr: 83, rws: 8.75, rating: 1.06, we: 7.6 },
      { pid: ID.frozen1, k: 15, d: 12, a: 4, hs: 27, adr: 63, rws: 8.27, rating: 1.04, we: 8.9 },
      { pid: ID.吴意, k: 12, d: 10, a: 3, hs: 75, adr: 54, rws: 4.65, rating: 0.84, we: 8.9 },
    ],
    h2h: {
      rows: [ID.爱翠嘴, ID.Adun, ID.吴意, ID.frozen1, ID.山看水],
      cols: [ID["用户8712099"], ID.shdd, ID.N1k0, ID.MAGENIF1CENT, ID["用户7708979"]],
      cells: [
        [[5, 2], [5, 3], [3, 3], [4, 4], [5, 0]],
        [[5, 2], [4, 5], [3, 4], [4, 1], [4, 1]],
        [[3, 3], [2, 1], [2, 3], [1, 2], [4, 1]],
        [[1, 1], [6, 6], [5, 1], [3, 2], [0, 2]],
        [[0, 5], [1, 2], [0, 2], [5, 5], [4, 1]],
      ],
    },
  },
  {
    id: "m27", matchId: "3504411280", mapName: "核子危机", mapIndex: 0,
    A: [ // Bizon（视频上方组）
      { pid: ID.Apple_Pie, k: 10, d: 15, a: 4, hs: 56, adr: 74, rws: 4.01, rating: 0.91, we: 7.4 },
      { pid: ID._C1el, k: 10, d: 15, a: 3, hs: 80, adr: 74, rws: 7.71, rating: 0.88, we: 6.0 },
      { pid: ID.psychical1, k: 8, d: 15, a: 2, hs: 75, adr: 64, rws: 5.91, rating: 0.76, we: 4.9 },
      { pid: ID.BIGBANBOO, k: 3, d: 14, a: 1, hs: 0, adr: 17, rws: 0.61, rating: 0.28, we: 3.1 },
      { pid: ID["b1g B"], k: 2, d: 13, a: 1, hs: 50, adr: 25, rws: 0.0, rating: 0.28, we: 3.7 },
    ],
    B: [ // TeamGold（视频下方组）
      { pid: ID.纽希拉, k: 24, d: 8, a: 4, hs: 50, adr: 130, rws: 23.58, rating: 1.89, we: 13.4 },
      { pid: ID.偷地雷, k: 17, d: 7, a: 6, hs: 47, adr: 97, rws: 14.34, rating: 1.45, we: 12.8 },
      { pid: ID["96w1M"], k: 14, d: 7, a: 0, hs: 50, adr: 63, rws: 12.46, rating: 1.02, we: 9.7 },
      { pid: ID.葡萄糖, k: 9, d: 6, a: 5, hs: 56, adr: 70, rws: 11.46, rating: 0.93, we: 10.0 },
      { pid: ID.方王, k: 8, d: 5, a: 7, hs: 25, adr: 67, rws: 11.1, rating: 0.9, we: 10.2 },
    ],
    h2h: null,
  },
];

// ---------- 写入 + 校验 ----------
let errors = 0;
for (const job of JOBS) {
  const match = matches.find((m) => m.id === job.id);
  if (!match) { console.log("!! 找不到比赛", job.id); errors++; continue; }

  const stats = [];
  const sideOf = (pid) => (job.A.some((p) => p.pid === pid) ? "A" : "B");
  const all = [...job.A, ...job.B];
  const info = new Map(all.map((p) => [p.pid, p]));

  // 计算 h2h（两个方向）
  const h2hMap = new Map(all.map((p) => [p.pid, {}]));
  if (job.h2h) {
    const { rows, cols, cells } = job.h2h;
    for (let ri = 0; ri < rows.length; ri++) {
      for (let ci = 0; ci < cols.length; ci++) {
        const [rk, rd] = cells[ri][ci];
        h2hMap.get(rows[ri])[cols[ci]] = { killed: rk, death: rd };
        h2hMap.get(cols[ci])[rows[ri]] = { killed: rd, death: rk };
      }
    }
  }

  for (const p of all) {
    const h = h2hMap.get(p.pid);
    if (job.h2h) {
      const hk = Object.values(h).reduce((a, b) => a + b.killed, 0);
      const hd = Object.values(h).reduce((a, b) => a + b.death, 0);
      // 硬约束：对位击杀合计必须等于全场击杀
      if (hk !== p.k) { console.log("!! " + job.id + " " + p.pid + " 对位击杀合计 " + hk + " ≠ 全场击杀 " + p.k); errors++; }
      // 软约束：被杀合计 ≤ 全场死亡（差额 = 自杀/坠伤/燃烧等非对位死亡）
      if (hd > p.d) { console.log("!! " + job.id + " " + p.pid + " 对位死亡合计 " + hd + " > 全场死亡 " + p.d); errors++; }
      else if (hd < p.d) { console.log("   " + job.id + " " + p.pid + " 对位死亡 " + hd + " < 全场死亡 " + p.d + "（差额 " + (p.d - hd) + " 非对位死亡）"); }
    }
    stats.push({
      playerId: p.pid,
      side: sideOf(p.pid),
      kills: p.k, deaths: p.d, assists: p.a,
      adr: p.adr, hs: p.hs, rating: p.rating,
      ctStats: null, tStats: null,
      multiKills: null, mvp: 0, rws: p.rws, we: p.we,
      performance: null,
      h2h: h,
    });
  }

  // 列方向校验（列合计 = 该列的死亡/击杀）
  if (job.h2h) {
    const { cols, cells } = job.h2h;
    for (let ci = 0; ci < cols.length; ci++) {
      let ck = 0, cd = 0;
      for (const row of cells) { ck += row[ci][0]; cd += row[ci][1]; }
      const info2 = info.get(cols[ci]);
      if (ck !== info2.d) { console.log("   " + job.id + " 被列 " + cols[ci] + " 击杀合计 " + ck + " < 其死亡 " + info2.d + "（差额 " + (info2.d - ck) + "）"); }
      if (cd !== info2.k) { console.log("!! " + job.id + " 列 " + cols[ci] + " 死亡合计 " + cd + " ≠ 其击杀 " + info2.k); errors++; }
    }
  }

  const mp = match.maps[job.mapIndex];
  mp.map = job.mapName;
  mp.stats = stats;
  match.matchId = job.matchId;
  console.log("✔ " + job.id + " " + match.teamA + " " + match.scoreA + ":" + match.scoreB + " " + match.teamB + "  " + job.mapName + "  写入 " + stats.length + " 行");
}

if (errors) {
  console.log("\n共 " + errors + " 处校验异常，未写入。");
  process.exit(1);
}
fs.writeFileSync(matchesPath, JSON.stringify(matches, null, 2) + "\n");
fs.writeFileSync(playersPath, JSON.stringify(players, null, 2) + "\n");
console.log("\n全部校验通过，已写入 " + matchesPath + " / " + playersPath);
