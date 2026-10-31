import { Engine } from '@babylonjs/core/Engines/engine.js';
import { Scene } from '@babylonjs/core/scene.js';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color.js';
import { Vector3, Matrix } from '@babylonjs/core/Maths/math.vector.js';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera.js';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight.js';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight.js';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import pumpMeshes from './pump-meshes.json' with { type: 'json' };
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData.js';
import { Mesh } from '@babylonjs/core/Meshes/mesh.js';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture.js';
import '@babylonjs/core/Culling/ray.js';
import { CREW, TASKS, OBSTACLES } from './simulation.js';
const C=hex=>Color3.FromHexString(hex);
export function createWorld(canvas,game,providedEngine=null){
  const engine=providedEngine||new Engine(canvas,true,{preserveDrawingBuffer:false,stencil:true,antialias:true,adaptToDeviceRatio:false});
  engine.setHardwareScalingLevel(Math.max(1,window.devicePixelRatio/1.5));
  const scene=new Scene(engine);scene.clearColor=new Color4(.045,.095,.11,1);scene.ambientColor=C('#527b80');scene.fogMode=Scene.FOGMODE_EXP2;scene.fogDensity=.012;scene.fogColor=C('#142e35');
  const camera=new ArcRotateCamera('camera',Math.PI/2- .42, .70,29,new Vector3(0,.1,0),scene);camera.lowerRadiusLimit=18;camera.upperRadiusLimit=47;camera.minZ=.1;camera.fov=.72;camera.inputs.clear();
  const hemi=new HemisphericLight('sky',new Vector3(0,1,0),scene);hemi.intensity=1.4;hemi.groundColor=C('#304849');
  const sun=new DirectionalLight('worklight',new Vector3(-.4,-1,.5),scene);sun.position=new Vector3(5,18,-10);sun.intensity=1.8;sun.diffuse=C('#fff0d0');
  const shadows=new ShadowGenerator(1024,sun);shadows.useBlurExponentialShadowMap=true;shadows.blurKernel=20;shadows.setDarkness(.25);
  const materials={};
  function mat(name,hex,metal=0,alpha=1){if(materials[name])return materials[name];const m=new StandardMaterial(name,scene);m.diffuseColor=C(hex);m.specularColor=new Color3(metal,metal,metal);m.specularPower=metal?64:20;m.alpha=alpha;materials[name]=m;return m;}
  const steel=mat('steel','#abc3c4',.7), dark=mat('dark','#263c43',.35),yellow=mat('yellow','#efae38',.4),teal=mat('teal','#27a6aa',.35),black=mat('rubber','#10232b'),floor=mat('floor','#537b83',.25),edge=mat('edge','#1a343a',.3),chrome=mat('chrome','#d2dcd7',.8),orange=mat('orange','#e9913b',.3),glass=mat('visor','#142c37',.8),white=mat('white','#e5eee6',.4),oil=mat('oil','#30291b',.7),water=mat('water','#90f5f3',.1,.65);
  const glow=mat('glow','#69edec');glow.emissiveColor=C('#39aaab');
  const green=mat('green','#74f4bc');green.emissiveColor=C('#237d54');
  const statics=[];
  function finish(mesh,m,pos,parent=null,dynamic=false){mesh.material=m;if(pos)mesh.position.set(...pos);if(parent)mesh.parent=parent;mesh.isPickable=false;mesh.receiveShadows=true;if(!parent&&!dynamic)statics.push(mesh);return mesh;}
  function box(name,w,h,d,m,pos,parent=null,dynamic=false){return finish(MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene),m,pos,parent,dynamic);}
  function cadPart(name,material,parent=null){
    const data=pumpMeshes[name],mesh=new Mesh('CC0 pump '+name,scene),vertex=new VertexData();
    vertex.positions=data.positions;vertex.indices=data.indices;vertex.normals=[];vertex.uvs=new Array(data.positions.length/3*2).fill(0);
    VertexData.ComputeNormals(vertex.positions,vertex.indices,vertex.normals);vertex.applyToMesh(mesh);
    return finish(mesh,material,[0,0,0],parent);
  }
  function sphere(name,d,m,pos,parent=null,dynamic=false){return finish(MeshBuilder.CreateSphere(name,{diameter:d,segments:10},scene),m,pos,parent,dynamic);}
  function cyl(name,r,h,m,pos,parent=null,dynamic=false,segments=24){return finish(MeshBuilder.CreateCylinder(name,{diameter:r*2,height:h,tessellation:segments},scene),m,pos,parent,dynamic);}
  function ring(name,r,t,m,pos,parent=null,dynamic=false){return finish(MeshBuilder.CreateTorus(name,{diameter:r*2,thickness:t,tessellation:40},scene),m,pos,parent,dynamic);}
  function pipe(name,points,r,m){return finish(MeshBuilder.CreateTube(name,{path:points.map(p=>new Vector3(...p)),radius:r,tessellation:12},scene),m,null);}
  function label(text,w,h,pos,rotation=0,bg='#203a40',fg='#e6dec7'){
    const tex=new DynamicTexture('label '+text,{width:512,height:128},scene,false);const ctx=tex.getContext();ctx.fillStyle=bg;ctx.fillRect(0,0,512,128);ctx.fillStyle=fg;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 40px sans-serif';ctx.fillText(text,256,65);tex.update();const m=new StandardMaterial('sign',scene);m.diffuseTexture=tex;m.emissiveColor=new Color3(.3,.3,.3);m.specularColor=Color3.Black();const plane=MeshBuilder.CreatePlane(text,{width:w,height:h,sideOrientation:Mesh.DOUBLESIDE},scene);plane.material=m;plane.position.set(...pos);plane.rotation.x=rotation;plane.isPickable=false;return plane;
  }
  // One oversized machine casing. No factory building, floor tiles or gantry.
  const casing=cyl('lower pump shell',8.2,.8,yellow,[0,-.6,0],null,false,64);casing.scaling.x=1.4;
  const inner=cyl('concave internal floor',7.9,.16,dark,[0,-.12,0],null,false,64);inner.scaling.x=1.4;
  const enamel=cyl('enamel sump floor',7.65,.12,teal,[0,-.05,0],null,false,64);enamel.scaling.x=1.4;
  const gasket=ring('giant black O-ring',8,.24,black,[0,.03,0]);gasket.scaling.x=1.4;
  const rim=ring('machined rim',8.2,.20,chrome,[0,.08,0]);rim.scaling.x=1.4;
  // Imported CC0 volute: shallow axial section opens the actual pump cavity.
  const importedCasing=cadPart('casing',yellow);importedCasing.position.y=-.1;
  for(let i=0;i<22;i++){const a=i/22*Math.PI*2,x=Math.cos(a)*10.9,z=Math.sin(a)*7.75;
    cyl('oversized hex bolt',.28,.23,chrome,[x,.27,z],null,false,6);cyl('bolt socket',.11,.025,dark,[x,.4,z],null,false,6);
  }
  // Recessed channels and cast ribs run across the internal sump, not pedestrian walkways.
  for(const z of [-5.4,5.7]){pipe('cast internal rib',[[-6,.08,z],[6,.08,z]],.09,steel);}
  for(let i=0;i<5;i++)box('oil drain channel',.12,.03,3.4,dark,[-3.5+i*.35,.04,-.5]);
  pipe('coolant channel',[[-8,.12,-1],[-8,.12,-4.6],[-1,.12,-4.6]],.18,steel);
  const walk=MeshBuilder.CreateGround('walkable inside casing',{width:22,height:16},scene);walk.position.y=.05;walk.visibility=0;walk.isPickable=true;walk.metadata={floor:true};
  // Inlet bore: a huge threaded tunnel in the back wall.
  const port=cyl('inlet tunnel',1.6,.6,black,[-6.4,1.6,-6.1]);port.rotation.x=Math.PI/2;
  for(const z of [-6.4,-6.15,-5.9]){const r=ring('inlet thread',1.6,.17,steel,[-6.4,1.6,z]);r.rotation.x=Math.PI/2;}
  label('PUMP 07 / INTERNAL SERVICE',4.3,.6,[.1,2.2,-6.2]);
  label('FLOW →',1.6,.35,[-4,.09,-4.4],Math.PI/2,'#218b91','#baf9ef');
  // Filter slot and removable cartridge, huge relative to the crew.
  box('filter socket',3.5,.3,2.7,black,[-5.8,.15,-2.8]);
  for(const x of [-7.4,-4.2])box('filter guide',.17,.65,2.7,chrome,[x,.34,-2.8]);
  box('blue filter key',.3,.12,2.3,glow,[-7.4,.73,-2.8]);
  const filterPart=new TransformNode('removable filter',scene);
  box('filter frame',3,.24,2.2,chrome,[0,.18,0],filterPart);
  box('filter backing',2.7,.07,1.9,dark,[0,.32,0],filterPart);
  for(let i=0;i<12;i++)box('filter pleat',.12,.24,1.8,steel,[-1.23+i*.225,.47,0],filterPart);
  box('filter blue key',.16,.14,2,glow,[-1.43,.4,0],filterPart);
  // An empty circular bearing seat, the rotor fits into it from above.
  cyl('rotor bearing seat',2.2,.2,black,[2,.12,-2]);ring('seat lip',2.2,.18,chrome,[2,.28,-2]);
  cyl('exposed shaft',.24,1.1,steel,[2,.55,-2]);
  const impeller=new TransformNode('removable impeller',scene);
  cadPart('impeller',chrome,impeller);
  const rotorMark=box('rotor blue arrow',.14,.04,.65,glow,[0,.77,1.3],impeller);
  box('90 degree matching arrow',.65,.05,.17,glow,[4.4,.32,-2]);
  label('90° →',1.3,.45,[4.6,.13,-1],Math.PI/2,'#173f4a','#75eef9');
  // The access guard is removed as a real object, then replaced with a window.
  const guard=new TransformNode('access cover',scene);
  const importedCover=cadPart('cover',teal,guard);importedCover.scaling.set(1,.6,.6);
  // Trays are attached inside the machine's service opening, not an exterior workshop.
  box('blue wash tray',3.3,.35,1.7,steel,[-6,.18,3.6]);box('blue tray insert',3,.06,1.4,teal,[-6,.4,3.6]);
  for(const x of [-7.65,-4.35])box('tray raised edge',.1,.25,1.7,glow,[x,.45,3.6]);
  label('FILTER / WASH',2.7,.4,[-6,.13,5],Math.PI/2,'#133b47','#84e8ef');
  box('rotor cradle',2.9,.35,2.3,yellow,[5.9,.18,3.4]);for(const x of [4.75,7.05])box('cradle rubber',.22,.3,2,black,[x,.5,3.4]);
  label('ROTOR / WASH',2.5,.4,[5.9,.13,5.1],Math.PI/2,'#79501c','#fff0bd');
  // Service hatch and inset test panel establish the crew's arrival point and scale.
  const hatch=ring('service hatch opening',1.3,.18,steel,[-8.3,.1,5.2]);hatch.scaling.x=1.4;
  box('test panel',1.6,.3,1.3,dark,[8,.2,.6]);const lamp=cyl('start lamp',.24,.08,orange,[8,.43,.55],null,true);
  label('TEST',1.25,.35,[8,.1,1.7],Math.PI/2,'#143c45','#b9f2e7');
  // Embedded pressure dial, animated after a successful rebuild.
  const gauge=cyl('pressure dial',.7,.2,chrome,[7.3,2,-5]);gauge.rotation.x=Math.PI/2;
  const face=cyl('dial face',.6,.03,white,[7.3,2,-4.88]);face.rotation.x=Math.PI/2;
  const needle=new TransformNode('pressure needle',scene);needle.position.set(7.3,2,-4.83);box('needle',.04,.48,.03,orange,[0,.2,0],needle);
  // Moving coolant beads run through an internal channel once the machine is fixed.
  const flow=Array.from({length:14},()=>{const p=sphere('coolant flow',.13,glow,[0,0,0],null,true);p.setEnabled(false);return p;});
  function grime(name,parent,count,rx,rz){return Array.from({length:count},(_,i)=>{const x=Math.sin(i*29.3)*rx,z=Math.cos(i*47.9)*rz;const blob=sphere(name,.35+(i%4)*.14,i%3?oil:mat('amber grime','#695124',.65),[x,.6+(i%3)*.025,z],parent,!parent);blob.scaling.y=.15;return blob;});}
  const filterDirt=grime('filter grease',filterPart,42,1.35,.85),rotorDirt=grime('rotor grease',impeller,45,1.4,1.4);
  const chamberDirt=grime('chamber sludge',null,60,2.0,1.6);chamberDirt.forEach(p=>{p.position.x+=2;p.position.z-=2;p.position.y=.28;});
  const puddles=grime('sump oil',null,26,1.5,.8);puddles.forEach(p=>{p.position.x-=2.7;p.position.z+=.4;p.position.y=.07;});
  function showDirt(meshes,p){meshes.forEach((mesh,i)=>mesh.setEnabled(i/meshes.length>=p&&p<1));}
  const slots={filter:new Vector3(-5.8,.1,-2.8),rotor:new Vector3(2,.1,-2)},trays={filter:new Vector3(-6,.45,3.6),rotor:new Vector3(5.9,.45,3.4)};
  function partPosition(part){const out=part==='filter'?'filter-out':'rotor-out',inside=part==='filter'?'filter-in':'rotor-in';const worker=game.crew.find(c=>[out,inside].includes(c.job?.id)&&c.job.delivering);if(worker)return new Vector3(worker.x,1.25,worker.z);if(game.progress[inside]>=1)return slots[part];if(game.progress[out]>=1)return trays[part];const extracting=game.crew.find(c=>c.job?.id===out&&!c.path.length);return extracting?slots[part].add(new Vector3(0,game.progress[out]*.7,0)):slots[part];}
  // Five small, animated crew silhouettes with helmets, backpacks and role tools.
  const crewMeshes=game.crew.map(c=>{
    const root=new TransformNode('crew '+c.id,scene),suit=mat('suit '+c.role,c.color,.2);root.position.set(c.x,0,c.z);
    const body=box('suit',.43,.5,.3,suit,[0,.6,0],root);sphere('helmet',.51,white,[0,1.03,0],root);box('helmet stripe',.1,.08,.48,suit,[0,1.27,0],root);const visor=sphere('visor',.4,glass,[0,1.04,.16],root);visor.scaling.set(1,.65,.55);box('helmet lamp',.12,.09,.09,glow,[.19,1.14,.19],root);
    box('belt',.47,.08,.33,dark,[0,.38,0],root);box('pack',.3,.44,.18,steel,[0,.64,-.24],root);cyl('pack tank',.12,.42,suit,[.16,.67,-.27],root);
    const legs=[];for(const side of [-1,1]){const leg=new TransformNode('leg',scene);leg.parent=root;leg.position.set(side*.13,.35,0);box('trouser',.17,.24,.19,suit,[0,-.1,0],leg);box('boot',.2,.14,.3,black,[0,-.28,.04],leg);legs.push(leg);sphere('shoulder',.2,suit,[side*.3,.78,.015],root);const arm=box('arm',.15,.31,.15,suit,[side*.3,.61,.12],root);arm.rotation.x=-.5;sphere('glove',.16,black,[side*.3,.48,.2],root);}
    const tool=box('tool',c.role==='mechanic'?.12:.16,.12,.48,c.role==='mechanic'?chrome:dark,[.28,.5,.38],root);if(c.role==='vacuum'){tool.scaling.z=1.6;const hose=MeshBuilder.CreateTube('hose',{path:[new Vector3(.15,.7,-.25),new Vector3(.5,.3,-.1),new Vector3(.28,.48,.4)],radius:.055,tessellation:8},scene);hose.parent=root;hose.material=black;hose.isPickable=false;}
    const selection=ring('selection',.52,.045,glow,[0,.045,0],root);selection.setEnabled(false);
    const pick=MeshBuilder.CreateSphere('worker target',{diameter:1.3,segments:6},scene);pick.parent=root;pick.position.y=.6;pick.visibility=0;pick.isPickable=true;pick.metadata={worker:c.id};
    root.getChildMeshes().filter(m=>m!==pick&&m!==selection).forEach(m=>shadows.addShadowCaster(m));
    return {root,selection,legs,tool};
  });
  // Static parts are merged by material to keep the scene light on phones.
  for(const m of Object.values(materials)){const group=statics.filter(mesh=>mesh.material===m&&!mesh.isDisposed());if(group.length>1){const merged=Mesh.MergeMeshes(group,true,true,undefined,false,false);if(merged){merged.isPickable=false;merged.receiveShadows=true;shadows.addShadowCaster(merged);}}}
  const droplets=Array.from({length:75},()=>{const p=sphere('spray particle',.045,water,[0,0,0],null,true);p.setEnabled(false);return p;});
  const pathLine=MeshBuilder.CreateLines('order path',{points:[Vector3.Zero(),new Vector3(0,.04,.01)],updatable:true},scene);pathLine.dispose();let routeMesh=null,routeKey='';
  let width=0,height=0;
  function resize(){engine.resize();width=canvas.clientWidth;height=canvas.clientHeight;camera.fov=width<650?1.08:.76;}
  resize();
  return {
    kind:'3d',resize,
    project(x,y,z){const p=Vector3.Project(new Vector3(x,y,z),Matrix.Identity(),scene.getTransformMatrix(),camera.viewport.toGlobal(engine.getRenderWidth(),engine.getRenderHeight()));return {x:p.x*canvas.clientWidth/engine.getRenderWidth(),y:p.y*canvas.clientHeight/engine.getRenderHeight(),visible:p.z>0&&p.z<1};},
    pick(x,y){const pick=scene.pick(x,y,m=>!!m.metadata);if(pick?.hit){if(pick.pickedMesh.metadata.task)return {task:pick.pickedMesh.metadata.task};if(pick.pickedMesh.metadata.worker!==undefined)return {worker:pick.pickedMesh.metadata.worker};return {x:pick.pickedPoint.x,z:pick.pickedPoint.z};}const ray=scene.createPickingRay(x,y,Matrix.Identity(),camera);const t=-ray.origin.y/ray.direction.y;return t>0?{x:ray.origin.x+ray.direction.x*t,z:ray.origin.z+ray.direction.z*t}:null;},
    pan(dx,dy){const scale=camera.radius/700;camera.target.x-=dx*scale;camera.target.z+=dy*scale;camera.target.x=Math.max(-7,Math.min(7,camera.target.x));camera.target.z=Math.max(-5,Math.min(5,camera.target.z));},
    zoom(delta){camera.radius=Math.max(18,Math.min(47,camera.radius+delta));},
    focus(c){camera.target.set(c.x,.1,c.z);},home(){camera.target.set(0,.1,0);camera.radius=29;},
    render(time,selected){
      showDirt(filterDirt,game.progress['wash-filter']);showDirt(rotorDirt,game.progress['wash-rotor']);showDirt(chamberDirt,game.progress['wash-housing']);showDirt(puddles,game.progress.vacuum);
      for(const [root,task] of [[filterPart,game.progress['filter-out']<1?'filter-out':game.progress['wash-filter']<1?'wash-filter':'filter-in'],[impeller,game.progress['rotor-out']<1?'rotor-out':game.progress['wash-rotor']<1?'wash-rotor':'rotor-in'],[guard,game.progress.guard<1?'guard':'seal']])for(const mesh of root.getChildMeshes()){mesh.metadata={task};mesh.isPickable=true;}
      filterPart.position.copyFrom(partPosition('filter'));impeller.position.copyFrom(partPosition('rotor'));
      const open=game.progress.guard,closed=game.progress.seal;guard.position.set(-open*(1-closed)*2, .65+open*(1-closed)*.3, .5-open*(1-closed)*6);guard.rotation.x=-open*(1-closed)*.3;
      flow.forEach((p,i)=>{p.setEnabled(game.running);const f=(time*.2+i/14)%1;p.position.set(-8+f*7,.33,-4.6);});
      impeller.rotation.y=-game.angle*Math.PI/180+(game.running?time*2.4:0);needle.rotation.z=game.running?-1.05:1.7;lamp.material=game.running?green:orange;
      let particle=0;
      game.crew.forEach((c,i)=>{const visual=crewMeshes[i];visual.root.position.set(c.x,0,c.z);visual.root.rotation.y=c.facing;visual.selection.setEnabled(i===selected);const walking=c.path.length>0;visual.legs.forEach((leg,n)=>leg.rotation.x=walking?Math.sin(time*12+n*Math.PI)*.55:0);visual.root.position.y=walking?Math.abs(Math.sin(time*12))*.035:0;
        if(c.job&&!c.job.delivering&&!walking&&['Spraying','Collecting','Removing','Refitting'].includes(c.status)){
          const target=TASKS.find(t=>t.id===c.job.id),isVac=c.role==='vacuum';
          for(let j=0;j<15&&particle<droplets.length;j++){const p=droplets[particle++];p.setEnabled(true);const f=(time*(isVac?.8:1.8)+j/15)%1,frac=isVac?1-f:f;const spread=Math.sin(j*21)*.2*frac;
            p.position.set(c.x+(target.tx-c.x)*frac+spread,.65+(target.ty-.65)*frac+Math.sin(frac*Math.PI)*.18,c.z+(target.tz-c.z)*frac+Math.cos(j*17)*.13*frac);p.material=isVac?oil:c.role==='mechanic'?yellow:water;
          }
        }
      });for(;particle<droplets.length;particle++)droplets[particle].setEnabled(false);
      const c=game.crew[selected],k=c.path.map(p=>p.x+','+p.z).join(';');if(k!==routeKey){routeMesh?.dispose();routeKey=k;if(c.path.length){routeMesh=MeshBuilder.CreateDashedLines('route',{points:[new Vector3(c.x,.055,c.z),...c.path.map(p=>new Vector3(p.x,.055,p.z))],dashSize:.18,gapSize:.12,dashNb:55},scene);routeMesh.color=C('#6ce4eb');routeMesh.isPickable=false;}else routeMesh=null;}
      scene.render();
    },dispose(){engine.dispose();}
  };
}
