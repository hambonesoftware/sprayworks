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
 const hands=[-1,1].map(s=>{sphere('padded shoulder',.14,suit,[s*.29,.74,0],root,target);return sphere('silver glove',.12,silver,[s*.34,.5,-.12],root,target);});
 sphere('round safety helmet',.35,suit,[0,1.05,0],root,target);const rim=sphere('visor silver rim',.31,silver,[0,1.05,-.15],root,target);rim.scaling.set(1,.65,.7);const visor=sphere('wide dark visor',.285,dark,[0,1.06,-.19],root,target);visor.scaling.set(1,.6,.7);const glint=sphere('visor glint',.08,white,[-.1,1.12,-.37],root);glint.scaling.set(1,.2,.3);
 box('helmet stripe',.08,.04,.36,white,[0,1.38,0],root);box('cleaning backpack',.34,.42,.22,cream,[0,.65,.26],root,target);cylinder('water tank',.1,.38,water,[.2,.64,.28],root);
 const nozzle=box('worker spray nozzle',.12,.12,.36,brass,[.34,.55,-.3],root);const selection=ring('selected worker halo',.48,.065,water,[0,.03,0],root);
 const drops=Array.from({length:12},()=>sphere('spray droplet',.035,water,[0,-5,0]));return {root,legs,hands,nozzle,selection,drops};});
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
 const liftStart=lift.position.y;
 function resize(){engine.resize();const a=(canvas.clientWidth||engine.getRenderWidth())/(canvas.clientHeight||engine.getRenderHeight());camera.radius=a<.8?19.7:14.2;camera.fov=a<.8?.67:.65;camera.target.set(0,.2,0);}
 resize();
 return {scene,resize,setQuality(high){engine.setHardwareScalingLevel(high?scale():1);engine.resize();},dispose(){scene.dispose();engine.dispose();},pick(x,y){const h=scene.pick(x,y,m=>m.isPickable);if(!h?.hit)return null;const target=h.pickedMesh.metadata?.target;if(target?.type==='floor'||target?.type==='upper-floor')return {...target,x:h.pickedPoint.x,z:h.pickedPoint.z};return target||null;},render(t,selected=state.selected){
 parts.forEach((g,i)=>{const p=state.parts[i];g.root.position.set(p.x,p.y??.2,p.z);g.root.rotation.y=state.running?t*(i%2?-1:1)*.7:0;const d=Math.max(0,Math.min(1,p.dirt??1));g.dirt.forEach((mesh,j)=>{mesh.setEnabled(d>j/10);mesh.scaling.y=.36*Math.max(.1,d);});g.symbol.setEnabled(d<.15);});
 workers.forEach((v,i)=>{const w=state.workers[i],walking=w.job?.phase==='walk'||w.job?.phase==='board'||w.walking,carrying=w.carrying!=null;const riding=state.liftRide?.worker===w.id;const liftHeight=riding?1.9*(state.liftRide?.progress||0):(w.level===1?2.36:0);v.root.position.set(w.x,liftHeight+(walking?Math.abs(Math.sin(t*12))*.035:0),w.z);v.root.rotation.y=(w.yaw||0)+Math.PI;v.selection.setEnabled(selected===i||selected===w.id);v.legs.forEach((b,j)=>b.position.z=-.04+(walking?Math.sin(t*12+j*Math.PI)*.15:0));const teamwork=state.teamCarry?.leader===w.id||state.teamCarry?.partner===w.id;const held=state.parts.find(p=>(teamwork&&p.id===state.teamCarry?.part)||p.id===w.carrying||((w.job?.kind==='pickup'||w.job?.kind==='place'||w.job?.kind==='drop')&&w.job?.phase==='work'&&p.id===w.job.part));v.hands.forEach((h,j)=>{h.position.y=held?(held.y??.72)+.04:carrying?.76:.5+(walking?Math.sin(t*9+j*Math.PI)*.08:0);h.position.z=held||carrying?-.2:-.12;h.position.x=(j===0?-1:1)*(held?Math.min(.62,(Number(held.size)||.65)*.78):.34);});
 const washing=(w.job?.kind==='clean'||w.job?.kind==='bell')&&w.job?.phase==='work';const p=state.parts.find(p=>p.id===(w.job?.partId??w.job?.targetId??w.job?.part));v.root.computeWorldMatrix(true);const start=v.nozzle.getAbsolutePosition(),end=p?new Vector3(p.x,(p.y??.2)+.2,p.z):w.job?.kind==='bell'?new Vector3(2.65,2.9,2.5):start.add(new Vector3(0,-.15,-.7));v.drops.forEach((d,j)=>{d.setEnabled(washing);if(washing){const q=(t*2+j/12)%1;d.position=Vector3.Lerp(start,end,q);d.position.y+=Math.sin(q*Math.PI)*.13;}});
 });
 const targetY=state.upperReached?1.25:(state.liftRide?.phase==='ascend'?0.2+1.05*(state.liftRide.progress||0):0.2);
 camera.target.y+=(targetY-camera.target.y)*.045;
 const desiredRadius=state.upperReached?16.5:((canvas.clientWidth||390)/(canvas.clientHeight||844)<.8?19.7:14.2);
 camera.radius+=(desiredRadius-camera.radius)*.012;
 lift.position.y=liftStart+(state.liftRide?1.9*(state.liftRide.progress||0):state.upperReached?1.9:state.liftPowered?.12:0);
 bellGrime.setEnabled(!state.bellClean);
 bell.rotation.z=state.running?Math.sin(t*10)*.22:0;
 bird.position.z=state.running?-.15-Math.min(1,(state.finaleTime||0)/1.5)*.85:-.15;
 bird.rotation.y=state.running?Math.sin(t*3)*.15:0;
 idlers.forEach((g,i)=>g.rotation.y=state.running?t*(i%2?-1:1):0);pendulum.rotation.z=state.running?Math.sin(t*2.5)*.22:0;lever.rotation.z=state.running?.3:0;scene.render();}};
}
