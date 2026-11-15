/* VOLERGON / LIQUID FIELD
   Original real-time SDF shader: interlocking fluid ribbons, pearlescent metal,
   blue chromatic reflections. Zero external 3D assets, dependencies or borrowed shaders.
   The canvas exists to communicate motion, not to describe a fictional Bureau engine. */
const vertex = `#version 300 es
precision highp float;
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;
const fragment = `#version 300 es
precision highp float;
uniform vec2 uResolution;
uniform vec2 uPointer;
uniform float uTime;
uniform float uScroll;
out vec4 fragColor;
#define PI 3.14159265
mat2 rot(float a){float s=sin(a),c=cos(a);return mat2(c,-s,s,c);}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.0-2.0*f);return mix(mix(mix(hash(i.xy+vec2(0.,0.)+i.z*13.13),hash(i.xy+vec2(1.,0.)+i.z*13.13),f.x),mix(hash(i.xy+vec2(0.,1.)+i.z*13.13),hash(i.xy+vec2(1.,1.)+i.z*13.13),f.x),f.y),mix(mix(hash(i.xy+vec2(0.,0.)+(i.z+1.)*13.13),hash(i.xy+vec2(1.,0.)+(i.z+1.)*13.13),f.x),mix(hash(i.xy+vec2(0.,1.)+(i.z+1.)*13.13),hash(i.xy+vec2(1.,1.)+(i.z+1.)*13.13),f.x),f.y),f.z);}
float torus(vec3 p, vec2 t){return length(vec2(length(p.xz)-t.x,p.y))-t.y;}
float smoothMin(float a,float b,float k){float h=max(k-abs(a-b),0.)/k;return min(a,b)-h*h*k*.25;}
vec2 scene(vec3 p){
  float t=uTime*.28;
  float s=smoothstep(.04,.8,uScroll);
  vec3 q=p;
  q.xy*=rot(t*.25+uPointer.x*.23);
  q.yz*=rot(-.32+uPointer.y*.2+s*.55);
  vec3 a=q;
  a.xy*=rot(.55+sin(t*.53)*.18+s*.8);
  a.xz*=rot(.24);
  float angle=atan(a.z,a.x);
  a.y+=.11*sin(angle*5.0-t*1.9)+.035*sin(angle*12.0+t*.7);
  float d1=torus(a,vec2(1.27,.178+.018*sin(angle*7.0+t*2.0)));
  vec3 b=q;
  b.xy*=rot(-1.13-t*.17-s*.48);
  b.yz*=rot(1.01+t*.19);
  float angle2=atan(b.z,b.x);
  b.y+=.105*sin(angle2*4.0+t*1.5);
  float d2=torus(b,vec2(1.12,.142+.014*cos(angle2*9.0-t)));
  vec3 c=q;
  c.yz*=rot(.72+t*.24+s*.4);
  c.xz*=rot(-.6+t*.12);
  c.y+=.055*sin(6.0*atan(c.z,c.x)+t);
  float d3=torus(c,vec2(1.46,.073));
  float d=smoothMin(d1,d2,.095);
  vec2 res=vec2(d, d1<d2 ? 1.0:2.0);
  if(d3<res.x){res=vec2(d3,3.0);}
  return res;
}
vec3 normalAt(vec3 p){vec2 e=vec2(.0025,0.);return normalize(vec3(scene(p+e.xyy).x-scene(p-e.xyy).x,scene(p+e.yxy).x-scene(p-e.yxy).x,scene(p+e.yyx).x-scene(p-e.yyx).x));}
vec3 environment(vec3 rd){
  float v=clamp(rd.y*.55+.5,0.,1.);
  vec3 col=mix(vec3(.013,.018,.07),vec3(.14,.21,.52),pow(v,2.2));
  float stripe=pow(max(dot(rd,normalize(vec3(-.72,.45,.4))),0.),28.);
  float stripe2=pow(max(dot(rd,normalize(vec3(.2,.91,.4))),0.),12.);
  col+=vec3(.66,.77,1.)*stripe*1.8;
  col+=vec3(.24,.39,1.)*stripe2*.35;
  col+=.025*noise(rd*6.+vec3(uTime*.04));
  return col;
}
void main(){
 vec2 uv=(gl_FragCoord.xy-.5*uResolution.xy)/uResolution.y;
 vec2 point=uv;
 float t=uTime*.12;
 vec3 ro=vec3(0.,0.,5.4-max(0.,uScroll)*.7);
 ro.x+=uPointer.x*.5;
 ro.y+=uPointer.y*.4;
 vec3 target=vec3(0.,.08,0.);
 vec3 forward=normalize(target-ro),right=normalize(cross(forward,vec3(0.,1.,0.))),up=cross(right,forward);
 vec3 rd=normalize(forward*1.52+right*uv.x+up*uv.y);
 float dist=0.;vec2 hit=vec2(1e3,0.);vec3 pos=ro;
 for(int i=0;i<56;i++){
   pos=ro+rd*dist;
   hit=scene(pos);
   if(hit.x<.0022||dist>12.)break;
   dist+=max(hit.x*.82,.005);
 }
 float vignette=smoothstep(1.5,.12,length(point));
 vec3 col=vec3(.008,.012,.042)+vec3(.016,.028,.14)*vignette;
 col+=vec3(.018,.028,.12)*(.5+.5*cos(uv.y*3.2+uTime*.15))*vignette;
 col+=vec3(.015,.026,.12)*pow(max(0.,1.0-length(uv-vec2(.25,.05))),2.);
 // Atmospheric vertical blue light, subtly responsive to cursor.
 float shaft=exp(-pow((uv.x-.36-uPointer.x*.11)*3.5,2.))*exp(-pow((uv.y-.12)*1.4,2.));
 col+=vec3(.018,.034,.14)*shaft;
 if(dist<12.&&hit.x<.007){
   vec3 n=normalAt(pos);vec3 refl=reflect(rd,n);
   float fresnel=pow(1.0-max(dot(n,-rd),0.0),3.0);
   vec3 env=environment(refl);
   vec3 lightDir=normalize(vec3(-.8,1.7,2.4));
   float dif=max(dot(n,lightDir),0.0);
   float back=max(dot(n,normalize(vec3(1.0,-.4,-2.0))),0.);
   float spec=pow(max(dot(reflect(-lightDir,n),-rd),0.),46.);
   float micro=noise(pos*18.+vec3(t));
   float flowing=.5+.5*sin(pos.y*16.+pos.x*8.-uTime*.7);
   if(hit.y<1.5){
      // Pearlescent metal, cool highlights; dark ink in the occluded folds.
      col=vec3(.18,.21,.31)+env*1.6+vec3(.42,.52,.75)*dif+.9*spec;
      col+=vec3(.09,.11,.17)*flowing;
      col=mix(col,vec3(.01,.02,.11),.16*(1.0-dif));
   }else if(hit.y<2.5){
      // Ultramarine lacquer with glassy light bands.
      col=vec3(.009,.022,.18)+env*vec3(.85,.95,2.65)+vec3(.045,.1,.92)*dif;
      col+=vec3(.42,.55,1.)*spec*1.9;
   }else{
      col=vec3(.07,.13,.24)+env*1.25+vec3(.55,.7,1.)*dif*.6;
   }
   col+=vec3(.44,.59,1.)*back*.13;
   col+=vec3(.15,.2,.33)*fresnel;
   col*=.985+.03*micro;
 }
 // Almost invisible dust in deep space, no distracting particle storm.
 vec2 grid=floor((uv+vec2(.7)) * vec2(85.,53.));
 float st=step(.9975,hash(grid));
 float spark=st*pow(max(0.,1.0-length(fract((uv+vec2(.7))*vec2(85.,53.))-.5)*2.),5.);
 col+=vec3(.28,.36,.68)*spark*.13;
 col=col/(col+vec3(1.0));
 col=pow(max(col,0.),vec3(.84));
 fragColor=vec4(col,1.);
}`;

function compile(gl, type, source) {
 const shader = gl.createShader(type);
 gl.shaderSource(shader, source);
 gl.compileShader(shader);
 if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
   const log = gl.getShaderInfoLog(shader);
   gl.deleteShader(shader);
   throw new Error('Volergon shader compilation: ' + log);
 }
 return shader;
}

export function createField(canvas, { reducedMotion = false } = {}) {
 if (reducedMotion) return null;
 const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'high-performance', preserveDrawingBuffer: false });
 if (!gl) return null;
 let program;
 try {
   const vs=compile(gl,gl.VERTEX_SHADER,vertex);
   const fs=compile(gl,gl.FRAGMENT_SHADER,fragment);
   program=gl.createProgram();
   gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
   if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
   gl.deleteShader(vs);gl.deleteShader(fs);
 } catch (error) { console.warn(error); return null; }
 const uniforms={
   resolution:gl.getUniformLocation(program,'uResolution'),
   pointer:gl.getUniformLocation(program,'uPointer'),
   time:gl.getUniformLocation(program,'uTime'),
   scroll:gl.getUniformLocation(program,'uScroll'),
 };
 const vertexArray=gl.createVertexArray(); gl.bindVertexArray(vertexArray);
 let raf=0, running=true, visible=true, pointer=[0,0], target=[0,0], progress=0, start=performance.now(), last=0;
 let quality=window.matchMedia('(max-width: 600px)').matches?0.76:0.86;
 const resize=()=>{
   const rect=canvas.getBoundingClientRect();
   const cap=Math.min(1,980/Math.max(1,rect.width));
   const dpr=Math.min(window.devicePixelRatio||1,1.25)*quality*cap;
   const w=Math.max(1,Math.floor(rect.width*dpr)),h=Math.max(1,Math.floor(rect.height*dpr));
   if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
 };
 const render=(now)=>{
   if(!running||!visible)return;
   if(now-last<26){raf=requestAnimationFrame(render);return;} // ~38 fps cap: complex shader stays smooth on laptops.
   last=now;
   resize();
   pointer[0]+=(target[0]-pointer[0])*.055;
   pointer[1]+=(target[1]-pointer[1])*.055;
   gl.useProgram(program);
   gl.uniform2f(uniforms.resolution,canvas.width,canvas.height);
   gl.uniform2f(uniforms.pointer,pointer[0],pointer[1]);
   gl.uniform1f(uniforms.time,(now-start)*.001);
   gl.uniform1f(uniforms.scroll,progress);
   gl.drawArrays(gl.TRIANGLES,0,3);
   raf=requestAnimationFrame(render);
 };
 const move=(event)=>{
   const rect=canvas.getBoundingClientRect();
   target=[(event.clientX-rect.left)/rect.width*2-1,-((event.clientY-rect.top)/rect.height*2-1)];
 };
 const reset=()=>{target=[0,0]};
 const observer=new IntersectionObserver(([entry])=>{
   visible=entry.isIntersecting&&!document.hidden;
   if(visible) {cancelAnimationFrame(raf);raf=requestAnimationFrame(render);}else cancelAnimationFrame(raf);
 },{threshold:0});
 observer.observe(canvas);
 const visibility=()=>{visible=!document.hidden && canvas.getBoundingClientRect().bottom>=0 && canvas.getBoundingClientRect().top<innerHeight;if(visible){cancelAnimationFrame(raf);raf=requestAnimationFrame(render);}else cancelAnimationFrame(raf)};
 document.addEventListener('visibilitychange',visibility);
 canvas.parentElement.addEventListener('pointermove',move,{passive:true});
 canvas.parentElement.addEventListener('pointerleave',reset);
 window.addEventListener('resize',resize,{passive:true});
 canvas.addEventListener('webglcontextlost',(event)=>{event.preventDefault();running=false;cancelAnimationFrame(raf);canvas.parentElement.classList.remove('has-webgl')});
 resize();raf=requestAnimationFrame(render);
 canvas.parentElement.classList.add('has-webgl');
 return {setScroll(value){progress=Math.max(0,Math.min(1,value));},destroy(){running=false;cancelAnimationFrame(raf);observer.disconnect();document.removeEventListener('visibilitychange',visibility);gl.deleteProgram(program);gl.deleteVertexArray(vertexArray)}};
}
