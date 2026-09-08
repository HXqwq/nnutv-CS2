import fs from "fs";
import path from "path";

const dir = path.join(process.cwd(), "data");
const plPath = path.join(dir, "players.json");
const mtPath = path.join(dir, "matches.json");

const players = JSON.parse(fs.readFileSync(plPath, "utf8"));
const matches = JSON.parse(fs.readFileSync(mtPath, "utf8"));

// ---- 新增 5 名选手（痱子可烂队，截图负方阵容）----
const newPlayers = [
  { id: "p49", nickname: "柳智敏", realName: "", team: "痱子可烂", role: "", joined: "2026-03" },
  { id: "p50", nickname: "PH只会送", realName: "", team: "痱子可烂", role: "", joined: "2026-03" },
  { id: "p51", nickname: "用户5696447", realName: "", team: "痱子可烂", role: "", joined: "2026-03" },
  { id: "p52", nickname: "自恋型人格", realName: "", team: "痱子可烂", role: "", joined: "2026-03" },
  { id: "p53", nickname: "比奇堡汉堡大厨", realName: "", team: "痱子可烂", role: "", joined: "2026-03" },
];
players.push(...newPlayers);

// ---- 新增 m4 比赛 ----
// teamA=ADS(胜, star sky 等). teamB=痱子可烂(负, 柳智敏 等). 远古遗迹 13:3
const stat = (playerId, side, kills, deaths, assists, adr, hs, rating, ct, t, rws, we, h2h) => ({
  playerId, side, kills, deaths, assists, adr, hs, rating,
  ctStats: ct, tStats: t, multiKills: null, mvp: 0, rws, we, performance: null, h2h,
});

