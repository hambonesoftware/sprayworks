import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,emit,stepState,stepParticle,RATE} from './physics.js';
function seeded(){let n=347;return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
function run(s,target,seconds,pattern='jet',pressure=.65){const random=seeded();let particles=[],budget=0;for(let i=0;i<seconds*120;i++){stepState(s,1/120);budget+=RATE/120;while(budget>=1){let p=emit(s,target,pressure,pattern,random);if(p)particles.push(p);budget--;}particles=particles.filter(p=>!stepParticle(p,s,1/120));}return s;}
test('closed gate prevents collecting from a frontal spray',()=>{let s=createState();run(s,{x:3,y:1.66,z:0},5);assert.equal(s.collected,0);assert.equal(s.open,false);});
test('wheel then funnel challenge is winnable with supply remaining',()=>{let s=createState();run(s,{x:-1.6,y:3.48,z:0},8);assert.ok(s.open,'wheel must unlock gate');run(s,{x:3,y:1.66,z:0},9);assert.ok(s.won,'receiver must reach target');assert.ok(s.supply>10,'leave a meaningful supply margin');assert.ok(s.captured<=s.emitted,'never create liquid');console.log('Challenge: '+JSON.stringify({supply:s.supply,collected:s.collected,charge:s.charge}));});
test('hub hits create less torque than paddle tips',()=>{let tip=createState(),hub=createState();run(tip,{x:-1.6,y:3.48,z:0},1);run(hub,{x:-1.6,y:2.45,z:0},1);assert.ok(Math.abs(tip.omega)>Math.abs(hub.omega)*2);});
test('free play does not consume supply',()=>{let s=createState(true);run(s,{x:3,y:1.66,z:0},20,'cone');assert.equal(s.supply,100);assert.ok(s.collected>0);});
test('supply is never negative and particles stop emitting',()=>{let s=createState();s.supply=.005;assert.equal(emit(s,{x:0,y:1,z:0},1,'jet'),null);assert.ok(s.supply>=0);});
test('a fast droplet cannot tunnel through a gate',()=>{let s=createState(),p={x:3,y:2,z:2.1,vx:0,vy:0,vz:-100,life:3,volume:.01};assert.equal(stepParticle(p,s,.02),'gate');});
