# NJNU CS2 社团数据站

HLTV 风格的校内 CS2 社团选手数据网站。基于 Next.js（App Router），数据以 JSON 文件存放，
方便直接从完美世界电竞平台搬运数据，无需数据库即可运行。

## 快速开始

```bash
npm install
npm run dev
```

打开 http://localhost:3000 即可访问。

## 目录结构

```
cs2-stats-site/
├── app/                    页面（App Router）
│   ├── page.js             首页：最近比赛 + 选手榜
│   ├── matches/            比赛列表 / 比赛详情
│   ├── players/            选手列表 / 选手详情
│   └── rankings/           排行榜（点击表头可排序）
├── data/
│   ├── players.json        选手档案
│   └── matches.json        比赛与逐图统计（示例数据，替换成真实数据即可）
├── lib/data.js             数据读取与聚合（排行榜、选手汇总等都在这里算）
└── scripts/csv-import.mjs  CSV 批量导入工具
```

## 如何录入数据

### 方式一：直接编辑 JSON

`data/players.json` 每个选手一条：

```json
{ "id": "p1", "nickname": "ropz", "realName": "", "team": "NJNU·Alpha", "role": "狙击手", "joined": "2026-03" }
```

`data/matches.json` 每场比赛一条，`maps[].stats` 里是每名选手在该图的数据：

```json
{
  "id": "m1", "date": "2026-09-01", "event": "社团秋季内战 第1轮", "format": "BO1",
  "teamA": "NJNU·Alpha", "teamB": "NJNU·Bravo", "scoreA": 1, "scoreB": 0,
  "maps": [
    { "map": "Mirage", "scoreA": 13, "scoreB": 9,
      "stats": [ { "playerId": "p1", "side": "A", "kills": 21, "deaths": 12, "assists": 3, "adr": 92.1, "hs": 54, "rating": 1.35 } ] }
  ]
}
```

改完保存，dev 模式下刷新页面立即生效。

### 方式二：CSV 批量导入（推荐，适合从完美平台搬运）

把数据整理成 CSV（一行 = 一名选手在一张图的数据），表头顺序固定：

```
date,event,format,teamA,teamB,map,scoreA,scoreB,playerId,nickname,team,role,side,kills,deaths,assists,adr,hs,rating
2026-09-07,社团秋季内战 第3轮,BO1,NJNU·Alpha,NJNU·Bravo,Mirage,13,9,p1,ropz,NJNU·Alpha,狙击手,A,21,12,3,92.1,54,1.35
```

然后运行：

```bash
npm run import -- path/to/your.csv
```

脚本会自动：
- 新增或更新选手档案
- 把同一比赛的多个地图归到一场比赛并计算系列赛比分
- 与已有数据合并（重复导入同一场会覆盖，不会重复）

> 提示：用 Excel/WPS 整理好数据后另存为「CSV UTF-8」格式即可。

## 部署上线（不再局限于本地）

本项目已配置静态导出（`next.config.mjs` 中 `output: "export"`）。执行：

```bash
npm run build
```

会在 `out/` 目录生成纯静态 HTML（含所有比赛/选手详情页），**整个文件夹扔给任何静态托管都能跑**，不需要服务器常驻进程。

### 数据更新流程

静态导出意味着数据在构建时写入页面。更新数据 = 三步：

```bash
npm run import -- 新数据.csv   # 或直接编辑 data/*.json
npm run build                 # 重新生成 out/
# 把 out/ 重新部署一次
```

### 方案对比

| 方案 | 费用 | 国内访问 | 适合 |
|------|------|----------|------|
| **Vercel**（推荐起步） | 免费 | 默认域名慢/不稳定，绑自有域名可用 | 已有 GitHub 习惯，更新=git push 自动构建 |
| **腾讯 EdgeOne Pages** | 免费 | ✅ 好 | 国内用户为主，同样支持从 GitHub 自动构建 |
| 阿里云/腾讯云 OSS + CDN | 几元/月 | ✅ 好 | 已有云服务器/备案域名 |
| 校内服务器 + nginx | 0 | 仅校园网（或公网 IP） | 社团自有机器，直接 `nginx -s reload` 即可 |

### Vercel 部署步骤（最快）

1. 把 `cs2-stats-site/` 推到 GitHub 仓库（`node_modules/`、`out/`、`.next/` 已在 .gitignore）
2. 打开 https://vercel.com → Sign up with GitHub → Add New Project → 选中该仓库
3. 框架自动识别 Next.js，直接点 Deploy，一分钟后拿到 `xxx.vercel.app` 网址
4. 以后更新数据：改 `data/*.json` → push → Vercel 自动重新构建上线

### EdgeOne Pages 部署步骤（国内访问友好）

1. 打开 https://console.cloud.tencent.com/edgeone/pages 注册（微信扫码即可）
2. 「创建项目」→ 导入同一个 GitHub 仓库 → 构建命令 `npm run build`，输出目录 `out`
3. 拿到 `xxx.edgeone.app` 域名，国内直连可用；也可绑自己的域名

> 以后若接入 MatchZy 自动采集（数据实时变化），再切换为服务器部署（`next start` + pm2 + nginx）或 Vercel 动态渲染，静态导出只是当前阶段的形态。

## 后续演进路线

1. **阶段一（当前）**：手动搬运数据 + JSON 存储，先跑起来
2. **阶段二**：接入 MatchZy 插件自动采集本服对局，替换手动搬运
3. **阶段三**：自算 HLTV Rating 2.0（KAST/Impact 公式），接 demo 解析补充深度数据
4. **部署**：Vercel 免费档可直接部署（JSON 数据随仓库走）；以后数据量大了再迁 PostgreSQL

## 常见问题

- **Rating 是怎么算的？** 目前直接展示搬运的平台评分的平均值；`lib/data.js` 里的 `aggregateAll()` 是唯一统计口径，以后换公式只改这一处。
- **想加新字段（比如 KAST）？** 在 `matches.json` 的 stats 里加字段，再到 `lib/data.js` 的聚合里累加、页面上加一列即可。
