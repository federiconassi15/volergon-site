/* Optional high-confidence browser smoke test. In CI, install playwright explicitly.
   It tests REAL Chromium navigation, interaction, layouts, and screenshots. */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { pages } from '../src/site.mjs';

const base = process.env.SITE_URL || 'http://127.0.0.1:4173';
const shot = new URL('../visual-evidence/',import.meta.url).pathname;
await mkdir(shot,{recursive:true});
const browser = await chromium.launch({headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
let failures = [];
const assert = (yes,detail)=>{if(!yes)failures.push(detail)};

for(const viewport of [{width:1440,height:900,label:'desktop'},{width:390,height:844,label:'mobile'}]) {
  const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},deviceScaleFactor:1,reducedMotion:'reduce'});
  for(const item of pages){
    const page=await context.newPage();
    const exceptions=[];
    page.on('pageerror',err=>exceptions.push(err.message));
    const url=base+item.path;
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:35000});
    await page.waitForTimeout(item.path==='/'?1250:180);
    assert(await page.locator('h1').count()===1,viewport.label+' '+item.path+' expected one h1');
    assert((await page.title()).includes('Volergon')||(await page.title()).includes('VOLERGON'),viewport.label+' '+item.path+' expected title');
    const widths=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));
    assert(widths.document<=widths.viewport+2,viewport.label+' '+item.path+' horizontal overflow '+JSON.stringify(widths));
    assert(exceptions.length===0,viewport.label+' '+item.path+' page errors '+exceptions.join('; '));
    await page.screenshot({path:shot+viewport.label+'-'+(item.path==='/'?'home':item.path.replaceAll('/',''))+'.png',animations:'disabled',timeout:35000});
    if(item.path==='/'){
      // Static reduced-motion layouts are tested here; WebGL gets a separate low-resolution probe below.
      await page.locator('.menu-trigger').click();
      assert(await page.locator('.menu-trigger').getAttribute('aria-expanded')==='true',viewport.label+' menu failed to open');
      await page.keyboard.press('Escape');
      assert(await page.locator('.menu-trigger').getAttribute('aria-expanded')==='false',viewport.label+' Escape failed to close menu');
      const next=page.locator('.demo-next');
      await next.click();
      assert((await page.locator('[data-demo-number]').innerText())==='02',viewport.label+' demo step failed');
    }
    if(item.path==='/golden-ratio/'){
      await page.locator('[data-quadrant="1"]').click();
      assert((await page.locator('[data-quadrant-number]').innerText())==='01',viewport.label+' Golden Ratio interaction failed');
    }
    console.log('BROWSER CHECK',viewport.label,item.path,exceptions.length?'ERROR':'ok');
    await page.close();
  }
  await context.close();
}
const webglContext=await browser.newContext({viewport:{width:780,height:600},deviceScaleFactor:1});
const webglPage=await webglContext.newPage();
const shaderWarnings=[];
webglPage.on('console',msg=>{if(msg.type()==='warning')shaderWarnings.push(msg.text())});
await webglPage.goto(base+'/',{waitUntil:'domcontentloaded'});
await webglPage.waitForTimeout(1800);
console.log('WebGL probe: enhancement',await webglPage.locator('.showcase.has-webgl').count()===1,'warnings',shaderWarnings.length);
await webglPage.locator('.showcase').screenshot({path:shot+'webgl-probe.png',animations:'disabled',timeout:45000});
await webglContext.close();
const reduced=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce'});
const reducedPage=await reduced.newPage();
await reducedPage.goto(base+'/',{waitUntil:'domcontentloaded'});
await reducedPage.screenshot({path:shot+'reduced-motion.png',animations:'disabled'});
assert((await reducedPage.locator('.showcase-fallback').count())===1,'Reduced motion missing 3D fallback');
await reduced.close();
await browser.close();
if(failures.length){console.error('BROWSER QA FAILED:\n'+failures.join('\n'));process.exit(1)}
console.log('PASS: 10 routes × 2 viewports, menu, workflow demo, Golden Ratio, reduced motion.');
