import * as B from "@babylonjs/core";
import { createMission,ROLES,TASKS,taskById,workerById,selectWorker,orderMove,assignTask,tickMission,isReady,getSummary,clamp } from "./crew-logic.js";

const $=id=>document.getElementById(id);
const canvas=$("renderCanvas");
let engine;
try{engine=new B.Engine(canvas,true,{stencil:true,preserveDrawingBuffer:false,antialias:true,powerPreference:"high-performance"});}
catch(error){$("error").textContent="Your browser could not start the 3D workshop. Enable WebGL or try an up-to-date browser."; $("error").classList.remove("hidden"); throw error;}
engine.setHardwareScalingLevel(Math.max(1,(window.devicePixelRatio||1)/1.5));
const scene=new B.Scene(engine);
scene.clearColor=new B.Color4(.045,.105,.15,1);
scene.fogMode=B.Scene.FOGMODE_EXP2;
scene.fogDensity=.012;
scene.fogColor=B.Color3.FromHexString("#122d3b");
const camera=new B.ArcRotateCamera("isometric",-.95,1.06,26,new B.Vector3(0,.6,0),scene);
camera.lowerRadiusLimit=14;camera.upperRadiusLimit=35;camera.lowerBetaLimit=.43;camera.upperBetaLimit=1.45;camera.panningSensibility=0;camera.wheelPrecision=43;
camera.attachControl(canvas,true);
if(camera.inputs.attached.pointers)camera.inputs.attached.pointers.buttons=[2];
const ambient=new B.HemisphericLight("ambient",new B.Vector3(0,1,0),scene);
ambient.intensity=.83;ambient.groundColor=B.Color3.FromHexString("#234357");
const sunlight=new B.DirectionalLight("overhead",new B.Vector3(-.55,-1,-.4),scene);
sunlight.position.set(3,16,8);sunlight.intensity=2.35;
const rimlight=new B.PointLight("blue worklight",new B.Vector3(-8,8,-6),scene);
rimlight.diffuse=B.Color3.FromHexString("#57cfff");rimlight.intensity=190;rimlight.range=22;
const shadow=new B.ShadowGenerator(1024,sunlight);
shadow.usePercentageCloserFiltering=true;
shadow.filteringQuality=B.ShadowGenerator.QUALITY_LOW;
const hex=c=>B.Color3.FromHexString(c);
function material(name,color,metal=.15,rough=.45,glow=0){
  const m=new B.PBRMaterial(name,scene);
  m.albedoColor=hex(color);m.metallic=metal;m.roughness=rough;
  if(glow)m.emissiveColor=hex(color).scale(glow);
  return m;
}
const mats={
  floor:material("non-slip floor","#375367",.55,.62),
  tile:material("tile line","#273e50",.2,.7),
  background:material("industrial dark","#152b39",.5,.7),
  steel:material("brushed steel","#8ca4af",.75,.33),
  chrome:material("chrome","#d4eef3",.83,.2),
  dark:material("machine frame","#263c4a",.6,.35),
  ink:material("black rubber","#11222c",.1,.7),
  plate:material("panel blue","#38617a",.48,.35),
  orange:material("safety orange","#ff8944",.35,.28,.08),
  yellow:material("caution","#ffd451",.2,.35,.08),
  teal:material("clean cyan","#45e6ed",.12,.32,.3),
  green:material("complete green","#4af0a7",.2,.35,.18),
  red:material("warning red","#ff6b65",.23,.4,.12),
  goo:material("oily sludge","#192f28",.18,.14),
  ooze:material("sludge highlights","#507747",.18,.21),
  glass:material("tank glass","#9ed6ef",.1,.18),
  light:material("light panel","#a8f6ff",.0,.8,1)
};
mats.glass.alpha=.32;mats.glass.transparencyMode=B.Material.MATERIAL_ALPHABLEND;
const colorMaterials=new Map();
function teamMat(color){if(!colorMaterials.has(color))colorMaterials.set(color,material("team "+color,color,.2,.36,.07));return colorMaterials.get(color);}
function stamp(mesh,kind,id){mesh.metadata={kind,id};return mesh;}
function addShadow(mesh){shadow.addShadowCaster(mesh);mesh.receiveShadows=true;return mesh;}
function cube(name,x,y,z,w,h,d,mat,parent=null,cast=false){
  const mesh=B.MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene);
  mesh.position.set(x,y,z);mesh.material=mat;
  if(parent)mesh.parent=parent;
  if(cast)addShadow(mesh);
  return mesh;
}
function cylinder(name,x,y,z,r,h,mat,segments=20,parent=null,cast=false){
  const mesh=B.MeshBuilder.CreateCylinder(name,{diameter:r*2,height:h,tessellation:segments},scene);
  mesh.position.set(x,y,z);mesh.material=mat;
  if(parent)mesh.parent=parent;
  if(cast)addShadow(mesh);
  return mesh;
}
function orb(name,x,y,z,r,mat,parent=null,cast=false){
  const mesh=B.MeshBuilder.CreateSphere(name,{diameter:r*2,segments:14},scene);
  mesh.position.set(x,y,z);mesh.material=mat;
  if(parent)mesh.parent=parent;
  if(cast)addShadow(mesh);
  return mesh;
}
function torus(name,x,y,z,d,t,mat,parent=null){
  const mesh=B.MeshBuilder.CreateTorus(name,{diameter:d,thickness:t,tessellation:32},scene);
  mesh.position.set(x,y,z);mesh.material=mat;if(parent)mesh.parent=parent;return mesh;
}
function pipe(name,a,b,diameter,mat){
  const first=new B.Vector3(...a),last=new B.Vector3(...b),direction=last.subtract(first);
  const mesh=B.MeshBuilder.CreateCylinder(name,{diameter,height:direction.length(),tessellation:20},scene);
  mesh.position=first.add(last).scale(.5);
  const rotation=new B.Quaternion();
  B.Quaternion.FromUnitVectorsToRef(B.Axis.Y,direction.normalize(),rotation);
  mesh.rotationQuaternion=rotation;
  mesh.material=mat;addShadow(mesh);return mesh;
}
function sign(text,x,y,z,w=3){
  const texture=new B.DynamicTexture("label "+text,{width:640,height:160},scene,false);
  texture.hasAlpha=true;
  const c=texture.getContext();
  c.clearRect(0,0,640,160);
  c.fillStyle="#0b2637";c.fillRect(5,16,630,130);
  c.strokeStyle="#7aa2a3";c.lineWidth=5;c.strokeRect(5,16,630,130);
  c.fillStyle="#f7f7e5";c.textAlign="center";c.font="900 51px sans-serif";
  c.fillText(text,320,101,590);texture.update();
  const m=new B.StandardMaterial("labelmat "+text,scene);
  m.diffuseTexture=texture;m.emissiveColor=new B.Color3(.7,.8,.9);m.opacityTexture=texture;m.backFaceCulling=false;m.disableLighting=true;
  const plane=B.MeshBuilder.CreatePlane("sign "+text,{width:w,height:w*.25},scene);
  plane.position.set(x,y,z);plane.material=m;plane.billboardMode=B.Mesh.BILLBOARDMODE_ALL;
  return plane;
}

