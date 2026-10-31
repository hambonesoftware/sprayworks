import test from 'node:test';
import assert from 'node:assert/strict';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine.js';
import { createGame,command,tick } from '../src/simulation.js';
import { createWorld } from '../src/world.js';
test('3D scene builds, projects, animates cleaning and restart without GPU',()=>{
  const oldWindow=globalThis.window;
  globalThis.window={devicePixelRatio:1,addEventListener(){},removeEventListener(){}};
  const engine=new NullEngine({renderWidth:1280,renderHeight:800,textureSize:256,deterministicLockstep:false,lockstepMaxSteps:4});
  // Texture drawing is stubbed only; geometry, materials, transforms and Babylon render traversal are real.
  engine.createCanvas=()=>({width:256,height:256,getContext:()=>({fillRect(){},clearRect(){},fillText(){},beginPath(){},ellipse(){},fill(){}})});
  const g=createGame();let world;
  try{world=createWorld({clientWidth:1280,clientHeight:800},g,engine);world.render(0,0);const p=world.project(2,2,-2);assert(Number.isFinite(p.x)&&Number.isFinite(p.y));assert(p.visible);command(g,2,'guard');for(let i=0;i<100;i++)tick(g,.1);world.render(10,0);for(const id of Object.keys(g.progress))g.progress[id]=1;g.angle=90;g.running=true;world.render(20,3);world.zoom(-2);world.pan(10,10);world.resize();world.render(21,4);assert.equal(world.kind,'3d');}finally{world?.dispose();globalThis.window=oldWindow;}
});
