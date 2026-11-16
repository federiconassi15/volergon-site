import { rm, mkdir, copyFile, readdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { pages, renderPage, routeList } from '../src/site.mjs';

const root = new URL('../', import.meta.url).pathname;
const out = join(root, 'dist');
const publicDir = join(root, 'public');
const siteUrl = (process.env.PUBLIC_SITE_URL || '').replace(/\/$/, '');

async function copyTree(from, to) {
  await mkdir(to, { recursive: true });
  for (const entry of await readdir(from, { withFileTypes: true })) {
    const target = join(to, entry.name);
    if (entry.isDirectory()) await copyTree(join(from, entry.name), target);
    else if (entry.isFile()) await copyFile(join(from, entry.name), target);
  }
}

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await copyTree(publicDir, out);
for (const page of pages) {
  const file = page.path === '/' ? join(out, 'index.html') : join(out, page.path.slice(1), 'index.html');
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, renderPage(page, siteUrl), 'utf8');
  console.log('built', page.path);
}
await writeFile(join(out, '404.html'), renderPage({
  path: '/404/', title: 'The page moved.', description: 'That page is not here. Go back to Volergon.',
  type: 'not-found', body: `<section class="simple-hero"><p class="eyebrow">404 / NOT FOUND</p><h1>Lost in<br><em>motion.</em></h1><p class="lead">That page doesn't exist, or it has moved. The work continues elsewhere.</p><a class="pill pill-dark" href="/">Back to Volergon <span aria-hidden="true">↗</span></a></section>`
}, siteUrl), 'utf8');
await writeFile(join(out, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: ' + (siteUrl ? siteUrl + '/sitemap.xml' : '/sitemap.xml') + '\n');
await writeFile(join(out, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + routeList.map(route => '<url><loc>' + (siteUrl || '') + route + '</loc></url>').join('\n') + '\n</urlset>');
console.log('Built', pages.length, 'routes to dist/');