// Steel factory island, safety stripes, gantry and machinery.
cube("ground",0,-.47,0,22,.74,14,mats.background,null,true);
cube("work platform",0,-.07,0,18,.16,12,mats.floor);
for(let x=-8.5;x<=8.5;x+=1){
  cube("grout z "+x,x,.018,0,.024,.017,11.65,mats.tile);
}
for(let z=-5.5;z<=5.5;z+=1){
  cube("grout x "+z,0,.018,z,17.7,.017,.024,mats.tile);
}
for(const x of [-8.8,8.8]){
  cube("safety rail",x,.04,0,.12,.11,12,mats.yellow);
  for(let z=-5.2;z<=5.2;z+=2.2)cube("safety stripe",x,.105,z,.15,.03,.7,mats.ink);
}
for(const z of [-5.86,5.86])cube("safety rail",0,.035,z,18,.1,.13,mats.yellow);
for(const x of [-8.4,8.4])for(const z of [-5.45,5.45]){
  cylinder("base bolt",x,.05,z,.12,.06,mats.chrome,10);
}
for(const x of [-8.3,8.3]){
  cube("factory girder",x,3.25,5.55,.4,6.5,.45,mats.dark,null,true);
  cube("overhead lamp",x,6.38,5.5,1.1,.14,1,mats.light);
}
cube("overhead crane",0,6.48,5.55,17,.35,.55,mats.steel,null,true);
for(let x=-7;x<=7;x+=2.8){
  cube("crane clamp",x,6.28,5.48,.45,.35,.8,mats.orange);
}
// Main damaged pump, intentionally leaving a traversable ring around its body.
cube("pump pedestal",0,.46,.2,5.1,.9,2.8,mats.ink,null,true);
cube("pump housing",0,1.6,.2,4.65,2.15,2.3,mats.plate,null,true);
cube("face enclosure",0,1.55,-1.01,4.1,1.6,.1,mats.steel);
for(const x of [-1.8,1.8]){
  cylinder("end casing",x,1.75,.2,1.2,1.7,mats.steel,24,null,true).rotation.z=Math.PI/2;
  torus("casing ring",x,1.75,.2,2.2,.15,mats.orange).rotation.z=Math.PI/2;
}
for(const z of [-.8,1.2])for(const x of [-2,2]){
  cylinder("housing fastener",x,2.76,z,.13,.08,mats.chrome,12);
}
cube("service hatch",0,2.7,.15,2.1,.15,1.75,mats.dark,null,true);
for(let x=-.65;x<=.65;x+=.4)cube("hatch vent",x,2.79,.15,.11,.05,1.2,mats.steel);
pipe("intake pipe",[-7,1.45,.0],[-2.4,1.45,.0],.9,mats.steel);
pipe("outlet pipe",[2.4,1.45,.0],[7,1.45,.0],.9,mats.steel);
cylinder("inlet flange",-5.2,1.45,0,.63,.19,mats.orange,24).rotation.z=Math.PI/2;
cylinder("outlet flange",5.2,1.45,0,.63,.19,mats.orange,24).rotation.z=Math.PI/2;
for(const x of [-6.2,6.2]){
  cube("pipe foot",x,.45,0,.42,.9,.95,mats.dark,null,true);
  cube("pipe shield",x,1.55,0,.65,.12,1.2,mats.yellow);
}
const impeller=new B.TransformNode("pump rotor",scene);
impeller.position.set(0,1.55,-1.22);
cylinder("spindle",0,0,0,.24,.3,mats.chrome,24,impeller).rotation.x=Math.PI/2;
for(let i=0;i<6;i++){
  const blade=cube("impeller blade",0,.67,0,.36,.98,.13,mats.orange,impeller);
  blade.rotation.z=i*Math.PI/3;
  blade.position.set(Math.sin(i*Math.PI/3)*.5,Math.cos(i*Math.PI/3)*.5,0);
}
torus("rotor ring",0,0,0,1.7,.06,mats.chrome,impeller);
sign("PUMP 07 / MAINTENANCE",0,3.47,-.65,4.9);
// Elevated filter tray and small auxiliary ducts.
cube("filter tray",0,.48,-3.25,2.7,.85,1.3,mats.dark,null,true);
for(let i=0;i<9;i++)cube("filter rib",-1.05+i*.26,1.01,-3.2,.12,.12,.88,mats.chrome);
for(const x of [-5,5]){
  cylinder("storage drum",x,.72,-4.15,.55,1.38,x<0?mats.orange:mats.plate,28,null,true);
  torus("drum lid",x,1.46,-4.15,1.05,.07,mats.chrome);
}
cube("waste recycling bin",-6.1,.65,4.25,1.8,1.2,1.5,mats.ink,null,true);
cube("bin rim",-6.1,1.29,4.25,1.9,.12,1.6,mats.yellow);
sign("WASTE", -6.1,1.92,4.4,1.8);
// Service control console.
cube("service control tower",6.3,1.0,-3.35,1.45,2,1.1,mats.dark,null,true);
cube("service control display",6.3,1.47,-3.93,1.03,.63,.1,mats.light);
for(let i=0;i<3;i++)orb("tower button",5.94+i*.35,.73,-3.93,.11,[mats.red,mats.yellow,mats.green][i]);
sign("RESTART",6.3,2.6,-3.35,2.2);

