// 一次性迁移脚本：把 Get5 面板 (http://10.30.239.29:2626) 的选手/队伍数据
// 合并进 cs2-stats-site 的 data/players.json，并生成 data/teams.json
// 运行一次即可，不进 git（后续可删）
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ROOT = path.join(__dirname, "..");
import panelPlayersRaw from "../../get5-import/players.json" with { type: "json" };
import panelTeamsRaw from "../../get5-import/teams.json" with { type: "json" };
const panelPlayers = panelPlayersRaw.players;
const panelTeams = panelTeamsRaw.teams;
const sitePlayers = JSON.parse(fs.readFileSync(path.join(ROOT, "data/players.json"), "utf8"));

const teamById = Object.fromEntries(panelTeams.map((t) => [t._id, t.team_name]));

// 面板 displayed_name -> 站点 player.id（高置信匹配，经人工核对）
// 注意：p27 站点名"轮转羊肉重度残疾" vs 面板"轮椅羊肉重度残疾"，判定为同一人（差异一字，m3 天天禄阵容核心，面板现属 Bizon）
const MATCH = {
  "b1g B": "p28",
  "Apple_Pie": "p26",
  "BIGBANBOOOOOOOO": "p29",        // 站点原名 BIGBANBOO…（完美平台截断），面板为全名
  "自信即是巅峰^_": "p12",
  "EnovEN7": "p13",
  "瓦洛兰特捷提": "p15",
  "用户2144462·": "p11",           // 站点 用户*2144462（完美平台格式）
  "轮椅羊肉重度残疾": "p27",
};
// 面板全名替换站点截断名的映射
const RENAME = { p29: "BIGBANBOOOOOOOO" };

const byId = Object.fromEntries(sitePlayers.map((p) => [p.id, p]));
const usedPanelIds = new Set();

// 1. 匹配已有选手：补 steamId + avatar，更新所属队伍为面板当前队伍
for (const [name, id] of Object.entries(MATCH)) {
  const pp = panelPlayers.find((x) => x.displayed_name === name);
  if (!pp) throw new Error("panel player not found: " + name);
  const sp = byId[id];
  if (!sp) throw new Error("site player not found: " + id);
  sp.steamId = pp.sid;
  sp.avatar = "/avatars/" + pp.sid + ".png";
  sp.team = teamById[pp.team] || sp.team;
  if (RENAME[id]) sp.nickname = RENAME[id];
  usedPanelIds.add(pp._id);
}

// 2. 面板中未匹配的选手 -> 新增 p31 起
let next = 31;
while (byId["p" + next]) next++;
const newPlayers = [];
for (const pp of panelPlayers) {
  if (usedPanelIds.has(pp._id)) continue;
  newPlayers.push({
    id: "p" + next++,
    nickname: pp.displayed_name,
    realName: pp.real_name || "",
    team: teamById[pp.team] || "",
    role: "",
    joined: "2026-04", // 面板录入时间（依据头像上传时间戳 2026-04）
    steamId: pp.sid,
    avatar: "/avatars/" + pp.sid + ".png",
  });
}

const out = [...sitePlayers, ...newPlayers];
fs.writeFileSync(path.join(ROOT, "data/players.json"), JSON.stringify(out, null, 2) + "\n");

// 3. 生成 teams.json（队伍实体，来自面板）
const teams = panelTeams.map((t, i) => ({
  id: "t" + (i + 1),
  name: t.team_name,
  shortName: t.short_name,
  country: t.country_code,
  panelId: t._id,
}));
fs.writeFileSync(path.join(ROOT, "data/teams.json"), JSON.stringify(teams, null, 2) + "\n");

// ---- 校验输出 ----
const maxId = (n) => Math.max(...n.map((p) => parseInt(p.id.slice(1))));
const uniq = (arr) => new Set(arr).size === arr.length;
const sids = out.filter((p) => p.steamId).map((p) => p.steamId);
console.log("players total:", out.length, "(site", sitePlayers.length, "+ new", newPlayers.length + ")");
console.log("steamId count:", sids.length, "unique:", uniq(sids));
console.log("avatar count:", out.filter((p) => p.avatar).length);
console.log("teams:", teams.length);
// 每个头像文件都存在
const avDir = path.join(ROOT, "public/avatars");
const files = new Set(fs.readdirSync(avDir));
const missAv = out.filter((p) => p.avatar && !files.has(p.steamId + ".png"));
console.log("avatar files missing:", missAv.length ? missAv.map((p) => p.nickname) : "none");
console.log("new players:", newPlayers.map((p) => p.nickname + "(" + p.team + ")").join(", "));
console.log("matched teams now:", Object.entries(MATCH).map(([n, id]) => byId[id].nickname + "->" + byId[id].team).join(", "));
