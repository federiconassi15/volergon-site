import { createField } from './field.js';

const root=document.documentElement;
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
root.classList.add('has-motion');

// Reveal without trapping the page behind a permanent loader when WebGL/network is slow.
const preloader=document.querySelector('.preloader');
const stage=preloader?.querySelector('.preloader-track span');
if(stage) requestAnimationFrame(()=>{stage.style.width='100%'});
const ready=()=>{
  root.classList.add('is-ready');
  preloader?.classList.add('is-done');
};
if(reduced) ready(); else window.setTimeout(ready,650);

const header=document.querySelector('[data-header]');
const progress=document.querySelector('.scroll-progress');
let oldY=window.scrollY;
let ticking=false;
const fieldCanvas=document.querySelector('.field-canvas');
let field=null;
if(fieldCanvas) {try{field=createField(fieldCanvas,{reducedMotion:reduced})}catch(e){console.warn('3D field fallback in use:',e)}}

const updateScroll=()=>{
  ticking=false;
  const y=window.scrollY;
  const max=Math.max(1,document.documentElement.scrollHeight-window.innerHeight);
  if(progress)progress.style.transform='scaleX('+(y/max)+')';
  if(header){
    header.classList.toggle('has-scrolled',y>50);
    if(!root.classList.contains('menu-open'))header.classList.toggle('is-hidden',y>280&&y>oldY+4);
  }
  oldY=y;
  if(fieldCanvas&&field){
    const rect=fieldCanvas.getBoundingClientRect();
    const scrollStage=Math.max(0,Math.min(1,(-rect.top+window.innerHeight*.25)/(rect.height+window.innerHeight*.45)));
    field.setScroll(scrollStage);
  }
  if(!reduced){
    const band=document.querySelector('.statement-band');
    if(band){
      const r=band.getBoundingClientRect();
      const t=Math.max(-1,Math.min(1,(window.innerHeight*.5-r.top)/Math.max(r.height,1)));
      const headline=band.querySelector('.huge-statement');
      if(headline) headline.style.transform='translate3d(0,'+(t*48)+'px,0)';
    }
  }
};
window.addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(updateScroll)}},{passive:true});
window.addEventListener('resize',()=>requestAnimationFrame(updateScroll),{passive:true});
updateScroll();

// Intersection reveals; important content stays in the DOM with no hidden text in no-JS mode.
if(!reduced&&'IntersectionObserver'in window){
  const selectors=['.intro-grid','.statement','.body-xl','.section-topline','.product-header','.feature-tile','.massive-light','.ratio-cell','.control-grid','.journal-tease-grid','.cap-card','.editorial-grid','.numbered-principles article','.journal-entry','.contact-grid','.closing h2','.interior-hero-grid','.related-links a'];
  const targets=[...document.querySelectorAll(selectors.join(','))].filter(el=>!el.closest('.hero'));
  const io=new IntersectionObserver(entries=>{
    for(const entry of entries){if(entry.isIntersecting){entry.target.classList.add('is-visible');io.unobserve(entry.target)}}
  },{threshold:.08,rootMargin:'0px 0px -15px 0px'});
  targets.forEach(el=>{el.dataset.reveal='';io.observe(el)});
}