const taskViews=new Map();
const icons={clean:"💦",haul:"🛢️",repair:"🔧",restart:"⚡"};
for(const t of TASKS){
  const root=new B.TransformNode("task "+t.id,scene);root.position.set(t.x,0,t.z);
  const ring=torus("interact "+t.id,0,.15,0,1.25,.085,mats.teal,root);
  const halo=cylinder("marker base "+t.id,0,.035,0,.48,.06,mats.ink,24,root);
  const flag=orb("task glow "+t.id,0,1,0,.34,mats.teal,root);
  const signMesh=sign(t.label,0,1.75,0,2.6);
  signMesh.parent=root;signMesh.position.set(0,1.75,0);
  const physical=[];
  if(t.type==="clean"){
    for(let i=0;i<5;i++){
      const blob=orb("sticky grime",Math.cos(i*2.3)*.35,.38+i%2*.17,Math.sin(i*2.3)*.35,.3+i%3*.06,i%2?mats.goo:mats.ooze,root);
      blob.scaling.y=.32;physical.push(blob);
    }
  }
  if(t.type==="haul"){
    const bag=orb("piled sludge",0,.48,0,.55,mats.goo,root,true);bag.scaling.set(1,.54,1);physical.push(bag);
    for(let i=0;i<3;i++){
      const droplet=orb("glossy oil",.2*Math.sin(i*2),.57,.2*Math.cos(i*2),.13,mats.ooze,root);physical.push(droplet);
    }
  }
  if(t.type==="repair"){
    const part=cylinder("replacement part",0,.36,0,.52,.32,mats.chrome,22,root);
    part.rotation.z=Math.PI/2;physical.push(part);
    for(const x of [-.29,.29])physical.push(torus("part rim",x,.36,0,.7,.11,mats.orange,root));
  }
  for(const m of [ring,halo,flag,signMesh,...physical])stamp(m,"task",t.id);
  taskViews.set(t.id,{root,ring,halo,flag,sign:signMesh,physical});
}
const crewViews=new Map();
for(const member of ROLES){
  const root=new B.TransformNode("worker "+member.id,scene);
  root.position.set(member.x,.06,member.z);
  const bodyMat=teamMat(member.color);
  const feet=new B.TransformNode("feet",scene);feet.parent=root;
  for(const x of [-.22,.22]){
    const boot=cube("work boot",x,.14,-.08,.3,.28,.43,mats.ink,feet,true);
    stamp(boot,"worker",member.id);
  }
  const torso=cylinder("oversized suit",0,.54,0,.44,.75,bodyMat,12,root,true);
  torso.scaling.z=.8;
  const belt=torus("utility belt",0,.38,0,.75,.075,mats.ink,root);
  const head=orb("round helmet",0,1.11,0,.49,bodyMat,root,true);
  const visor=cube("face visor",0,1.12,-.45,.67,.24,.14,mats.ink,root);
  const shine=cube("visor glint",-.17,1.16,-.53,.2,.07,.02,mats.light,root);
  const chin=cube("helmet chin",0,.83,-.23,.62,.15,.4,bodyMat,root);
  const armL=cylinder("left arm",-.49,.58,0,.14,.55,bodyMat,10,root,true);armL.rotation.z=-.25;
  const armR=cylinder("right arm",.49,.58,0,.14,.55,bodyMat,10,root,true);armR.rotation.z=.25;
  const tool=cube("tool",.59,.37,-.27,.22,.13,.59,member.skill==="clean"?mats.teal:member.skill==="repair"?mats.chrome:member.skill==="haul"?mats.orange:mats.green,root);
  const selection=torus("selected worker",0,.045,0,1.36,.065,mats.yellow,root);
  const shadowDisc=cylinder("worker floor dot",0,.024,0,.47,.02,mats.tile,18,root);
  selection.isPickable=false;shadowDisc.isPickable=false;
  const name=sign(member.name.toUpperCase(),0,2,0,1.55);
  name.parent=root;name.position.set(0,2,0);stamp(name,"worker",member.id);
  for(const m of [torso,head,visor,shine,chin,armL,armR,tool,belt])stamp(m,"worker",member.id);
  crewViews.set(member.id,{root,selection,feet,armL,armR,tool,head,name,bodyMat});
}
const destination=torus("command cursor",0,.035,0,1.1,.055,mats.green);
destination.isVisible=false;destination.isPickable=false;
const floor=B.MeshBuilder.CreateGround("navigation floor",{width:17.7,height:11.65},scene);
floor.position.y=.032;floor.isVisible=true;floor.visibility=.001;floor.material=mats.floor;floor.isPickable=true;stamp(floor,"floor","ground");

