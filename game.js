import * as T from './vendor/three.module.js';
import {SOURCE,WHEEL,FUNNEL,RATE,createState,emit,stepState,stepParticle,clamp,moveSource,launch} from './physics.js?v=2';
const $=id=>document.getElementById(id);
let renderer;
try{renderer=new T.WebGLRenderer({canvas:$('scene'),antialias:true,alpha:false,powerPreference:'high-performance'});}catch(e){$('error').hidden=false;throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
const scene=new T.Scene();scene.background=new T.Color('#101b24');scene.fog=new T.Fog('#101b24',23,48);
const camera=new T.PerspectiveCamera(43,1,.1,100);
scene.add(new T.HemisphereLight(0xc7e9ff,0x554732,2));
const key=new T.DirectionalLight(0xffeccf,4);key.position.set(0,12,8);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-12,right:12,top:12,bottom:-12,near:.5,far:35});key.shadow.bias=-.0004;scene.add(key);
const rim=new T.DirectionalLight(0x50d9ff,2);rim.position.set(-8,5,-7);scene.add(rim);
const mat=(color,metalness=.25,roughness=.36)=>new T.MeshStandardMaterial({color,metalness,roughness});
const steel=mat('#75818a',.8,.24),dark=mat('#23313c',.6,.42),black=mat('#111a23',.45,.5),yellow=mat('#ffcc19',.45,.27),red=mat('#e94834',.4,.25),orange=mat('#ff8a24',.38,.25),cyan=mat('#10cce7',.35,.2);
function mesh(geo,material,x=0,y=0,z=0,parent=scene){const m=new T.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function box(w,h,d,material,x,y,z,parent){return mesh(new T.BoxGeometry(w,h,d),material,x,y,z,parent);}
function cyl(r1,r2,h,material,x,y,z,parent,segments=32){return mesh(new T.CylinderGeometry(r1,r2,h,segments),material,x,y,z,parent);}
function rod(a,b,r,material,parent=scene){const av=new T.Vector3(...a),bv=new T.Vector3(...b),m=cyl(r,r,av.distanceTo(bv),material,0,0,0,parent,12);m.position.copy(av).add(bv).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.sub(av).normalize());return m;}
function ring(r,t,material,x,y,z,parent=scene){return mesh(new T.TorusGeometry(r,t,10,48),material,x,y,z,parent);}
function textPlate(text,x,y,z,color='#d9e3e8',width=2){const cv=document.createElement('canvas');cv.width=512;cv.height=100;const c=cv.getContext('2d');c.fillStyle='#121d25';c.fillRect(0,0,512,100);c.fillStyle=color;c.font='bold 34px sans-serif';c.textAlign='center';c.fillText(text,256,63);const tx=new T.CanvasTexture(cv);tx.colorSpace=T.SRGBColorSpace;return mesh(new T.PlaneGeometry(width,width/5.12),new T.MeshBasicMaterial({map:tx}),x,y,z);}
// Bench: layered steel edges, mounting holes, chromed feet and warm safety strips.
box(13,.45,9,dark,0,-.16,1);box(13.15,.11,9.15,steel,0,.07,1);box(12.7,.04,8.7,mat('#394650',.55,.55),0,.145,1);
for(let x=-6;x<=6;x+=.65)for(let z=-3;z<5;z+=.65){const hole=cyl(.035,.035,.01,black,x,.17,z,scene,8);hole.castShadow=false;}
for(const x of [-5.8,5.8])for(const z of [-2.8,4.8]){cyl(.18,.23,2.5,steel,x,-1.4,z);box(.6,.18,.6,black,x,-2.7,z);}
box(13,.12,.15,yellow,0,-.27,5.55);box(13,.12,.15,yellow,0,-.27,-3.55);
box(90,.2,90,mat('#15202a',.15,.8),0,-2.9,0);
const grid=new T.GridHelper(80,40,0x253844,0x1b2a35);grid.position.y=-2.78;scene.add(grid);
// Workshop backdrop, understated so the machinery remains legible.
box(18,8,.3,dark,0,1,-6);for(let x=-8;x<9;x+=1)for(let y=-1;y<5;y+=.75)cyl(.045,.045,.04,black,x,y,-5.82).rotation.x=Math.PI/2;
for(const x of [-7,7]){box(.15,6,.2,steel,x,1,-5.6);box(2.6,.12,1,steel,x,0,-5);box(1.7,1,.7,red,x,-.55,-5);}
textPlate('SPRAYWORKS  /  EXPERIMENT 01',0,3.9,-5.8,'#ffce29',6);
// Gun body points along local +Z; swivel follows the actual launch vector.
const base=new T.Group();base.position.set(SOURCE.x,.2,SOURCE.z-.6);scene.add(base);cyl(.55,.7,.18,black,0,0,0,base);cyl(.4,.4,.16,steel,0,.13,0,base);cyl(.17,.22,1.3,steel,0,.83,0,base);cyl(.32,.32,.28,yellow,0,1.45,0,base);
const gun=new T.Group();gun.position.set(SOURCE.x,SOURCE.y,SOURCE.z);scene.add(gun);
const barrel=cyl(.22,.32,.8,yellow,0,0,-.45,gun);barrel.rotation.x=Math.PI/2;
for(const z of [-.85,-.25,-.05]){const collar=cyl(z===-.05?.14:.27,z===-.05?.14:.27,.13,steel,0,0,z,gun);collar.rotation.x=Math.PI/2;}
const nozzle=cyl(.09,.13,.12,black,0,0,.03,gun);nozzle.rotation.x=Math.PI/2;box(.18,.55,.2,black,0,-.4,-.55,gun);
const hoseCurve=new T.CatmullRomCurve3([new T.Vector3(-4.5,1.8,6),new T.Vector3(-5.3,1.1,5.7),new T.Vector3(-5.8,.4,4),new T.Vector3(-5,.3,2),new T.Vector3(-6,.4,1)]);const hose=mesh(new T.TubeGeometry(hoseCurve,40,.09,10,false),cyan);
// Four true paddles around a bearing axle. The simulation tests these same shapes.
box(2.1,.22,1.25,black,WHEEL.x,.29,0);for(const z of [-.45,.45]){box(.22,2.2,.16,steel,WHEEL.x,1.35,z);ring(.28,.055,steel,WHEEL.x,WHEEL.y,z);}
const wheel=new T.Group();wheel.position.set(WHEEL.x,WHEEL.y,0);scene.add(wheel);
box(.48,2.9,.18,red,0,0,0,wheel);box(2.9,.48,.18,red,0,0,0,wheel);
for(const a of [0,Math.PI/2,Math.PI,Math.PI*1.5]){const tip=box(.48,.12,.2,yellow,Math.sin(a)*1.38,Math.cos(a)*1.38,0,wheel);tip.rotation.z=-a;}
const hub=cyl(.29,.29,.6,steel,0,0,0,wheel);hub.rotation.x=Math.PI/2;ring(.38,.035,yellow,0,0,.14,wheel);
textPlate('01  /  POWER',WHEEL.x,.65,.56,'#ffce29',1.8);
// Lifting gate and visible cable drum.
for(const x of [.5,4.6]){box(.17,5.3,.2,steel,x,2.8,1.3);box(.5,.18,.6,black,x,.28,1.3);}
box(4.3,.22,.3,steel,2.55,5.4,1.3);const gate=box(3.8,3.4,.18,yellow,2.55,1.95,1.3);
for(let i=0;i<7;i++){const stripe=box(.17,.32,.02,black,-1.3+i*.43,-1.47,.1,gate);stripe.rotation.z=-.5;}
const drum=cyl(.2,.2,.4,black,.5,5.25,1.3);drum.rotation.z=Math.PI/2;
rod([-1.6,2.45,-.5],[.5,5.2,1.2],.018,black);
// Hollow orange funnel: a lathed shell with a real open mouth.
const points=[new T.Vector2(.22,0),new T.Vector2(.24,.15),new T.Vector2(1.15,.93),new T.Vector2(1.18,.98),new T.Vector2(1.12,1),new T.Vector2(.18,.17),new T.Vector2(.18,0)];
const funnel=mesh(new T.LatheGeometry(points,48),orange,3,.7,0);funnel.material.side=T.DoubleSide;
const lip=ring(1.16,.035,steel,3,1.68,0);lip.rotation.x=Math.PI/2;
for(const x of [2.1,3.9])rod([x,.25,0],[x,1.48,0],.055,steel);
const pipe=new T.CatmullRomCurve3([new T.Vector3(3,.72,0),new T.Vector3(3,.5,0),new T.Vector3(4,.45,0),new T.Vector3(5,.7,0),new T.Vector3(5,1.7,0)]);mesh(new T.TubeGeometry(pipe,40,.12,12,false),steel);
// Receiver is an open, lightly tinted cylinder. Fill height tracks collected volume.
const glass=new T.MeshPhysicalMaterial({color:0xa0e4ed,transparent:true,opacity:.2,roughness:.1,metalness:.1,side:T.DoubleSide,depthWrite:false});
mesh(new T.CylinderGeometry(.74,.74,2,36,1,true),glass,5,1.25,0);cyl(.78,.78,.12,steel,5,.24,0);
for(const y of [.3,2.25]){const r=ring(.75,.045,steel,5,y,0);r.rotation.x=Math.PI/2;}
const liquid=cyl(.69,.69,1,cyan,5,.31,0);liquid.scale.y=.01;
for(let i=1;i<=4;i++){textPlate(String(i*25),5.15,.3+i*.45,.75,'#c8f6ff',.38);rod([4.58,.3+i*.45,.64],[4.8,.3+i*.45,.72],.013,steel);}
textPlate('02  /  COLLECT',3,.4,1.2,'#ffce29',1.9);
// A tight reticle marks the selected point; particles still follow a ballistic trajectory.
const reticle=new T.Group();scene.add(reticle);const halo=ring(.13,.015,cyan,0,0,0,reticle);for(const a of [0,Math.PI/2]){const m=box(.4,.012,.012,cyan,0,0,0,reticle);m.rotation.z=a;}
const target=new T.Vector3(-1.6,3.48,0);reticle.position.copy(target);
const maxParticles=5200,positions=new Float32Array(maxParticles*3),colors=new Float32Array(maxParticles*3);const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage));geometry.setAttribute('color',new T.BufferAttribute(colors,3).setUsage(T.DynamicDrawUsage));
const particleMat=new T.ShaderMaterial({transparent:true,depthWrite:false,vertexColors:true,uniforms:{scale:{value:1}},vertexShader:'varying vec3 vColor; uniform float scale; void main(){vColor=color; vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(55.*scale/-mv.z,2.,9.);}',fragmentShader:'varying vec3 vColor; void main(){vec2 p=gl_PointCoord-.5;float r=length(p);if(r>.5)discard;float shine=pow(max(0.,1.-length(p-vec2(-.15,.15))*3.),3.);gl_FragColor=vec4(vColor+shine*.6,(1.-smoothstep(.3,.5,r))*.88);}'});
const cloud=new T.Points(geometry,particleMat);cloud.frustumCulled=false;scene.add(cloud);
const splats=new T.Group();scene.add(splats);const splatGeo=new T.CircleGeometry(1,10),splatMat=new T.MeshBasicMaterial({color:0x10b5cc,transparent:true,opacity:.35,depthWrite:false});let splatIndex=0;
for(let i=0;i<160;i++){const m=new T.Mesh(splatGeo,splatMat);m.rotation.x=-Math.PI/2;m.visible=false;splats.add(m);}
let state=createState(),particles=[],pattern='jet',pressure=.65,held=false,started=false,paused=false,emission=0,accumulator=0,last=performance.now(),view=0,winAnnounced=false,sound=false,ctx,gain,filter;
function audioInit(){if(ctx){ctx.resume();return;}try{ctx=new AudioContext();const buffer=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;const src=ctx.createBufferSource();src.buffer=buffer;src.loop=true;filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=1800;gain=ctx.createGain();gain.gain.value=0;src.connect(filter).connect(gain).connect(ctx.destination);src.start();}catch(e){sound=false;}}
function chime(){if(!sound||!ctx)return;for(let i=0;i<3;i++){const o=ctx.createOscillator(),g=ctx.createGain(),time=ctx.currentTime+i*.14;o.frequency.value=[523,659,784][i];g.gain.setValueAtTime(.0001,time);g.gain.exponentialRampToValueAtTime(.1,time+.01);g.gain.exponentialRampToValueAtTime(.0001,time+.4);o.connect(g).connect(ctx.destination);o.start(time);o.stop(time+.45);}}
function setHeld(v){held=v&&started&&!paused&&!state.lost&&(!state.won||state.sandbox);$('spray').classList.toggle('firing',held);if(held&&sound)audioInit();}
function fit(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;const portrait=w/h<.85;camera.fov=portrait?53:43;camera.position.set(view===0?9:0,portrait?12:9,portrait?23:17);camera.lookAt(portrait?0:0.25,portrait?1.25:1.3,1.2);camera.updateProjectionMatrix();particleMat.uniforms.scale.value=renderer.getPixelRatio();}
addEventListener('resize',fit);fit();
const ray=new T.Raycaster(),aimPlane=new T.Plane(new T.Vector3(0,0,1),0),movePlane=new T.Plane(new T.Vector3(0,1,0),-2.1),pointer=new T.Vector2();
let controlMode='move',fine=false,drag=null,sprayPointer=null,locked=false,spaceHeld=false;
const keys=new Set();
function syncGun(){
 const source=state.source;
 gun.position.set(source.x,source.y,source.z);
 base.position.set(source.x,.2,source.z-.6);
 base.scale.y=(source.y-.45)/1.65;
 $('gunX').value=source.x;$('gunY').value=source.y;$('gunZ').value=source.z;
 const curve=new T.CatmullRomCurve3([new T.Vector3(source.x,source.y-.2,source.z),new T.Vector3(source.x-.5,.6,source.z-.4),new T.Vector3(-5,.3,2),new T.Vector3(-6,.4,1)]);
 hose.geometry.dispose();hose.geometry=new T.TubeGeometry(curve,24,.09,8,false);
}
function positionGun(position){moveSource(state,position);syncGun();}
function setMode(mode){controlMode=mode;drag=null;keys.clear();$('moveMode').setAttribute('aria-pressed',String(mode==='move'));$('aimMode').setAttribute('aria-pressed',String(mode==='aim'));$('controlHint').textContent=mode==='move'?'Drag the scene to move the gun along the bench.':'Drag to steer. Lift your finger without losing your aim.';}
$('moveMode').onclick=()=>setMode('move');$('aimMode').onclick=()=>setMode('aim');
$('fine').onclick=()=>{fine=!fine;$('fine').setAttribute('aria-pressed',String(fine));};
for(const [id,axis] of [['gunX','x'],['gunY','y'],['gunZ','z']])$(id).oninput=e=>positionGun({...state.source,[axis]:Number(e.target.value)});
$('gunHome').onclick=()=>positionGun({...SOURCE});
function onPlane(e,plane){const rect=$('scene').getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);return ray.ray.intersectPlane(plane,new T.Vector3());}
$('scene').addEventListener('pointerdown',e=>{
 if(!started||paused||drag)return;
 e.preventDefault();movePlane.constant=-state.source.y;
 const plane=controlMode==='move'?movePlane:aimPlane,point=onPlane(e,plane);
 if(point){drag={id:e.pointerId,point,plane};$('scene').setPointerCapture(e.pointerId);}
});
$('scene').addEventListener('pointermove',e=>{
 if(!drag||drag.id!==e.pointerId)return;
 const point=onPlane(e,drag.plane);if(!point)return;
 const delta=point.clone().sub(drag.point).multiplyScalar(fine||e.shiftKey?.22:1);drag.point.copy(point);
 if(controlMode==='move')positionGun({x:state.source.x+delta.x,y:state.source.y,z:state.source.z+delta.z});
 else target.set(clamp(target.x+delta.x,-5.8,5.8),clamp(target.y+delta.y,.3,5.5),0);
});
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('scene').addEventListener(event,e=>{if(drag?.id===e.pointerId)drag=null;});
function trigger(){setHeld(locked||spaceHeld||sprayPointer!==null);}
function stopControls(){locked=false;spaceHeld=false;sprayPointer=null;drag=null;keys.clear();$('sprayLock').setAttribute('aria-pressed','false');setHeld(false);}
$('sprayLock').onclick=()=>{if(!started||paused)return;locked=!locked;$('sprayLock').setAttribute('aria-pressed',String(locked));trigger();};
$('spray').addEventListener('pointerdown',e=>{e.preventDefault();sprayPointer=e.pointerId;$('spray').setPointerCapture(e.pointerId);trigger();});
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('spray').addEventListener(event,e=>{if(sprayPointer===e.pointerId){sprayPointer=null;trigger();}});
function keyboardControl(dt){
 if(!keys.size)return;const speed=dt*(fine||keys.has('Shift')?.55:2.5),dx=(keys.has('ArrowRight')?1:0)-(keys.has('ArrowLeft')?1:0),dy=(keys.has('ArrowUp')?1:0)-(keys.has('ArrowDown')?1:0);
 if(controlMode==='move')positionGun({x:state.source.x+dx*speed,y:state.source.y,z:state.source.z-dy*speed});
 else target.set(clamp(target.x+dx*speed,-5.8,5.8),clamp(target.y+dy*speed,.3,5.5),0);
}
const guidePositions=new Float32Array(33*3),guideGeometry=new T.BufferGeometry();guideGeometry.setAttribute('position',new T.BufferAttribute(guidePositions,3));
const guide=new T.Line(guideGeometry,new T.LineBasicMaterial({color:0x72eaff,transparent:true,opacity:.45,depthTest:true}));guide.frustumCulled=false;scene.add(guide);
function updateGuide(sample){const source=state.source,time=(target.z-source.z)/sample.vz;for(let i=0;i<33;i++){const t=time*i/32,j=i*3;guidePositions[j]=source.x+sample.vx*t;guidePositions[j+1]=source.y+sample.vy*t-1.8*t*t;guidePositions[j+2]=source.z+sample.vz*t;}guideGeometry.attributes.position.needsUpdate=true;}
function choose(p){pattern=p;document.querySelectorAll('[data-nozzle]').forEach(b=>{const active=b.dataset.nozzle===p;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active));});}
document.querySelectorAll('[data-nozzle]').forEach(b=>b.onclick=()=>choose(b.dataset.nozzle));$('pressure').oninput=e=>{pressure=Number(e.target.value)/100;$('pressureText').textContent=Math.round(pressure*100)+'%';};
$('aimWheel').onclick=()=>{target.set(-1.6,3.48,0);setMode('aim');};$('aimFunnel').onclick=()=>{target.set(3,1.66,0);setMode('aim');};
function reset(sandbox=state.sandbox){state=createState(sandbox);stopControls();syncGun();particles=[];emission=0;winAnnounced=false;setHeld(false);splats.children.forEach(m=>m.visible=false);target.set(-1.6,3.48,0);$('sandbox').setAttribute('aria-pressed',String(sandbox));$('sandbox').textContent=sandbox?'Challenge':'Free play';$('modeLabel').textContent=sandbox?'SANDBOX / UNLIMITED FLUID':'CHALLENGE / PADDLE POWER';$('result').textContent='';}
$('reset').onclick=()=>reset();$('sandbox').onclick=()=>reset(!state.sandbox);
$('start').onclick=()=>{started=true;paused=false;$('intro').classList.add('hidden');$('pause').textContent='Pause';last=performance.now();};
$('help').onclick=()=>{stopControls();paused=true;$('intro').classList.remove('hidden');$('start').textContent='BACK TO WORKSHOP →';};
$('pause').onclick=()=>{paused=!paused;stopControls();$('pause').textContent=paused?'Resume':'Pause';};$('camera').onclick=()=>{view=1-view;fit();};$('sound').onclick=()=>{sound=!sound;if(sound)audioInit();$('sound').textContent=sound?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',String(sound));};
addEventListener('keydown',e=>{if(e.target instanceof HTMLInputElement||e.target instanceof HTMLTextArea)return;if(e.code==='Space'){e.preventDefault();spaceHeld=true;trigger();}if(e.key.startsWith('Arrow')||e.key==='Shift'){e.preventDefault();keys.add(e.key);}if(['1','2','3'].includes(e.key))choose(['jet','fan','cone'][+e.key-1]);if(e.key==='m')setMode('move');if(e.key==='a')setMode('aim');if(e.key==='r')reset();if(e.key==='Escape')$('pause').click();});
addEventListener('keyup',e=>{keys.delete(e.key);if(e.code==='Space'){e.preventDefault();spaceHeld=false;trigger();}});
addEventListener('blur',stopControls);document.addEventListener('visibilitychange',()=>{stopControls();last=performance.now();accumulator=0;});
$('scene').addEventListener('webglcontextlost',e=>{e.preventDefault();paused=true;stopControls();$('error').textContent='Graphics paused by your device. Reload this page to restart the workshop.';$('error').hidden=false;});
function splash(p,type){if(type==='floor'){const m=splats.children[splatIndex++%splats.children.length];m.visible=true;m.position.set(p.x,.181,p.z);m.scale.setScalar(.06+Math.random()*.1);}p.splash=true;p.life=.22+Math.random()*.3;p.vx=(Math.random()-.5)*2;p.vy=.8+Math.random()*1.8;p.vz=.5+Math.random()*1.6;}
function simulate(dt){const endTime=state.time;stepState(state,dt);if((state.won||state.lost)&&!state.sandbox)state.time=endTime;if(held){emission+=RATE*dt;while(emission>=1){const p=emit(state,target,pressure,pattern);if(p&&particles.length<maxParticles)particles.push(p);emission--;}}for(let i=particles.length-1;i>=0;i--){const p=particles[i],hit=stepParticle(p,state,dt);if(hit==='collect'||hit==='dead'){particles[i]=particles[particles.length-1];particles.pop();}else if(hit)splash(p,hit);}if(!state.sandbox&&state.supply<.016&&!particles.some(p=>!p.splash)&&!state.won){state.lost=true;stopControls();}if(state.won&&!state.sandbox&&!winAnnounced){winAnnounced=true;stopControls();chime();try{const score=Math.round(state.supply),best=Number(localStorage.getItem('sprayworks-best')||0);localStorage.setItem('sprayworks-best',String(Math.max(score,best)));}catch(e){}}}
function hud(){const progress=state.open?state.collected/25*100:state.charge*100;$('supply').value=state.supply;$('supplyText').textContent=state.sandbox?'∞':Math.ceil(state.supply)+'%';$('progress').value=progress;$('progressText').textContent=Math.floor(progress)+'%';$('progressLabel').firstChild.textContent=state.open?'RECEIVER ':'GATE ';$('objective').textContent=state.sandbox?'Your workshop. Your rules.':state.won?'Challenge complete!':state.lost?'Supply empty — try again':state.open?'02 — Fill the receiver':'01 — Power the wheel';$('hint').textContent=state.sandbox?'Unlimited spray. Explore nozzles and pressure.':state.open?'Aim into the orange funnel. Reach 75%.':'Aim near the red paddle tips. Hold SPRAY.';$('result').textContent=state.won&&!state.sandbox?`${Math.round(state.supply)}% fluid saved · ${Math.round(state.time)}s · Restart to improve`:state.lost?'Try JET and the Aim buttons to reduce waste.':paused?'Paused':'';}
let frame=0;
function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.05);last=now;if(started&&!paused&&!document.hidden){keyboardControl(dt);accumulator+=dt;while(accumulator>=1/120){simulate(1/120);accumulator-=1/120;}}wheel.rotation.z=state.angle;gate.position.y=T.MathUtils.damp(gate.position.y,state.open?5.55:1.95,4,dt);const level=Math.max(.015,state.collected/25*1.85);liquid.scale.y=level;liquid.position.y=.31+level/2;reticle.position.copy(target);reticle.rotation.z=now*.00025;halo.material.color.set(state.open?0x39dceb:0xffd22a);
const sample=emitPreview();updateGuide(sample);gun.lookAt(gun.position.clone().add(new T.Vector3(sample.vx,sample.vy,sample.vz)));for(let i=0;i<particles.length;i++){const p=particles[i],j=i*3;positions[j]=p.x;positions[j+1]=p.y;positions[j+2]=p.z;colors[j]=p.splash?.25:.08;colors[j+1]=p.splash?.85:.7;colors[j+2]=1;}geometry.setDrawRange(0,particles.length);geometry.attributes.position.needsUpdate=true;geometry.attributes.color.needsUpdate=true;if(gain){gain.gain.setTargetAtTime(sound&&held&&!paused?.04+pressure*.045:0,ctx.currentTime,.04);filter.frequency.value=800+pressure*2400;}if(frame++%8===0)hud();renderer.render(scene,camera);}
function emitPreview(){return launch(target,pressure,'jet',()=>.5,state.source);}
syncGun();
requestAnimationFrame(animate);