// Accessible full-screen menu. Close on Escape, click-away and navigation.
const menuTrigger=document.querySelector('.menu-trigger');
const menu=document.querySelector('.menu-overlay');
const menuLinks=menu?[...menu.querySelectorAll('a')]:[];
let prevFocus=null;
const setMenu=(open)=>{
  root.classList.toggle('menu-open',open);
  document.body.classList.toggle('menu-open',open);
  menuTrigger?.setAttribute('aria-expanded',String(open));
  menu?.setAttribute('aria-hidden',String(!open));
  if(menu)menu.inert=!open;
  if(open){prevFocus=document.activeElement;header?.classList.remove('is-hidden');setTimeout(()=>menuLinks[0]?.focus({preventScroll:true}),100)}
  else if(prevFocus instanceof HTMLElement){prevFocus.focus({preventScroll:true});prevFocus=null}
};
if(menu){menu.inert=true}
menuTrigger?.addEventListener('click',()=>setMenu(!root.classList.contains('menu-open')));
document.addEventListener('keydown',(e)=>{
  if(!root.classList.contains('menu-open'))return;
  if(e.key==='Escape'){e.preventDefault();setMenu(false);return}
  if(e.key==='Tab'&&menu){
    const focusable=[menuTrigger,...menuLinks].filter(Boolean);
    const first=focusable[0],last=focusable[focusable.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
  }
});
menuLinks.forEach(link=>link.addEventListener('click',()=>setMenu(false)));

// A quiet custom follower; not rendered on touch or for reduced-motion users.
if(!reduced&&window.matchMedia('(pointer:fine)').matches){
  const follower=document.querySelector('.cursor-follower');
  if(follower){
    let x=-100,y=-100,fx=-100,fy=-100,raf=0;
    const loop=()=>{fx+=(x-fx)*.18;fy+=(y-fy)*.18;follower.style.transform='translate3d('+(fx-14)+'px,'+(fy-14)+'px,0)';raf=requestAnimationFrame(loop)};
    document.addEventListener('pointermove',e=>{x=e.clientX;y=e.clientY;follower.classList.add('is-visible')},{passive:true});
    document.addEventListener('pointerover',e=>{follower.classList.toggle('is-active',!!e.target.closest('a,button'))});
    document.addEventListener('pointerout',e=>{if(!e.relatedTarget)follower.classList.remove('is-visible')});
    raf=requestAnimationFrame(loop);
    window.addEventListener('pagehide',()=>cancelAnimationFrame(raf),{once:true});
  }
}

// Interactive Bureau demonstration, explicitly illustrative, not a live model session.
const demo=document.querySelector('[data-demo]');
if(demo){
  const descriptions=[
    'Gather the right context without pulling in unrelated information.',
    'Break the goal into bounded, checkable steps and identify dependencies.',
    'Pause before sensitive actions; the person using Bureau decides.',
    'Carry out authorized steps using the appropriate tools and models.',
    'Record what happened, what failed, and what remains unfinished.'
  ];
  const tabs=[...demo.querySelectorAll('[data-step]')];
  const message=demo.querySelector('[data-demo-message]');
  const number=demo.querySelector('[data-demo-number]');
  const choose=(i,focus=false)=>{
    const n=(i+tabs.length)%tabs.length;
    tabs.forEach((tab,index)=>{
      const active=index===n;
      tab.classList.toggle('is-active',active);
      tab.setAttribute('aria-selected',String(active));
      tab.tabIndex=active?0:-1;
    });
    if(message)message.textContent=descriptions[n];
    if(number)number.textContent=String(n+1).padStart(2,'0');
    if(focus)tabs[n].focus();
  };
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>choose(index));
    tab.addEventListener('keydown',e=>{
      if(e.key==='ArrowRight'||e.key==='ArrowDown'){e.preventDefault();choose(index+1,true)}
      if(e.key==='ArrowLeft'||e.key==='ArrowUp'){e.preventDefault();choose(index-1,true)}
      if(e.key==='Home'){e.preventDefault();choose(0,true)}
      if(e.key==='End'){e.preventDefault();choose(tabs.length-1,true)}
    });
  });
  demo.querySelector('.demo-next')?.addEventListener('click',()=>choose(tabs.findIndex(tab=>tab.classList.contains('is-active'))+1));
  choose(0);
}

// The Golden Ratio matrix is educational and self-contained.
const quadButtons=[...document.querySelectorAll('[data-quadrant]')];
if(quadButtons.length){
  const copy={
    '1':['01','Do what matters now.','Real deadlines and consequential work deserve your attention. The long-term goal is to reduce how often important tasks arrive here.'],
    '2':['02','Protect your future.','Important work is easiest to neglect when there is no immediate pressure. Protect time for it before circumstances make the decision for you.'],
    '3':['03','Question the interruption.','Not every urgent request deserves to outrank your goals. Consider setting a boundary, deferring or delegating when appropriate.'],
    '4':['04','Make room for meaning.','Low-value activity can fill an entire day. Notice it, simplify it, and intentionally create space for what counts.']
  };
  const choose=(num)=>{
    quadButtons.forEach(b=>{const active=b.dataset.quadrant===num;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active))});
    document.querySelector('[data-quadrant-number]').textContent=copy[num][0];
    document.querySelector('[data-quadrant-title]').textContent=copy[num][1];
    document.querySelector('[data-quadrant-text]').textContent=copy[num][2];
  };
  quadButtons.forEach(b=>b.addEventListener('click',()=>choose(b.dataset.quadrant)));
  choose('2');
}

// Local-site transitions only. Never intercept download links, modified clicks or new tabs.
if(!reduced){
  const wipe=document.querySelector('.page-transition');
  document.addEventListener('click',e=>{
    const link=e.target.closest('a[href]');
    if(!link||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||link.hasAttribute('download')||link.target==='_blank')return;
    const url=new URL(link.href,location.href);
    if(url.origin!==location.origin||url.hash&&url.pathname===location.pathname)return;
    e.preventDefault();
    wipe?.classList.add('is-entering');
    setTimeout(()=>{location.href=url.href},410);
  });
  // Back/forward cache restores should never retain a covering page transition.
  window.addEventListener('pageshow',()=>document.querySelector('.page-transition')?.classList.remove('is-entering'));
}