let mission=createMission(),running=false,announcedWin=false,lastUi=0,toastTimer=0;
const taskList=$("taskList"),crewList=$("crewList");
function showToast(message){
  $("toast").textContent=message;$("toast").classList.add("show");toastTimer=performance.now()+2200;
}
function statusFor(t){
  if(t.status==="done")return "COMPLETE";
  if(t.status==="working")return Math.round(t.progress*100)+"% WORKING";
  if(t.status==="assigned")return "EN ROUTE";
  if(!isReady(mission,t))return "LOCKED";
  return t.type==="clean"?"NEEDS WASHER":t.type==="haul"?"NEEDS HAULER":t.type==="repair"?"NEEDS MECHANIC":"NEEDS TECH";
}
function taskClick(id){
  const t=taskById(mission,id);
  if(!t||mission.won||!running)return;
  if(t.status==="done"){showToast("Already completed");return;}
  if(!isReady(mission,t)){showToast("Locked — finish the earlier repairs first");return;}
  let w=workerById(mission,mission.selected);
  if(w.skill!==t.type){
    showToast(t.type==="clean"?"Choose Pip or Mox to wash":t.type==="haul"?"Choose Tug to haul":t.type==="repair"?"Choose Bolt to repair":"Choose Lux to restart");
    return;
  }
  if(assignTask(mission,w.id,id)){
    showToast(w.name+": "+t.label);
    destination.isVisible=false;drawUI();
  }
}
function chooseWorker(id){
  selectWorker(mission,id);drawUI();
}
function nextOrder(){
  if(!running)return;
  const t=mission.tasks.find(item=>isReady(mission,item)&&item.status==="idle");
  if(!t){showToast("All available tasks are already underway");return;}
  const candidates=mission.workers.filter(w=>w.skill===t.type);
  candidates.sort((a,b)=>(a.taskId?100:0)+Math.hypot(a.x-t.x,a.z-t.z)-(b.taskId?100:0)-Math.hypot(b.x-t.x,b.z-t.z));
  const worker=candidates[0];
  selectWorker(mission,worker.id);
  assignTask(mission,worker.id,t.id);
  showToast(worker.name+" assigned to "+t.label.toLowerCase());drawUI();
}
function drawUI(){
  const summary=getSummary(mission);
  const allClean=summary.clean===3,allHaul=summary.haul===2;
  $("objective").textContent=mission.won?"Factory restored!":!allClean?"01 — Clean the pump":!allHaul?"02 — Clear the waste":summary.repair<3?"03 — Rebuild the drive":"04 — Restart the line";
  $("objectiveDetail").textContent=mission.won?"Every part is back in place.":!allClean?"Send Pip and Mox to scrub three dirty areas.":!allHaul?"Tug must collect both oil bags and haul them away.":summary.repair<3?"Bolt installs bearing → coupling → impeller.":"Lux can now restart the machine.";
  $("progressFill").style.width=(summary.done/summary.total*100)+"%";
  $("cleanCount").textContent=summary.clean+"/3";$("wasteCount").textContent=summary.haul+"/2";$("repairCount").textContent=summary.repair+"/3";
  $("taskCounter").textContent=summary.done+" / "+summary.total;
  const min=String(Math.floor(mission.time/60)).padStart(2,"0"),sec=String(Math.floor(mission.time%60)).padStart(2,"0");
  $("timeValue").textContent=min+":"+sec;
  taskList.innerHTML=mission.tasks.map(t=>{
    const locked=!isReady(mission,t),done=t.status==="done",busy=t.status==="assigned"||t.status==="working";
    const className=done?"complete":locked?"locked":busy?"active":"";
    return '<button class="task-entry '+className+'" data-task="'+t.id+'" aria-label="'+t.label+' '+statusFor(t)+'" '+(locked&&!done?'disabled':'')+'>'+
      '<span class="task-icon">'+(done?"✓":locked?"🔒":icons[t.type])+'</span><span><strong>'+t.label+'</strong><small>'+statusFor(t)+'</small>'+
      (busy?'<div class="bar"><span style="width:'+Math.round(t.progress*100)+'%"></span></div>':"")+'</span></button>';
  }).join("");
  crewList.innerHTML=mission.workers.map(w=>{
    return '<button class="crew '+(mission.selected===w.id?"selected ":"")+(w.taskId?"busy":"")+'" data-worker="'+w.id+'" aria-pressed="'+(mission.selected===w.id)+'">'+
      '<span class="portrait" style="background:'+w.color+'"></span><span class="crew-label"><strong>'+w.name+'</strong><small>'+(w.taskId?"Busy":w.role)+'</small></span></button>';
  }).join("");
  const worker=workerById(mission,mission.selected);
  $("commandInfo").textContent=worker.name+" • "+worker.role+" • "+(worker.taskId?"Working on "+taskById(mission,worker.taskId).label:"tap the floor to move");
  $("crewStatus").textContent=mission.workers.filter(w=>!w.taskId).length+" available";
  for(const t of mission.tasks){
    const view=taskViews.get(t.id);
    const done=t.status==="done",available=isReady(mission,t),active=t.status==="assigned"||t.status==="working";
    view.ring.material=done?mats.green:active?mats.yellow:available?mats.teal:mats.ink;
    view.flag.material=done?mats.green:active?mats.yellow:available?mats.teal:mats.dark;
    view.ring.isVisible=!done;view.flag.isVisible=!done;
    view.sign.isVisible=!done;
    for(const m of view.physical)m.isVisible=!done;
  }
}
taskList.addEventListener("click",e=>{const b=e.target.closest("[data-task]");if(b)taskClick(b.dataset.task);});
crewList.addEventListener("click",e=>{const b=e.target.closest("[data-worker]");if(b)chooseWorker(b.dataset.worker);});
$("selectBest").addEventListener("click",nextOrder);
function pickMeta(mesh){
  while(mesh){if(mesh.metadata?.kind)return mesh.metadata;mesh=mesh.parent;}
  return null;
}
let down=null;
canvas.addEventListener("pointerdown",e=>{
  if(e.button!==0)return;
  down={x:e.clientX,y:e.clientY,id:e.pointerId};
});
canvas.addEventListener("pointerup",e=>{
  if(!down||down.id!==e.pointerId)return;
  const start=down;down=null;
  if(!running||mission.paused||Math.hypot(e.clientX-start.x,e.clientY-start.y)>13)return;
  const bounds=canvas.getBoundingClientRect();
  const x=e.clientX-bounds.left,y=e.clientY-bounds.top;
  const picked=scene.pick(x,y,m=>m.isPickable&&m!==floor);
  const meta=picked?.hit?pickMeta(picked.pickedMesh):null;
  if(meta?.kind==="worker"){chooseWorker(meta.id);return;}
  if(meta?.kind==="task"){taskClick(meta.id);return;}
  const groundPick=scene.pick(x,y,m=>m===floor);
  if(groundPick?.hit&&groundPick.pickedPoint){
    const p=groundPick.pickedPoint;
    if(orderMove(mission,mission.selected,p.x,p.z)){
      destination.isVisible=true;destination.position.set(p.x,.06,p.z);
      showToast(workerById(mission,mission.selected).name+" moving");drawUI();
    }
  }
});
canvas.addEventListener("pointercancel",()=>down=null);
function resetMission(){
  mission=createMission();mission.paused=!running;announcedWin=false;
  $("win").classList.add("hidden");
  destination.isVisible=false;
  for(const w of mission.workers){const v=crewViews.get(w.id);v.root.position.set(w.x,.06,w.z);}
  drawUI();
}
function start(){
  $("intro").classList.add("hidden");running=true;mission.paused=false;
  $("pauseBtn").textContent="Pause";drawUI();showToast("Crew deployed — select a washer to start");
}
$("beginBtn").onclick=start;
$("helpBtn").onclick=()=>{mission.paused=true;$("intro").classList.remove("hidden");$("beginBtn").textContent="BACK TO THE WORKSHOP";};
$("pauseBtn").onclick=()=>{if(!running)return;mission.paused=!mission.paused;$("pauseBtn").textContent=mission.paused?"Resume":"Pause";showToast(mission.paused?"Mission paused":"Back to work");};
$("restartBtn").onclick=()=>{running=true;resetMission();mission.paused=false;$("intro").classList.add("hidden");$("pauseBtn").textContent="Pause";showToast("Fresh mission started");};
$("againBtn").onclick=()=>{running=true;resetMission();mission.paused=false;};
$("cameraLeft").onclick=()=>camera.alpha-=.22;
$("cameraRight").onclick=()=>camera.alpha+=.22;
$("cameraIn").onclick=()=>camera.radius=clamp(camera.radius-2,camera.lowerRadiusLimit,camera.upperRadiusLimit);
$("cameraOut").onclick=()=>camera.radius=clamp(camera.radius+2,camera.lowerRadiusLimit,camera.upperRadiusLimit);
window.addEventListener("keydown",e=>{
  const element=e.target;
  if(element instanceof HTMLInputElement||element instanceof HTMLTextAreaElement)return;
  const n=Number(e.key);
  if(n>=1&&n<=5)chooseWorker(ROLES[n-1].id);
  if(e.key===" "){e.preventDefault();$("pauseBtn").click();}
  if(e.key.toLowerCase()==="r")$("restartBtn").click();
  if(e.key==="Escape"&&!$("intro").classList.contains("hidden"))start();
});
function updateWorld(dt,now){
  for(const w of mission.workers){
    const view=crewViews.get(w.id),root=view.root;
    root.position.x=w.x;root.position.z=w.z;
    const moving=w.state==="moving",working=w.state==="working";
    root.position.y=.06+(moving?Math.sin(now*.014+w.x*3)*.065:Math.sin(now*.002+w.x)*.016);
    if(moving){
      const point=w.path[0];
      if(point){const dx=point.x-w.x,dz=point.z-w.z;const desired=Math.atan2(-dx,-dz);
        let d=desired-root.rotation.y;d=Math.atan2(Math.sin(d),Math.cos(d));root.rotation.y+=d*Math.min(1,dt*8);
      }
    }else root.rotation.y*=Math.max(0,1-dt*2);
    const bob=working?Math.sin(now*.014):moving?Math.sin(now*.022):0;
    view.armL.rotation.z=-.25+bob*.27;view.armR.rotation.z=.25-bob*.34;
    view.selection.isVisible=mission.selected===w.id;
    if(view.selection.isVisible){const scale=1+Math.sin(now*.005)*.04;view.selection.scaling.set(scale,1,scale);}
    view.name.isVisible=mission.selected===w.id||working;
    view.tool.scaling.z=working?1.2:1;
    if(w.carrying)view.tool.material=mats.goo;
    else view.tool.material=w.skill==="clean"?mats.teal:w.skill==="repair"?mats.chrome:w.skill==="haul"?mats.orange:mats.green;
  }
  for(const t of mission.tasks){
    const view=taskViews.get(t.id);
    if(t.status!=="done"){
      view.flag.position.y=1+Math.sin(now*.003+t.x)*.1;
      const pulse=1+.12*Math.sin(now*.005+t.z);
      view.flag.scaling.setAll(pulse);
    }
  }
  destination.rotation.y+=dt*.9;
  destination.scaling.setAll(1+Math.sin(now*.007)*.07);
  if(mission.won)impeller.rotation.z+=dt*4.4;
  else impeller.rotation.z+=dt*.06;
}
function frame(){
  const now=performance.now(),dt=Math.min(engine.getDeltaTime()/1000,.05);
  if(running&&!mission.paused)tickMission(mission,dt);
  updateWorld(dt,now);
  if(now-lastUi>180){drawUI();lastUi=now;}
  if(toastTimer&&now>toastTimer){$("toast").classList.remove("show");toastTimer=0;}
  if(mission.won&&!announcedWin){
    announcedWin=true;
    const total=Math.floor(mission.time);
    $("winSummary").textContent="Your five miniature specialists restored the pump in "+Math.floor(total/60)+"m "+(total%60)+"s. All 9 work orders complete.";
    $("win").classList.remove("hidden");
    try{
      const prev=Number(localStorage.getItem("sprayworks-crew-best")||Infinity);
      if(mission.time<prev)localStorage.setItem("sprayworks-crew-best",String(mission.time));
    }catch(error){/* Local storage is optional. */}
  }
  scene.render();
}
engine.runRenderLoop(frame);
window.addEventListener("resize",()=>engine.resize());
document.addEventListener("visibilitychange",()=>{if(document.hidden&&running&&!mission.won){mission.paused=true;$("pauseBtn").textContent="Resume";}});
drawUI();
