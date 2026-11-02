import {Engine} from '@babylonjs/core/Engines/engine.js';
import {Scene} from '@babylonjs/core/scene.js';
import {Vector3} from '@babylonjs/core/Maths/math.vector.js';
import {Color3,Color4} from '@babylonjs/core/Maths/math.color.js';
import {ArcRotateCamera} from '@babylonjs/core/Cameras/arcRotateCamera.js';
import {HemisphericLight} from '@babylonjs/core/Lights/hemisphericLight.js';
import {DirectionalLight} from '@babylonjs/core/Lights/directionalLight.js';
import {ShadowGenerator} from '@babylonjs/core/Lights/Shadows/shadowGenerator.js';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial.js';
import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder.js';
import {TransformNode} from '@babylonjs/core/Meshes/transformNode.js';
import '@babylonjs/core/Culling/ray.js';

export function createClockWorld(canvas,state,providedEngine=null){
 const engine=providedEngine||new Engine(canvas,true,{stencil:true,antialias:true});
 const scale=()=>1/Math.min(2,globalThis.devicePixelRatio||1);engine.setHardwareScalingLevel(scale());
 const scene=new Scene(engine);scene.clearColor=new Color4(.045,.115,.14,1);
 const camera=new ArcRotateCamera('clock camera',-Math.PI/2,.69,15,new Vector3(0,.2,0),scene);camera.inputs.clear();camera.fov=.65;camera.minZ=.1;
 const fill=new HemisphericLight('cream studio fill',new Vector3(0,1,0),scene);fill.intensity=1.15;fill.groundColor=Color3.FromHexString('#597b79');
 const sun=new DirectionalLight('warm workshop light',new Vector3(-.4,-1,.3),scene);sun.intensity=1.7;sun.position=new Vector3(4,9,-5);const shadows=new ShadowGenerator(1024,sun);shadows.useBlurExponentialShadowMap=true;shadows.blurKernel=5;shadows.setDarkness(.27);shadows.bias=.0005;shadows.normalBias=.015;
 function material(name,color,shine=.25){const m=new StandardMaterial(name,scene);m.diffuseColor=Color3.FromHexString(color||'#edb93f');m.specularColor=new Color3(shine,shine,shine);m.specularPower=64;return m;}
 const wood=material('walnut case','#8c4f32'),edge=material('honey wood edge','#c78c52'),cream=material('ivory clock plate','#e6dcc1'),teal=material('turquoise enamel','#30acaa'),brass=material('polished brass','#e8b746',.7),dark=material('blue black steel','#153c48'),silver=material('silver hardware','#d9e7e3',.6),white=material('warm white','#fff5d7'),mud=material('purple clock grime','#6d397d'),water=material('bright water','#8be9f3',.5);water.emissiveColor=new Color3(.2,.45,.5);
 const mats=new Map();function color(c){if(!mats.has(c))mats.set(c,material('enamel '+c,c));return mats.get(c);}
 function finish(mesh,mat,pos,parent,target){mesh.material=mat;mesh.position.set(...pos);mesh.parent=parent||null;mesh.isPickable=!!target;mesh.receiveShadows=true;shadows.addShadowCaster(mesh);if(target)mesh.metadata={target};return mesh;}
 const box=(n,w,h,d,m,p,parent,target)=>finish(MeshBuilder.CreateBox(n,{width:w,height:h,depth:d},scene),m,p,parent,target);
 const sphere=(n,r,m,p,parent,target)=>finish(MeshBuilder.CreateSphere(n,{diameter:r*2,segments:12},scene),m,p,parent,target);
 const cylinder=(n,r,h,m,p,parent,target,sides=32)=>finish(MeshBuilder.CreateCylinder(n,{diameter:2*r,height:h,tessellation:sides},scene),m,p,parent,target);
 const ring=(n,r,t,m,p,parent)=>finish(MeshBuilder.CreateTorus(n,{diameter:2*r,thickness:t,tessellation:40},scene),m,p,parent);
 const floor=box('walkable clock plate',8.25,.2,6.6,cream,[0,-.12,0],null,{type:'floor'});
 box('thick walnut case',8.8,.5,7.1,wood,[0,-.47,0]);box('front golden edge',8.8,.15,.15,edge,[0,-.18,-3.5]);
 box('rear walnut rail',8.8,.65,.35,wood,[0,.08,3.4]);
 for(const x of [-4.25,4.25]){box('low cutaway side',.28,.35,6.8,edge,[x,-.03,0]);cylinder('corner screw',.12,.055,silver,[x,.18,-3.15],null,null,6);}
 for(let i=0;i<9;i++)box('wood grain inlay',.025,.012,6.4,edge,[-3.85+i*.96,-.012,0]);
 // Rear ornament stays behind the working area.
 const pendulum=new TransformNode('working pendulum',scene);pendulum.position.set(0,2.4,2.95);
 cylinder('pendulum pivot',.18,.12,brass,[0,0,0],pendulum).rotation.x=Math.PI/2;
 box('pendulum rod',.07,1.55,.07,brass,[0,-.78,0],pendulum);sphere('pendulum brass bob',.37,brass,[0,-1.55,0],pendulum).scaling.z=.25;
 for(const x of [-3.6,3.6]){box('rear decorative post',.22,2.4,.25,teal,[x,1.1,3.12]);sphere('post finial',.19,brass,[x,2.38,3.12]);}
 box('clock crown',7.6,.2,.25,edge,[0,2.4,3.15]);
 const testRoot=new TransformNode('test lever',scene);testRoot.position.set(3.45,0,2.2);
 cylinder('lever base',.34,.14,teal,[0,.07,0],testRoot,{type:'test'});const lever=box('test handle stem',.1,.6,.1,silver,[0,.4,0],testRoot,{type:'test'});sphere('test lever red knob',.2,color('#ef7952'),[0,.74,0],testRoot,{type:'test'});
 function mark(root,value,y,r,m){const name=String(value??'sun');
 if(name==='moon'){const moon=finish(MeshBuilder.CreateTorus('moon matching mark',{diameter:r*2,thickness:.055,tessellation:28,arc:.72},scene),m,[0,y,0],root);moon.rotation.y=.5;}
 else if(name==='star'){for(let j=0;j<5;j++){const a=j*Math.PI*2/5;const ray=box('star matching mark',.045,.03,r*1.05,m,[Math.sin(a)*r*.35,y,Math.cos(a)*r*.35],root);ray.rotation.y=a;}}
 else {ring('sun matching mark',r*.55,.045,m,[0,y,0],root);for(let j=0;j<8;j++){const a=j*Math.PI/4;const ray=box('sun ray',.035,.03,r*.3,m,[Math.sin(a)*r*.9,y,Math.cos(a)*r*.9],root);ray.rotation.y=a;}}
 }
 // A visible rear drive links the separated service shafts.
 const idlers=[];
 for(const x of [-1,1]){const root=new TransformNode('idler drive',scene);root.position.set(x,.12,1.75);cylinder('idler brass wheel',.4,.16,brass,[0,0,0],root);for(let j=0;j<12;j++){const a=j*Math.PI/6;const tooth=box('idler tooth',.14,.16,.16,brass,[Math.sin(a)*.42,0,Math.cos(a)*.42],root);tooth.rotation.y=a;}cylinder('idler pin',.1,.22,silver,[0,.08,0],root);idlers.push(root);}
 box('drive linkage',4.2,.07,.075,brass,[0,.11,1.75]);

 const slots=(state.slots||[]).map((s,i)=>{const root=new TransformNode('shaft '+s.id,scene);root.position.set(s.x,0,s.z);const r=Number(s.size)||.65;
 cylinder('socket shadow',r*.83,.028,dark,[0,.008,0],root,{type:'slot',id:s.id});ring('socket brass rim',r*.9,.07,brass,[0,.035,0],root);cylinder('empty clock shaft',.13,.42,silver,[0,.22,0],root,{type:'slot',id:s.id});mark(root,s.mark??i,.08,r*.42,water);return root;});
 const parts=(state.parts||[]).map((p,i)=>{const root=new TransformNode('gear '+p.id,scene),r=Number(p.size)||.65,target={type:'part',id:p.id},gearMat=p.color?color(p.color):brass;
 cylinder('gear face '+p.id,r,.18,gearMat,[0,0,0],root,target);ring('gear face bevel',r*.78,.065,brass,[0,.105,0],root);for(let j=0;j<14;j++){const a=j*Math.PI/7,t=box('gear tooth',r*.27,.18,r*.27,gearMat,[Math.sin(a)*r,0,Math.cos(a)*r],root,target);t.rotation.y=a;}
 cylinder('gear hub',r*.25,.27,silver,[0,.045,0],root,target);cylinder('shaft hole',r*.12,.012,dark,[0,.186,0],root,target);
 const symbol=new TransformNode('revealed gear symbol',scene);symbol.parent=root;symbol.position.x=r*.45;mark(symbol,p.mark??i,.13,r*.2,water);
 const dirt=Array.from({length:9},(_,j)=>{const a=j*2.4,d=sphere('removable grime',r*.23,mud,[Math.sin(a)*r*.58,.14,Math.cos(a)*r*.58],root,target);d.scaling.y=.36;return d;});return {root,dirt,symbol};});
 const workers=(state.workers||[]).map((w,i)=>{const root=new TransformNode('worker '+w.name,scene),suit=color(w.color||['#f29d3d','#39b6c9','#b191e3'][i]),target={type:'worker',id:w.id};
 sphere('rounded worker torso',.26,suit,[0,.58,0],root,target).scaling.y=1.25;
 const legs=[-1,1].map(s=>{const leg=box('articulated boot',.22,.3,.32,dark,[s*.15,.17,-.04],root,target);return leg;});
 const arms=[-1,1].map(s=>{const shoulder=sphere('padded shoulder',.14,suit,[s*.29,.74,0],root,target);const elbow=sphere('flexible elbow joint',.105,suit,[s*.33,.57,-.08],root,target);const upper=cylinder('upper arm segment',.095,1,suit,[s*.32,.65,-.04],root,target);const forearm=cylinder('articulated forearm',.085,1,suit,[s*.32,.47,-.13],root,target);return {shoulder,elbow,upper,forearm};});
 const hands=[-1,1].map(s=>sphere('silver glove',.12,silver,[s*.34,.5,-.12],root,target));
 sphere('round safety helmet',.35,suit,[0,1.05,0],root,target);const rim=sphere('visor silver rim',.31,silver,[0,1.05,-.15],root,target);rim.scaling.set(1,.65,.7);const visor=sphere('wide dark visor',.285,dark,[0,1.06,-.19],root,target);visor.scaling.set(1,.6,.7);const glint=sphere('visor glint',.08,white,[-.1,1.12,-.37],root);glint.scaling.set(1,.2,.3);
 box('helmet stripe',.08,.04,.36,white,[0,1.38,0],root);box('cleaning backpack',.34,.42,.22,cream,[0,.65,.26],root,target);cylinder('water tank',.1,.38,water,[.2,.64,.28],root);
 const nozzle=box('worker spray nozzle',.12,.12,.36,brass,[.34,.55,-.3],root);const torso=root.getChildMeshes().find(m=>m.name==='rounded worker torso');const helmet=root.getChildMeshes().find(m=>m.name==='round safety helmet');const selection=ring('selected worker halo',.48,.065,water,[0,.03,0],root);
 const drops=Array.from({length:12},()=>sphere('spray droplet',.035,water,[0,-5,0]));return {root,legs,hands,arms,nozzle,torso,helmet,selection,drops,animation:{x:w.x,z:w.z,yaw:w.yaw||0,stride:0}};});
 // CLOCK INTERIOR: three connected spaces, not a tabletop. Keep the front open for readability.
 const timber=(n,w,h,d,x,y,z)=>box(n,w,h,d,wood,[x,y,z]);
 const metal=(n,w,h,d,x,y,z)=>box(n,w,h,d,brass,[x,y,z]);
 // Lower drive workshop: rear bulkhead, massive arch and separated gear bays.
 timber('lower machine rear wall',8.4,3.5,.24,0,1.45,3.5);
 for(const x of [-4.1,-1.45,1.45,4.1]){
   timber('load bearing clock column',.32,5.8,.48,x,2.65,3.15);
   metal('column fillet',.38,.12,.54,x,.45,3.15);
   metal('column crown',.38,.12,.54,x,5.4,3.15);
 }
 timber('drive room lintel',8.6,.3,.45,0,3.1,3.25);
 // Suspended bridge, upper bell-room enclosure and skylight frame.
 timber('upper chamber back wall',3.7,2.75,.26,2.65,3.45,3.44);
 timber('upper bell left wall',.2,2.6,1.9,.92,3.45,2.6);
 timber('upper bell right wall',.2,2.6,1.9,4.4,3.45,2.6);
 timber('bell chamber crown',3.75,.26,2.0,2.65,4.9,2.6);
 metal('bell arch upper edge',3.7,.1,.1,2.65,4.72,1.65);
 // A third, visibly different pendulum gallery sits left of the drive room.
 timber('pendulum gallery floor',2.55,.22,1.75,-2.65,1.68,2.05);
 timber('pendulum gallery back',2.7,2.4,.2,-2.65,2.9,3.03);
 metal('pendulum gallery guardrail',2.4,.08,.08,-2.65,2.12,1.25);
 for(const x of [-3.8,-1.5])metal('pendulum gallery baluster',.08,.62,.08,x,1.88,1.25);
 metal('pendulum gallery bridge',2.3,.14,.65,-.55,1.7,2.1);
 for(const x of [-1.5,-.75,0])metal('gallery bridge crossbar',.07,.17,.7,x,1.7,2.1);
 // Enclosed elevator shaft and an overhead gantry make the travel route legible.
 for(const x of [2.62,3.88]){
   metal('elevator shaft guide',.13,3.2,.13,x,1.55,2.75);
   metal('elevator guide cap',.22,.18,.22,x,3.15,2.75);
 }
 metal('elevator top beam',1.55,.18,.32,3.25,3.15,2.75);
 // Large overhead spring and transmission spindle signal that this is inside a machine.
 for(let i=0;i<11;i++){
   const spring=ring('tower mainspring coil',.48,.055,brass,[-2.9,3.2+i*.16,2.8]);
   spring.rotation.x=Math.PI/2;
 }
 cylinder('tower mainspring spindle',.12,2.0,silver,[-2.9,3.9,2.8]);
 // The locked machine-to-machine gateway establishes this clock as Chamber 01.
 const gateway=new TransformNode('passage to chamber two',scene);gateway.position.set(-3.35,0,2.95);
 box('next chamber doorway surround',1.35,2.15,.22,brass,[0,1.05,0],gateway);
 box('next chamber dark door',1.04,1.76,.08,dark,[0,1.02,-.15],gateway,{type:'exit'});
 for(const x of [-.57,.57])box('next chamber door jamb',.12,2.12,.3,wood,[x,1.05,-.18],gateway);
 box('next chamber door header',1.32,.16,.3,wood,[0,2.08,-.18],gateway);
 const gatewayLamp=sphere('passage status lamp',.14,mud,[0,2.3,-.28],gateway);
 const lift=new TransformNode('powered brass elevator',scene);lift.position.set(3.25,0,2.25);
 box('elevator platform',1.15,.16,1.05,brass,[0,.12,0],lift);
 for(const side of [-1,1])box('lift safety rail',.06,.9,.06,brass,[side*.5,.62,.38],lift);
 // Layered cutaway: structural uprights, upper catwalk, and visible drive bridges.
 for(const x of [-3.7,3.7]){
  box('clock tower upright',.25,3.5,.27,wood,[x,1.45,2.95]);
  box('clock tower brass spine',.09,3.1,.09,brass,[x,1.5,2.75]);
 }
 box('upper shaft bridge',2.0,.12,.5,brass,[1.4,2.15,2.5]);
 for(const x of [.55,1.3,2.05])box('upper bridge cross brace',.11,.2,.56,dark,[x,2.15,2.5]);
 const upper=new TransformNode('upper bell chamber',scene);upper.position.set(2.65,2.35,2.5);
 box('upper clock balcony',2.9,.18,1.65,wood,[0,0,0],upper);
 box('upper balcony brass trim',2.95,.12,.12,brass,[0,.04,-.82],upper);
 for(const x of [-1.25,0,1.25])box('upper chamber guardrail post',.09,.65,.09,brass,[x,.4,.7],upper);
 box('upper chamber guardrail',2.65,.08,.08,brass,[0,.74,.7],upper);
 const upperFloor=box('walkable upper catwalk',2.8,.05,1.45,cream,[0,.11,0],upper,{type:'upper-floor'});
 upperFloor.metadata={target:{type:'upper-floor'}};
 const bell=cylinder('cuckoo bell',.43,.6,brass,[0,.63,0],upper);bell.scaling.y=.7;
 const bellGrime=sphere('bell jam grime',.36,mud,[.32,.43,-.34],upper);bellGrime.scaling.y=.55;
 const bird=new TransformNode('cuckoo bird',scene);bird.parent=upper;bird.position.set(-.9,.8,-.15);
 sphere('cuckoo body',.26,teal,[0,0,0],bird);
 sphere('cuckoo head',.18,white,[0,.24,-.12],bird);
 box('cuckoo beak',.14,.1,.2,brass,[0,.2,-.36],bird);
 // Chamber 02 is a separate machine bay, spatially beyond the clock tower.
 const pumpRoom=new TransformNode('pressure works chamber two',scene);
 pumpRoom.position.set(14,0,0);
 box('pressure works floor',8.5,.25,7,wood,[0,-.2,0],pumpRoom,{type:'pump-floor'});
 box('pressure works rear wall',8.5,4,.35,dark,[0,1.8,3.4],pumpRoom);
 for(const x of [-3.9,3.9])box('pressure works support',.3,4,.4,brass,[x,1.8,3.1],pumpRoom);
 box('pressure works overhead header',8.3,.35,.5,brass,[0,3.65,3.15],pumpRoom);
 const pumpRotor=new TransformNode('pump rotor',scene);pumpRotor.parent=pumpRoom;pumpRotor.position.set(0,1.15,1.3);
 cylinder('pressure pump body',1.1,.9,teal,[0,0,0],pumpRotor).rotation.x=Math.PI/2;
 ring('pump rotor rim',.95,.16,brass,[0,0,-.48],pumpRotor).rotation.x=Math.PI/2;
 for(let i=0;i<8;i++){const a=i*Math.PI/4;const blade=box('pump rotor blade',.18,.68,.12,silver,[Math.cos(a)*.55,Math.sin(a)*.55,-.52],pumpRotor);blade.rotation.z=a;}
 const filterMeshes=[],valveMeshes=[],flowIndicators=[];
 for(let i=0;i<3;i++){
  const x=-2.65+i*2.65;
  const pipe=box('pressure manifold pipe',.22,.22,3.6,silver,[x,.72,.35],pumpRoom);
  cylinder('filter housing '+i,.42,.95,teal,[x,.55,-1.5],pumpRoom,{type:'filter',index:i});
  const dirt=sphere('filter sludge '+i,.31,mud,[x,.95,-1.5],pumpRoom,{type:'filter',index:i});filterMeshes.push(dirt);
  const valve=new TransformNode('pressure valve '+i,scene);valve.parent=pumpRoom;valve.position.set(x,1.2,.2);
  cylinder('valve stem '+i,.13,.7,brass,[0,0,0],valve,{type:'valve',index:i});
  const wheel=ring('valve wheel '+i,.44,.1,water,[0,.4,0],valve);wheel.rotation.x=Math.PI/2;wheel.isPickable=true;wheel.metadata={target:{type:'valve',index:i}};valveMeshes.push(valve);
  box('manifold riser',.14,1.6,.14,brass,[x,1.95,1.8],pumpRoom);
  const flow=sphere('line flow indicator '+i,.13,water,[x,2.75,1.68],pumpRoom);flowIndicators.push(flow);
  for(let j=0;j<6;j++){const bolt=sphere('filter cover fastener '+i+'-'+j,.065,silver,[x+Math.cos(j*Math.PI/3)*.35,1.02,-1.5+Math.sin(j*Math.PI/3)*.35],pumpRoom);bolt.scaling.y=.35;}
 }
 box('pump chamber overhead pipeline',6.8,.18,.2,brass,[0,2.75,1.8],pumpRoom);
 const pumpLamp=sphere('pressure running indicator',.24,mud,[0,3.12,2.95],pumpRoom);
 const gaugeFace=cylinder('pressure gauge dial',.38,.08,cream,[2.55,2.85,3.12],pumpRoom);gaugeFace.rotation.x=Math.PI/2;
 const gaugeNeedle=box('pressure gauge needle',.055,.55,.045,dark,[2.55,2.85,3.02],pumpRoom);
 cylinder('pump drive motor',.65,1.45,dark,[0,1.12,2.25],pumpRoom).rotation.x=Math.PI/2;
 for(let i=0;i<7;i++)ring('motor cooling rib',.62,.065,silver,[0,1.12,1.75+i*.17],pumpRoom).rotation.x=Math.PI/2;
 let viewYaw=0,viewZoom=1,viewFocus='auto';
 const liftStart=lift.position.y;
 const workVfx=Array.from({length:3},(_,i)=>{const halo=ring('gear seating pulse '+i,.85,.05,water,[0,-10,0]);halo.isPickable=false;return halo;});
 function resize(){engine.resize();const a=(canvas.clientWidth||engine.getRenderWidth())/(canvas.clientHeight||engine.getRenderHeight());camera.radius=a<.8?15.5:12.5;camera.fov=a<.8?.67:.65;}
 resize();
 return {scene,resize,orbit(delta){viewYaw=Math.max(-.75,Math.min(.75,viewYaw+delta));},zoom(delta){viewZoom=Math.max(.72,Math.min(1.65,viewZoom*delta));},focus(mode){viewFocus=mode;},resetView(){viewYaw=0;viewZoom=1;viewFocus='auto';},setQuality(high){engine.setHardwareScalingLevel(high?scale():1);engine.resize();},dispose(){scene.dispose();engine.dispose();},pick(x,y){const h=scene.pick(x,y,m=>m.isPickable);if(!h?.hit)return null;const target=h.pickedMesh.metadata?.target;if(target?.type==='floor'||target?.type==='upper-floor')return {...target,x:h.pickedPoint.x,z:h.pickedPoint.z};return target||null;},render(t,selected=state.selected){
 const inPump=state.chamber==='pump';
 pumpRoom.setEnabled(inPump);
 parts.forEach((g,i)=>{const p=state.parts[i];g.root.setEnabled(!inPump);g.root.position.set(p.x,p.y??.2,p.z);g.root.rotation.y=state.running?t*(i%2?-1:1)*.7:0;const d=Math.max(0,Math.min(1,p.dirt??1));g.dirt.forEach((mesh,j)=>{mesh.setEnabled(d>j/10);mesh.scaling.y=.36*Math.max(.1,d);});g.symbol.setEnabled(d<.15);});
 workers.forEach((v,i)=>{
  const w=state.workers[i],a=v.animation,dt=Math.min(.05,Math.max(.001,t-(a.lastTime??t-.016)));a.lastTime=t;
  const pumpWash=inPump&&w.job?.kind==='pump-filter',pumpTurn=inPump&&w.job?.kind==='pump-valve';
  const team=state.teamCarry,teamwork=team&&(team.leader===w.id||team.partner===w.id),phase=teamwork?team.phase:null;
  const riding=state.liftRide?.worker===w.id,liftHeight=riding?1.9*(state.liftRide?.progress||0):(w.level===1?2.36:0);
  const targetX=w.x+(inPump?14:0),targetZ=w.z;
  const moved=Math.hypot(targetX-a.x,targetZ-a.z),walking=moved>.003||w.job?.phase==='walk'||w.job?.phase==='board'||phase==='carry';
  const smooth=1-Math.exp(-dt*17);a.x+=(targetX-a.x)*smooth;a.z+=(targetZ-a.z)*smooth;
  a.stride+=Math.min(.16,moved)*9;
  const yawTarget=(pumpWash||pumpTurn)?0:(w.yaw||0)+Math.PI;
  let yawDelta=((yawTarget-a.yaw+Math.PI*3)%(Math.PI*2))-Math.PI;a.yaw+=yawDelta*(1-Math.exp(-dt*12));
  const gait=walking?Math.min(1,moved*12+.22):0,cycle=a.stride;
  const bounce=gait*(.026+.025*Math.abs(Math.sin(cycle*2)));
  v.root.position.set(a.x,liftHeight+bounce,a.z);v.root.rotation.y=a.yaw;
  v.selection.setEnabled(selected===i||selected===w.id);
  v.legs.forEach((leg,j)=>{const s=j===0?1:-1,step=Math.sin(cycle+s*Math.PI/2)*gait;leg.position.z=-.04+step*.18;leg.position.y=.17+Math.max(0,step)*.1;leg.rotation.x=step*.22;});
  const held=state.parts.find(p=>(teamwork&&p.id===team.part)||p.id===w.carrying||((['pickup','place','drop'].includes(w.job?.kind))&&w.job?.phase==='work'&&p.id===w.job.part));
  const work=w.job?.phase==='work',action=w.job?.kind,effort=work?Math.min(1,(w.job?.time??0)*5):0;
  const heavy=teamwork&&['brace','carry','lower'].includes(phase);
  v.torso.scaling.y=1.25*(heavy?1-.065*Math.sin(Math.min(1,team.time)*Math.PI):1);
  v.helmet.rotation.z=heavy?.06*Math.sin(t*4):walking?.035*Math.sin(cycle):0;
  const locate=(mesh,from,to,radius)=>{
   const d=to.subtract(from),length=Math.max(.001,d.length());
   mesh.position.copyFrom(from.add(d.scale(.5)));mesh.scaling.y=length;
   mesh.rotationQuaternion=null;mesh.rotation.set(0,0,0);
   mesh.lookAt(to);mesh.rotate(new Vector3(1,0,0),Math.PI/2);
  };
  v.hands.forEach((h,j)=>{
   const side=j===0?-1:1,shoulder=new Vector3(side*.29,.74,0);
   let target=new Vector3(side*.34,.49+gait*Math.sin(cycle+j*Math.PI)*.06,-.12);
   if(held){const grip=Math.min(.64,(Number(held.size)||.65)*.78);target.set(side*grip,(held.y??.72)+.06-liftHeight,-.22);}
   if(heavy&&phase==='brace')target.y=.46+Math.min(.32,team.time*.4);
   if(pumpWash){target.set(side*.25,.78+Math.sin(t*12+j)*.045,-.45);}
   if(pumpTurn){const theta=(state.pump?.valveProgress?.[w.job.index]||0)*Math.PI/2+j*Math.PI;target.set(Math.cos(theta)*.36,1.18+Math.sin(theta)*.15,.38);}
   if(work&&action==='clean'&&!held)target.set(side*.25,.66+Math.sin(t*10+j)*.035,-.42);
   if(work&&action==='bell')target.set(side*.28,.9,-.48);
   const elbow=shoulder.add(target.subtract(shoulder).scale(.48)).add(new Vector3(side*.09,-.08,.08));
   h.position.copyFrom(target);v.arms[j].elbow.position.copyFrom(elbow);
   locate(v.arms[j].upper,shoulder,elbow);locate(v.arms[j].forearm,elbow,target);
  });
  const nozzleHand=v.hands[1];v.nozzle.position.set(nozzleHand.position.x,nozzleHand.position.y,nozzleHand.position.z-.17);
  v.root.computeWorldMatrix(true);
  const p=state.parts.find(p=>p.id===(w.job?.partId??w.job?.targetId??w.job?.part));
  const washing=((action==='clean'||action==='bell')&&work)||pumpWash;
  const start=v.nozzle.getAbsolutePosition();
  const end=p?new Vector3(p.x,(p.y??.2)+.2,p.z):action==='bell'?new Vector3(2.65,2.9,2.5):pumpWash?new Vector3(14-2.65+w.job.index*2.65,.9,-1.5):start.add(new Vector3(0,-.15,-.7));
  v.drops.forEach((d,j)=>{d.setEnabled(Boolean(washing));if(washing){const q=(t*2+j/12)%1;d.position=Vector3.Lerp(start,end,q);d.position.y+=Math.sin(q*Math.PI)*.13;}});
 });
 workVfx.forEach((pulse,i)=>{const part=state.parts[i];const seating=state.teamCarry?.phase==='lower'&&state.teamCarry.part===part.id;const solo=state.workers.some(w=>w.job?.kind==='place'&&w.job.part===part.id&&w.job.phase==='work');const active=!inPump&&(seating||solo);pulse.setEnabled(active);if(active){pulse.position.set(part.x,.42,part.z);pulse.scaling.setAll(.85+Math.sin(t*13)*.09);}});
 filterMeshes.forEach((mesh,i)=>{const grime=state.pump?.filters[i]??1;mesh.setEnabled(inPump&&grime>.01);mesh.scaling.setAll(Math.max(.03,grime));});
 flowIndicators.forEach((mesh,i)=>{const flowing=inPump&&state.pump?.running&&state.pump.valves[i];mesh.setEnabled(flowing);if(flowing)mesh.position.x=-2.65+i*2.65+Math.sin(t*5+i)*.11;});
 gaugeNeedle.rotation.z=-(state.pump?.pressure||0)*Math.PI/150;
 valveMeshes.forEach((v,i)=>v.rotation.y=(state.pump?.valveProgress?.[i]??(state.pump?.valves[i]?1:0))*Math.PI/2);
 pumpRotor.rotation.z=state.pump?.running?t*3:0;
 pumpLamp.material=state.pump?.running?water:mud;
 const upperFocus=state.upperReached||(state.liftRide?.phase==='ascend'&&state.liftRide.progress>.55);
 const focusWorker=state.workers.find(w=>w.id===selected)||state.workers[0];
 const desiredFocus=viewFocus==='crew'&&focusWorker?new Vector3(focusWorker.x+(inPump?14:0),.95+(focusWorker.level?2.36:0),focusWorker.z):inPump?new Vector3(14,1.3,.3):(upperFocus?new Vector3(2.65,2.55,2.4):new Vector3(0,.85,.3));
 camera.target=Vector3.Lerp(camera.target,desiredFocus,.035);
 const portrait=(canvas.clientWidth||390)/(canvas.clientHeight||844)<.8;
 const desiredRadius=inPump?(portrait?14.5:11.5):(upperFocus?(portrait?9.2:7.5):(portrait?15.5:12.5));
 camera.radius+=(desiredRadius*viewZoom-camera.radius)*.06;
 camera.alpha+=(-Math.PI/2+viewYaw-camera.alpha)*.08;
 lift.position.y=liftStart+(state.liftRide?1.9*(state.liftRide.progress||0):state.upperReached?1.9:state.liftPowered?.12:0);
 gatewayLamp.material=state.exitUnlocked?water:mud;
 floor.setEnabled(!inPump);
 bellGrime.setEnabled(!state.bellClean);
 bell.rotation.z=state.running?Math.sin(t*10)*.22:0;
 bird.position.z=state.running?-.15-Math.min(1,(state.finaleTime||0)/1.5)*.85:-.15;
 bird.rotation.y=state.running?Math.sin(t*3)*.15:0;
 idlers.forEach((g,i)=>g.rotation.y=state.running?t*(i%2?-1:1):0);pendulum.rotation.z=state.running?Math.sin(t*2.5)*.22:0;lever.rotation.z=state.running?.3:0;scene.render();}};
}
