import test from 'node:test';
import assert from 'node:assert/strict';
import {NullEngine} from '@babylonjs/core/Engines/nullEngine.js';
import {createClockWorld} from '../src/clock-world.js';
test('clock diorama renders authoritative positions and quality modes without GPU',()=>{
 globalThis.window={addEventListener(){},removeEventListener(){}};globalThis.devicePixelRatio=3;
 const engine=new NullEngine({renderWidth:390,renderHeight:844});let scale;const set=engine.setHardwareScalingLevel.bind(engine);engine.setHardwareScalingLevel=v=>{scale=v;set(v);};
 const state={workers:[{id:'a',name:'A',x:-2,z:-3,color:'#40bdca',status:'washing',job:{kind:'clean',phase:'work',part:'p'}}],parts:[{id:'p',x:1,y:.3,z:-1,size:.7,dirt:1}],slots:[{id:'s',x:0,z:1,size:.7}],running:false};
 const world=createClockWorld({clientWidth:390,clientHeight:844},state,engine);
 try{assert.equal(scale,.5);world.setQuality(false);assert.equal(scale,1);world.setQuality(true);assert.equal(scale,.5);world.render(1,0);assert(world.scene.getMeshByName('spray droplet').isEnabled());state.parts[0].x=2;state.parts[0].dirt=0;state.running=true;world.render(2,0);assert.equal(world.scene.getTransformNodeByName('gear p').position.x,2);assert.equal(world.scene.getTransformNodeByName('revealed gear symbol').isEnabled(),true);assert(world.scene.getMeshByName('walkable clock plate').isPickable);assert(world.scene.meshes.some(m=>m.metadata?.target?.type==='test'));assert(world.scene.meshes.length>70);}finally{world.dispose();delete globalThis.window;delete globalThis.devicePixelRatio;}
});
