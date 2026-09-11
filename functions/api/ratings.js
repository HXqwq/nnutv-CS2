// EdgeOne Pages 边缘函数 · 选手评分
// 路由：/api/ratings  （GET 读取聚合 + 我的投票；POST 投票）
//
// KV 命名空间在控制台绑定到本项目时定义「变量名」，本文件按 nnutv_kv 读取。
// 若你在控制台用了别的变量名，改这里的 KV_VAR 即可。
//
// 存储结构（key 只能含字母/数字/下划线，故用下划线分隔，无冒号）：
//   rating_{matchId}            -> { "p43": { n: 人数, s: 总分 }, ... }
//   rvote_{matchId}_{voterKey}  -> { "p43": 4, ... }        该投票者已投的分数
//
// 运行时为 V8（非 Node）：不可用 fs / require / npm 包，也没有 Response.json()。

const KV_VAR = 'nnutv_kv';
const MAX_STARS = 5;

function kv(context) {
  const env = (context && context.env) || {};
  const cands = [];
  try {
    // 官方约定：绑定命名空间时定义的变量名会作为全局变量注入
    if (typeof nnutv_kv !== 'undefined') cands.push(nnutv_kv);
  } catch (_) {
    /* 未绑定时该标识符不存在，忽略 */
  }
  try {
    if (typeof globalThis !== 'undefined') cands.push(globalThis[KV_VAR]);
  } catch (_) {
    /* ignore */
  }
  cands.push(env[KV_VAR], env.KV, env.kv);
  for (const c of cands) {
    if (c && typeof c.get === 'function' && typeof c.put === 'function') return c;
  }
  return null;
}

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    },
  });

// key 只允许数字/字母/下划线
const safeId = (s, max = 64) => String(s == null ? '' : s).replace(/[^0-9a-zA-Z_]/g, '').slice(0, max);

async function readJSON(store, key, fallback) {
  try {
    const raw = await store.get(key, { type: 'json' });
    if (raw == null) return fallback;
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw);
      } catch (_) {
        return fallback;
      }
    }
    return raw;
  } catch (_) {
    return fallback;
  }
}

export async function onRequestGet(context) {
  const store = kv(context);
  if (!store) return json({ ok: false, reason: 'kv_not_configured' });
  const url = new URL(context.request.url);
  const match = safeId(url.searchParams.get('match'));
  if (!match) return json({ ok: false, reason: 'bad_request' }, 400);

  const agg = await readJSON(store, `rating_${match}`, {});
  const ratings = {};
  for (const pid of Object.keys(agg)) {
    const e = agg[pid] || {};
    const n = Number(e.n) || 0;
    const s = Number(e.s) || 0;
    if (n > 0) ratings[pid] = { count: n, avg: Math.round((s / n) * 100) / 100 };
  }

  let mine = {};
  const voter = safeId(url.searchParams.get('voter'), 48);
  if (voter) mine = await readJSON(store, `rvote_${match}_${voter}`, {});

  return json({ ok: true, ratings, mine });
}

export async function onRequestPost(context) {
  const store = kv(context);
  if (!store) return json({ ok: false, reason: 'kv_not_configured' });

  let body;
  try {
    body = await context.request.json();
  } catch (_) {
    return json({ ok: false, reason: 'bad_json' }, 400);
  }

  const match = safeId(body && body.match);
  const playerId = safeId(body && body.playerId, 16);
  const voter = safeId(body && body.voter, 48);
  const stars = Number(body && body.stars);
  if (!match || !playerId) return json({ ok: false, reason: 'bad_request' }, 400);
  if (!voter) return json({ ok: false, reason: 'no_voter' }, 400);
  if (!(stars >= 1 && stars <= MAX_STARS) || Math.floor(stars) !== stars) {
    return json({ ok: false, reason: 'bad_stars' }, 400);
  }

  const aggKey = `rating_${match}`;
  const voteKey = `rvote_${match}_${voter}`;
  const agg = await readJSON(store, aggKey, {});
  const mine = await readJSON(store, voteKey, {});

  const prev = Number(mine[playerId]) || 0;
  const cur = agg[playerId] || { n: 0, s: 0 };
  cur.n = Number(cur.n) || 0;
  cur.s = Number(cur.s) || 0;

  if (prev === 0) cur.n += 1;
  cur.s = Math.max(0, cur.s - prev + stars);
  agg[playerId] = cur;
  mine[playerId] = stars;

  await store.put(aggKey, JSON.stringify(agg));
  await store.put(voteKey, JSON.stringify(mine));

  const ratings = {};
  for (const pid of Object.keys(agg)) {
    const e = agg[pid] || {};
    const n = Number(e.n) || 0;
    const s = Number(e.s) || 0;
    if (n > 0) ratings[pid] = { count: n, avg: Math.round((s / n) * 100) / 100 };
  }
  return json({ ok: true, ratings, mine });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
