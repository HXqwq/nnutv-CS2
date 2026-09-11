// EdgeOne Pages 边缘函数 · 赛后评论
// 路由：/api/comments
//   GET  ?match=m17                       -> 读取评论列表
//   POST { action:'add', match, nick, text }
//   POST { action:'del', match, id, key }  -> 管理员删除（key 需等于环境变量 ADMIN_KEY）
//
// KV 变量名同 ratings.js（默认 nnutv_kv）。
// 存储：cmt_{matchId} -> [{ id, nick, text, ts }, ...]   新的在前
// 限流：rlc_{whoKey}  -> { w: 窗口起点(秒), c: 次数 }

const KV_VAR = 'nnutv_kv';
const MAX_ITEMS = 300; // 单场最多保留的评论数（超出丢弃最旧）
const MAX_NICK = 16; // 字符数
const MAX_TEXT = 300;
const RATE_WINDOW = 60; // 秒
const RATE_MAX = 5; // 每窗口最多发帖数

function kv(context) {
  const env = (context && context.env) || {};
  const cands = [];
  try {
    if (typeof nnutv_kv !== 'undefined') cands.push(nnutv_kv);
  } catch (_) {
    /* 未绑定 */
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

const safeId = (s, max = 64) => String(s == null ? '' : s).replace(/[^0-9a-zA-Z_]/g, '').slice(0, max);

// 去掉控制字符，压掉多余空行，限制长度
function clean(str, max) {
  return String(str == null ? '' : str)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max);
}

// 稳定的短哈希（FNV-1a），仅用于限流计数的键，不保存明文 IP
function hash32(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(36);
}

function clientKey(context) {
  const h = context.request.headers;
  const ip =
    (h && (h.get('x-forwarded-for') || h.get('x-real-ip') || h.get('cf-connecting-ip'))) || '';
  const first = String(ip).split(',')[0].trim();
  if (first) return hash32(first);
  try {
    const v = context.request.eo && context.request.eo.geo;
    if (v && v.countryName) return hash32(JSON.stringify(v));
  } catch (_) {
    /* ignore */
  }
  return 'anon';
}

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

function listOf(arr) {
  return Array.isArray(arr) ? arr.filter((c) => c && typeof c === 'object' && c.id) : [];
}

export async function onRequestGet(context) {
  const store = kv(context);
  if (!store) return json({ ok: false, reason: 'kv_not_configured' });
  const url = new URL(context.request.url);
  const match = safeId(url.searchParams.get('match'));
  if (!match) return json({ ok: false, reason: 'bad_request' }, 400);
  const comments = listOf(await readJSON(store, `cmt_${match}`, []));
  return json({ ok: true, comments });
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
  if (!match) return json({ ok: false, reason: 'bad_request' }, 400);
  const key = `cmt_${match}`;

  // 管理员删除
  if (body && body.action === 'del') {
    const adminKey = ((context.env && context.env.ADMIN_KEY) || '').trim();
    if (!adminKey) return json({ ok: false, reason: 'admin_disabled' }, 403);
    if (String(body.key || '') !== adminKey) return json({ ok: false, reason: 'unauthorized' }, 403);
    const id = String(body.id || '');
    const list = listOf(await readJSON(store, key, []));
    const next = list.filter((c) => c.id !== id);
    await store.put(key, JSON.stringify(next));
    return json({ ok: true, comments: next, removed: list.length - next.length });
  }

  // 发表评论
  const nick = clean(body && body.nick, MAX_NICK) || '匿名';
  const text = clean(body && body.text, MAX_TEXT);
  if (!text) return json({ ok: false, reason: 'empty' }, 400);

  // 频率限制
  const rkey = `rlc_${clientKey(context)}`;
  const now = Math.floor(Date.now() / 1000);
  const rl = await readJSON(store, rkey, { w: 0, c: 0 });
  const win = Number(rl.w) || 0;
  let cnt = Number(rl.c) || 0;
  if (now - win >= RATE_WINDOW) {
    cnt = 0;
  }
  if (cnt >= RATE_MAX) return json({ ok: false, reason: 'rate_limited' }, 429);
  await store.put(rkey, JSON.stringify({ w: cnt === 0 ? now : win, c: cnt + 1 }));

  const list = listOf(await readJSON(store, key, []));
  const item = {
    id: now.toString(36) + Math.random().toString(36).slice(2, 6),
    nick,
    text,
    ts: Date.now(),
  };
  const next = [item, ...list].slice(0, MAX_ITEMS);
  await store.put(key, JSON.stringify(next));
  return json({ ok: true, comment: item, comments: next });
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