const m4 = {
  id: "m4",
  date: "2026-03-21",
  event: "NNU Major S1",
  stage: "Group Stage",
  format: "BO1",
  teamA: "ADS",
  teamB: "痱子可烂",
  scoreA: 13,
  scoreB: 3,
  maps: [
    {
      map: "远古遗迹",
      scoreA: 13,
      scoreB: 3,
      stats: [
        // teamA = ADS（胜）
        stat("p44", "A", 25, 7, 3, 141, 44, 2.07,
          { kills: 17, deaths: 6, assists: 1, adr: 125, hs: 35, rating: 1.83 },
          { kills: 8, deaths: 1, assists: 2, adr: 190, hs: 63, rating: 2.80 },
          26.37, 15.1,
          { p49: { killed: 6, death: 1 }, p50: { killed: 5, death: 1 }, p51: { killed: 4, death: 2 }, p52: { killed: 5, death: 2 }, p53: { killed: 5, death: 1 } }),
        stat("p43", "A", 16, 7, 5, 110, 58, 1.55,
          { kills: 15, deaths: 5, assists: 3, adr: 127, hs: 64, rating: 1.80 },
          { kills: 1, deaths: 2, assists: 2, adr: 56, hs: 0, rating: 0.79 },
          17.79, 13.2,
          { p49: { killed: 2, death: 4 }, p50: { killed: 2, death: 3 }, p51: { killed: 3, death: 0 }, p52: { killed: 3, death: 0 }, p53: { killed: 6, death: 0 } }),
        stat("p45", "A", 17, 8, 3, 94, 59, 1.40,
          { kills: 14, deaths: 7, assists: 3, adr: 110, hs: 57, rating: 1.58 },
          { kills: 3, deaths: 1, assists: 0, adr: 47, hs: 67, rating: 0.86 },
          13.86, 11.8,
          { p49: { killed: 1, death: 4 }, p50: { killed: 4, death: 3 }, p51: { killed: 6, death: 0 }, p52: { killed: 3, death: 0 }, p53: { killed: 3, death: 1 } }),
        stat("p46", "A", 12, 9, 6, 83, 33, 1.26,
          { kills: 7, deaths: 7, assists: 5, adr: 65, hs: 14, rating: 1.03 },
          { kills: 5, deaths: 2, assists: 1, adr: 137, hs: 60, rating: 1.95 },
          11.93, 11.7,
          { p49: { killed: 3, death: 3 }, p50: { killed: 4, death: 2 }, p51: { killed: 2, death: 2 }, p52: { killed: 2, death: 1 }, p53: { killed: 1, death: 1 } }),
        stat("p47", "A", 6, 7, 5, 42, 0, 0.71,
          { kills: 3, deaths: 5, assists: 4, adr: 38, hs: 0, rating: 0.59 },
          { kills: 3, deaths: 2, assists: 1, adr: 55, hs: 0, rating: 1.08 },
          7.55, 6.7,
          { p49: { killed: 3, death: 3 }, p50: { killed: 0, death: 0 }, p51: { killed: 1, death: 1 }, p52: { killed: 2, death: 1 }, p53: { killed: 0, death: 2 } }),
        // teamB = 痱子可烂（负）
        stat("p49", "B", 15, 15, 5, 103, 60, 1.40,
          { kills: 1, deaths: 4, assists: 0, adr: 42, hs: 0, rating: 0.44 },
          { kills: 14, deaths: 11, assists: 5, adr: 123, hs: 64, rating: 1.72 },
          6.88, 9.1,
          { p44: { killed: 1, death: 6 }, p43: { killed: 4, death: 2 }, p45: { killed: 4, death: 1 }, p46: { killed: 3, death: 3 }, p47: { killed: 3, death: 3 } }),
        stat("p50", "B", 9, 15, 1, 55, 11, 0.73,
          { kills: 3, deaths: 4, assists: 0, adr: 34, hs: 33, rating: 0.60 },
          { kills: 6, deaths: 11, assists: 1, adr: 62, hs: 0, rating: 0.70 },
          2.37, 4.5,
          { p44: { killed: 1, death: 5 }, p43: { killed: 3, death: 2 }, p45: { killed: 3, death: 4 }, p46: { killed: 2, death: 4 }, p47: { killed: 0, death: 0 } }),
        stat("p51", "B", 5, 16, 4, 42, 40, 0.58,
          { kills: 1, deaths: 4, assists: 2, adr: 61, hs: 100, rating: 0.62 },
          { kills: 4, deaths: 12, assists: 2, adr: 36, hs: 25, rating: 0.56 },
          3.54, 3.8,
          { p44: { killed: 2, death: 4 }, p43: { killed: 0, death: 3 }, p45: { killed: 0, death: 6 }, p46: { killed: 2, death: 2 }, p47: { killed: 1, death: 1 } }),
        stat("p52", "B", 4, 15, 3, 45, 50, 0.40,
          { kills: 0, deaths: 4, assists: 1, adr: 26, hs: 0, rating: 0.19 },
          { kills: 4, deaths: 11, assists: 2, adr: 52, hs: 50, rating: 0.59 },
          2.79, 3.7,
          { p44: { killed: 2, death: 5 }, p43: { killed: 0, death: 3 }, p45: { killed: 0, death: 3 }, p46: { killed: 1, death: 2 }, p47: { killed: 1, death: 2 } }),
        stat("p53", "B", 5, 15, 1, 45, 20, 0.64,
          { kills: 3, deaths: 4, assists: 0, adr: 109, hs: 0, rating: 0.86 },
          { kills: 2, deaths: 11, assists: 1, adr: 23, hs: 50, rating: 0.27 },
          1.29, 3.2,
          { p44: { killed: 1, death: 5 }, p43: { killed: 0, death: 6 }, p45: { killed: 1, death: 3 }, p46: { killed: 1, death: 1 }, p47: { killed: 2, death: 0 } }),
      ],
    },
  ],
};
matches.push(m4);

const json = (o) => JSON.stringify(o, null, 2) + "\n";
fs.writeFileSync(plPath, json(players));
fs.writeFileSync(mtPath, json(matches));

console.log("players:", players.length, "matches:", matches.map((m) => m.id).join(","));
console.log("new players:", newPlayers.map((p) => p.id).join(","));
