import { createServer } from 'node:http';
import { stat, readFile } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { spawn } from 'node:child_process';

const root = resolve(new URL('../dist', import.meta.url).pathname);
const port = Number(process.env.PORT || 4173);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.ico': 'image/x-icon', '.txt': 'text/plain', '.xml': 'application/xml', '.json': 'application/json' };
const build = spawn(process.execPath, ['scripts/build.mjs'], { cwd: resolve(root, '..'), stdio: 'inherit' });
await new Promise((ok, fail) => { build.on('exit', code => code === 0 ? ok() : fail(new Error('Build failed: ' + code))); });
createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname);
    let full = resolve(join(root, '.' + path));
    if (full !== root && !full.startsWith(root + sep)) throw new Error('Unsafe path');
    let info = await stat(full).catch(() => null);
    if (info?.isDirectory()) { full = join(full, 'index.html'); info = await stat(full).catch(() => null); }
    if (!info?.isFile()) { full = join(root, '404.html'); res.statusCode = 404; }
    res.setHeader('Content-Type', mime[extname(full)] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store');
    res.end(await readFile(full));
  } catch { res.statusCode = 500; res.end('Server error'); }
}).listen(port, '127.0.0.1', () => console.log('Volergon at http://127.0.0.1:' + port));
