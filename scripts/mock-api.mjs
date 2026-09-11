// 本地联调服务器：静态托管 out/，并把 functions/api/*.js 按 EdgeOne 的方式跑起来
//
// 为什么能直接复用边缘函数：边缘函数只用 Web 标准 API（Request / Response / URL），
// Node 18+ 已内置这些全局对象，且 KV 在平台上是「全局变量」——这里用 globalThis 模拟绑定，
// 于是本地验证的就是线上要跑的那份代码。
//
// 用法：node scripts/mock-api.mjs [port]     （默认 8899）
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', 'out');
const PORT = Number(process.argv[2] || process.env.PORT || 8899);
const KV_VAR = 'nnutv_kv';

if (!fs.existsSync(ROOT)) {
  console.error(`找不到静态产物：${ROOT}\n请先执行 npm run build`);
  process.exit(1);
}

// ---- 内存版 KV（模拟 EdgeOne KV 的 get/put/delete/list）----
const mem = new Map();
const kv = {
  async get(key, opt) {
    if (!mem.has(key)) return null;
    const v = mem.get(key);
    const t = typeof opt === 'string' ? opt : opt && opt.type;
    if (t === 'json') {
      try {
        return JSON.parse(v);
      } catch (_) {
        return null;
      }
    }
    return v;
  },
  async put(key, value) {
    mem.set(key, String(value));
  },
  async delete(key) {
    mem.delete(key);
  },
  async list({ prefix, limit = 256 } = {}) {
    const keys = [...mem.keys()].filter((k) => !prefix || k.startsWith(prefix)).slice(0, limit);
    return { complete: true, cursor: null, keys: keys.map((k) => ({ key: k })) };
  },
};

// 模拟「绑定命名空间后注入的全局变量」
globalThis[KV_VAR] = kv;

const ratings = await import('file://' + path.join(HERE, '..', 'functions', 'api', 'ratings.js'));
const comments = await import('file://' + path.join(HERE, '..', 'functions', 'api', 'comments.js'));
const MODULES = { '/api/ratings': ratings, '/api/comments': comments };

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

function serveStatic(pathname, req, res) {
  const clean = decodeURIComponent(pathname.split('?')[0]);
  const rel = clean.replace(/^\/+/, '');
  const candidates = [];
  if (!rel) candidates.push('index.html');
  else {
    candidates.push(rel);
    if (!path.extname(rel)) {
      candidates.push(path.join(rel, 'index.html'));
      candidates.push(rel + '.html');
    }
  }
  for (const c of candidates) {
    const file = path.resolve(ROOT, c);
    if (!file.startsWith(ROOT)) continue; // 防目录穿越
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
      const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
      fs.createReadStream(file).pipe(res);
      return;
    }
  }
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('404 Not Found');
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);

  const mod = MODULES[url.pathname];
  if (mod) {
    let body;
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      body = await new Promise((ok) => {
        const chunks = [];
        req.on('data', (c) => chunks.push(c));
        req.on('end', () => ok(Buffer.concat(chunks)));
      });
    }
    const fn = req.method === 'GET' ? mod.onRequestGet : req.method === 'POST' ? mod.onRequestPost : mod.onRequestOptions;
    if (!fn) {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, reason: 'method_not_allowed' }));
      return;
    }
    const headers = {};
    for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers[k] = v;
    if (body && !headers['content-type']) headers['content-type'] = 'application/json';
    const request = new Request(`http://127.0.0.1:${PORT}${req.url}`, { method: req.method, headers, body });
    try {
      const context = { request, env: process.env, params: {}, waitUntil: () => {} };
      const resp = await fn(context);
      const out = {};
      resp.headers.forEach((v, k) => (out[k] = v));
      res.writeHead(resp.status, out);
      res.end(Buffer.from(await resp.arrayBuffer()));
    } catch (e) {
      console.error('[api error]', url.pathname, e);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, reason: 'server_error', message: String(e && e.message) }));
    }
    return;
  }

  serveStatic(url.pathname, req, res);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`本地联调服务已启动：http://127.0.0.1:${PORT}`);
  console.log(`静态目录：${ROOT}`);
  console.log(`模拟接口：/api/ratings、/api/comments（KV 变量名 ${KV_VAR}，数据存在内存里）`);
});
