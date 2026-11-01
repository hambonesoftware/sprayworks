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
import {PATCH_COUNT} from './corner-state.js';
export function createCornerWorld(canvas,state,providedEngine=null){
 const engine=providedEngine||new Engine(canvas,true,{stencil:true,antialias:true});engine.setHardwareScalingLevel(1/Math.min(2,globalThis.devicePixelRatio||1));const scene=new Scene(engine);scene.clearColor=new Color4(.045,.13,.17,1);
 const camera=new ArcRotateCamera('close camera',-Math.PI/2,.72,17,new Vector3(0,.3,0),scene);camera.inputs.clear();camera.fov=.68;camera.minZ=.1;
 const sky=new HemisphericLight('soft fill',new Vector3(0,1,0),scene);sky.intensity=.95;sky.groundColor=Color3.FromHexString('#357887');
 const sun=new DirectionalLight('warm key',new Vector3(-.5,-1,.4),scene);sun.position=new Vector3(4,10,-7);sun.intensity=1.2;const shadows=new ShadowGenerator(2048,sun);shadows.useBlurExponentialShadowMap=true;shadows.blurKernel=6;shadows.setDarkness(.32);shadows.bias=.0005;shadows.normalBias=.015;
 function mat(n,c,shine=.3){const m=new StandardMaterial(n,scene);m.diffuseColor=Color3.FromHexString(c);m.specularColor=new Color3(shine,shine,shine);m.specularPower=64;return m;}
 const teal=mat('turquoise enamel','#17b9bf'),gold=mat('golden gear','#ffbc35',.65),silver=mat('machined silver','#d7e5e9',.7),dark=mat('deep blue steel','#163f53'),orange=mat('orange enamel','#ff8739'),purple=mat('purple goo','#922cc5',.65),blue=mat('Pip blue suit','#159df1'),visor=mat('dark glass','#122936',.9),white=mat('ivory backpack','#f3f1df'),cyan=mat('water','#9eefff',.6);cyan.emissiveColor=new Color3(.2,.6,.7);
 dark.specularColor=new Color3(.08,.08,.08);purple.specularPower=100;gold.specularPower=100;silver.specularPower=120;teal.specularPower=48;
 const all=[];
 function finish(m,material,p,parent){m.material=material;m.position.set(...p);m.parent=parent||null;m.isPickable=false;m.receiveShadows=true;shadows.addShadowCaster(m);all.push(m);return m;}
 const box=(n,w,h,d,m,p,parent)=>finish(MeshBuilder.CreateBox(n,{width:w,height:h,depth:d},scene),m,p,parent);
 const ball=(n,r,m,p,parent)=>finish(MeshBuilder.CreateSphere(n,{diameter:r*2,segments:16},scene),m,p,parent);
 const cyl=(n,r,h,m,p,parent,t=40)=>finish(MeshBuilder.CreateCylinder(n,{diameter:r*2,height:h,tessellation:t},scene),m,p,parent);
 const ring=(n,r,t,m,p,parent)=>finish(MeshBuilder.CreateTorus(n,{diameter:r*2,thickness:t,tessellation:48},scene),m,p,parent);
 function pipe(points,r,m){return finish(MeshBuilder.CreateTube('rounded pipe',{path:points.map(p=>new Vector3(...p)),radius:r,tessellation:20},scene),m,[0,0,0]);}
 box('open gearbox base',9,.7,8,teal,[0,-.65,0]);box('recessed dark sump',8.5,.12,7.4,dark,[0,-.23,0]);
 box('rear casing wall',9,1.5,.45,teal,[0,.1,3.8]);box('left rim',.45,.7,8,teal,[-4.3,-.1,0]);box('right rim',.45,.7,8,teal,[4.3,-.1,0]);
 // Low front edge and no top cover: every action stays visible.
 box('front cutaway edge',9,.35,.4,teal,[0,-.4,-3.8]);
 box('Pip service platform',3.1,.3,2.5,silver,[-2.7,.05,-2.3]);
 for(let i=0;i<9;i++)box('platform tread',.09,.025,2.1,dark,[-4+i*.32,.215,-2.3]);
 pipe([[-3.8,.5,2.9],[-3.8,1.2,2.9],[-3.4,1.6,2.9],[-1.9,1.6,2.9]],.24,orange);
 for(const x of [-3.7,3.7])for(const z of [-3.5,3.5]){cyl('large mounting bolt',.22,.18,silver,[x,.15,z],null,6);cyl('hex socket',.09,.015,dark,[x,.25,z],null,6);}
 box('gear service stand',3.5,.4,2.8,silver,[-1.8,.1,1]);
 const gear=new TransformNode('removable golden gear',scene);gear.position.set(.75,.12,0);
 cyl('gear body',2.05,.5,gold,[0,0,0],gear);ring('beveled gear face',1.65,.18,gold,[0,.27,0],gear);cyl('silver hub',.62,.65,silver,[0,.1,0],gear);cyl('hub inset',.27,.02,dark,[0,.44,0],gear);
 for(let i=0;i<16;i++){const a=i/16*Math.PI*2;const tooth=box('rounded gear tooth',.55,.48,.64,gold,[Math.sin(a)*2.12,0,Math.cos(a)*2.12],gear);tooth.rotation.y=a;ball('tooth bevel',.22,gold,[Math.sin(a)*2.22,.02,Math.cos(a)*2.22],gear).scaling.y=.85;}
 const dirt=[];for(let i=0;i<PATCH_COUNT;i++){const a=i/16*Math.PI*2,r=.85+Math.floor(i/16)*.53;const m=ball('washable goo',.35,purple,[Math.sin(a)*r,.4,Math.cos(a)*r],gear);m.scaling.set(1.2,.4,1.15);dirt.push(m);}
 const match=ring('matching socket',.65,.075,cyan,[.75,-.05,0]);match.setEnabled(false);box('shaft key',.18,.6,.15,cyan,[.75,.1,.15]);
 ring('machined outer edge',1.98,.055,silver,[0,.265,0],gear);ring('hub trim',.6,.055,silver,[0,.44,0],gear);
 const mark=box('blue alignment mark',.14,.035,.45,cyan,[0,.29,1.7],gear);box('socket alignment mark',.45,.04,.14,cyan,[3.4,.05,0]);
 const secondary=new TransformNode('drive gear',scene);secondary.position.set(2.5,.05,2.5);cyl('drive wheel',.85,.4,gold,[0,0,0],secondary);for(let i=0;i<12;i++){const a=i/12*Math.PI*2;const t=box('drive tooth',.25,.4,.3,gold,[Math.sin(a)*.92,0,Math.cos(a)*.92],secondary);t.rotation.y=a;}cyl('drive shaft',.24,.75,silver,[0,.2,0],secondary);
 const pip=new TransformNode('Pip',scene);pip.position.set(-2.65,.23,-2.15);pip.rotation.y=.9;
 ball('rounded suit',.43,blue,[0,.64,0],pip).scaling.y=1.1;
 const boots=[],hands=[];for(const x of [-.22,.22]){const boot=ball('boot',.23,dark,[x,.16,-.08],pip);boot.scaling.z=1.4;boots.push(boot);hands.push(ball('glove',.18,blue,[x*2,.74,-.15],pip));}
 for(const x of [-.22,.22]){box('boot sole',.4,.08,.52,dark,[x,.045,-.08],pip);ball('shoulder',.21,blue,[x*2,.9,0],pip);}
 ball('large round helmet',.53,blue,[0,1.34,0],pip);const face=ball('wide glass visor',.46,visor,[0,1.33,-.23],pip);face.scaling.set(1,.6,.65);const glint=ball('visor highlight',.14,white,[-.19,1.44,-.49],pip);glint.scaling.set(1,.2,.3);
 const trim=ball('visor silver rim',.48,silver,[0,1.33,-.19],pip);trim.scaling.set(1,.65,.65);
 box('helmet stripe',.13,.06,.65,white,[0,1.83,0],pip);
 box('white cleaning backpack',.57,.64,.28,white,[0,.73,.38],pip);cyl('backpack tank',.16,.58,cyan,[.22,.75,.5],pip);const nozzle=box('spray gun',.18,.18,.58,orange,[.42,.8,-.48],pip);
 const stream=MeshBuilder.CreateLines('spray',{points:[Vector3.Zero(),Vector3.Zero()],updatable:true},scene);stream.color=new Color3(.5,.95,1);stream.isPickable=false;
 const arms=[-1,1].map(sign=>({upper:cyl('sleeve',.13,.4,blue,[sign*.43,.8,0],pip),fore:cyl('forearm cuff',.12,.35,white,[sign*.44,.7,-.1],pip)}));
 const wet=mat('wet gear sheen','#b8f5ff',.9);wet.alpha=.2;const wetSpot=cyl('wet spray impact',.3,.012,wet,[0,.42,0],gear);
 const splashes=Array.from({length:12},()=>ball('impact splash',.045,cyan,[0,-5,0]));
 const drops=Array.from({length:36},()=>ball('droplet',.035,cyan,[0,-5,0]));
 const hit=MeshBuilder.CreateDisc('gear touch surface',{radius:2.5,tessellation:48,sideOrientation:2},scene);hit.rotation.x=Math.PI/2;hit.position.set(.75,.6,0);hit.visibility=0;hit.isPickable=true;
 function resize(){engine.resize();const aspect=canvas.clientWidth/canvas.clientHeight;camera.radius=aspect<.8?22:17;camera.target.set(0,.2,0);}
 resize();
 return {setQuality(high){engine.setHardwareScalingLevel(high?1/Math.min(2,globalThis.devicePixelRatio||1):1);engine.resize();},dispose(){scene.dispose();engine.dispose();},scene,resize,pick(x,y){const h=scene.pick(x,y,m=>m===hit);if(!h?.hit)return null;const v=h.pickedPoint;return {x:v.x,z:v.z};},render(t,spraying,target){
 gear.position.set(state.gear.x,state.gear.y,state.gear.z);gear.rotation.y=state.phase==='running'?t*.7:state.angle;
 secondary.rotation.y=state.phase==='running'?-t*1.7:0;match.setEnabled(state.phase==='fit');
 dirt.forEach((m,i)=>{m.setEnabled(state.dirt[i]>.02);m.scaling.y=.4*state.dirt[i];m.scaling.x=1.2*Math.sqrt(state.dirt[i]);m.scaling.z=1.15*Math.sqrt(state.dirt[i]);});
 const worker=state.worker;pip.position.set(worker.x,.23+(worker.walk?Math.abs(Math.sin(t*9))*.07:0),worker.z);pip.rotation.y=worker.yaw;boots.forEach((b,i)=>{b.position.z=-.08+Math.sin(t*9+i*Math.PI)*.2*worker.walk;b.position.y=.16+Math.max(0,Math.sin(t*9+i*Math.PI))*.12*worker.walk;});hands.forEach((h,i)=>{h.position.y=.74+worker.arms*1.1;h.position.z=-.15-worker.arms*.38;const shoulder=new Vector3(i===0?-.44:.44,.94,0),elbow=Vector3.Lerp(shoulder,h.position,.5);elbow.x+=i===0?-.12:.12;for(const [mesh,a,b] of [[arms[i].upper,shoulder,elbow],[arms[i].fore,elbow,h.position]]){mesh.position=Vector3.Lerp(a,b,.5);mesh.scaling.y=Vector3.Distance(a,b)/.4;mesh.rotation.x=Math.atan2(b.z-a.z,b.y-a.y);}});nozzle.setEnabled(!state.job);
 const a=nozzle.getAbsolutePosition(),b=new Vector3(target?.x??.75,.55,target?.z??0);wetSpot.setEnabled(spraying);if(spraying){wetSpot.position.x=b.x-gear.position.x;wetSpot.position.z=b.z-gear.position.z;}splashes.forEach((m,i)=>{m.setEnabled(spraying);if(spraying){const q=(t*3+i/12)%1,a=i*2.4;m.position.set(b.x+Math.cos(a)*q*.42,.55+Math.sin(q*Math.PI)*.3,b.z+Math.sin(a)*q*.42);}});stream.setEnabled(spraying);if(spraying)MeshBuilder.CreateLines('spray',{points:[a,b],instance:stream});drops.forEach((m,i)=>{m.setEnabled(spraying);if(spraying){const q=(t*1.8+i/36)%1;m.position=Vector3.Lerp(a,b,q);m.position.x+=Math.sin(i*14+t*8)*q*.28;m.position.z+=Math.cos(i*9+t*7)*q*.28;m.position.y+=Math.sin(q*Math.PI)*.15;}});scene.render();}};
}
