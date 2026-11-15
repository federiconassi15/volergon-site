import { readFile, readdir, stat } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { pages } from '../src/site.mjs';

const root = resolve(new URL('../dist', import.meta.url).pathname);
const errors=[];
const assets = [];
const names = new Set();
async function exists(file) {try {const info=await stat(file);return info.isFile()} catch{return false}}
for (const page of pages) {
  const file=join(root,page.path==='/'?'index.html':page.path.slice(1)+'/index.html');
  if (!await exists(file)) {errors.push('Missing route: '+page.path);continue}
  const html=await readFile(file,'utf8');
  if(!html.includes('<!doctype html>')||!html.includes('<main')||!html.includes('<h1')||!html.includes('lang="en"'))errors.push('Missing basic structure: '+page.path);
  if(!html.includes('name="description"')||!html.includes('property="og:title"'))errors.push('Missing metadata: '+page.path);
  if(!html.includes('class="skip-link"')||!html.includes('aria-controls="site-menu"'))errors.push('Accessibility anchors missing: '+page.path);
  if(names.has(page.path))errors.push('Duplicate route '+page.path);
  names.add(page.path);
  for(const link of html.matchAll(/href="(\/[^"#?]*)"/g)){
    const url=link[1];
    let target=join(root,url.slice(1));
    if(url.endsWith('/'))target=join(target,'index.html');
    if(!await exists(target))errors.push('Broken internal link: '+page.path+' -> '+url);
  }
  for(const src of html.matchAll(/(?:src|href)="(\/assets\/[^"?]*)"/g)){
    if(!await exists(join(root,src[1].slice(1))))errors.push('Missing asset: '+src[1]);
  }
  if(page.path==='/golden-ratio/'&&!html.includes('NOT YET RELEASED'))errors.push('Golden Ratio must be labeled unreleased');
  if(page.path==='/bureau/'&&!html.includes('model-agnostic'))errors.push('Bureau identity missing');
}
for(const name of ['index.html','404.html','sitemap.xml','robots.txt','assets/favicon.svg','assets/social.svg','assets/site.css','assets/motion.js','assets/field.js'])if(!await exists(join(root,name)))errors.push('Missing dist artifact: '+name);
for(const file of ['public/assets/motion.js','public/assets/field.js','src/site.mjs','scripts/build.mjs','scripts/dev.mjs']){
 try{execFileSync(process.execPath,['--check',resolve(root,'..',file)],{stdio:'pipe'})}
 catch(e){errors.push('Syntax check '+file+': '+e.message)}
}
const css=await readFile(join(root,'assets/site.css'),'utf8');
if(!css.includes('prefers-reduced-motion'))errors.push('No reduced-motion CSS');
if(!css.includes(':focus-visible'))errors.push('Focus-visible treatment missing');
const motion=await readFile(join(root,'assets/motion.js'),'utf8');
if(!motion.includes('Escape')||!motion.includes('aria-selected'))errors.push('Interactive controls incomplete');
if(errors.length){console.error('FAILED SITE CHECKS\n'+errors.join('\n'));process.exitCode=1}else console.log('PASS: '+pages.length+' routes, internal links, assets, metadata, JS syntax, accessibility contracts.');
