import test from 'node:test';
import assert from 'node:assert/strict';
import {createClock,commandClock,tickClock,resetClock,progressClock} from '../src/clock-state.js';
const finish=s=>{for(let i=0;i<300 && s.workers.some(w=>w.job);i++)tickClock(s,.1);assert.ok(s.workers.every(w=>!w.job));};
const order=(s,id,target)=>{assert.equal(commandClock(s,id,target),true,s.message);finish(s);};
const cleanAll=s=>{for(const p of s.parts)order(s,0,{type:'part',id:p.id});};
const fitGear=(s,i)=>{const p=s.parts[i];if(p.id===s.heavyGear){order(s,1,{type:'part',id:p.id});}else{order(s,i,{type:'part',id:p.id});order(s,i,{type:'slot',id:s.slots[i].id});}};
test('initial puzzle has three dirty distinct marked gears and matching shafts',()=>{const s=createClock();assert.equal(s.parts.length,3);assert.equal(new Set(s.parts.map(p=>p.mark)).size,3);assert.ok(s.parts.every(p=>p.dirt===1));assert.deepEqual(s.parts.map(p=>p.mark),s.slots.map(p=>p.mark));});
test('orders animate movement and cleaning; wrong crew cannot alter a part',()=>{const s=createClock(),p=s.parts[2],before=structuredClone(p);assert.equal(commandClock(s,1,{type:'part',id:p.id}),false);assert.deepEqual(p,before);const w=s.workers[0],x=w.x,z=w.z;assert.ok(commandClock(s,0,{type:'part',id:p.id}));assert.equal(w.x,x);assert.equal(w.z,z);tickClock(s,100);assert.ok(Math.hypot(w.x-x,w.z-z)<=.266);assert.equal(p.dirt,1);finish(s);assert.equal(p.dirt,0);assert.equal(w.carrying,null);});
test('carried gear follows walking worker and invalid orders preserve current job',()=>{const s=createClock();cleanAll(s);order(s,1,{type:'part',id:s.parts[0].id});const w=s.workers[1],p=s.parts[0];assert.equal(p.carrier,1);assert.ok(commandClock(s,1,{type:'slot',id:s.slots[0].id}));const j=w.job;assert.equal(commandClock(s,1,{type:'floor',x:4,z:3}),false);assert.equal(w.job,j);tickClock(s,.1);assert.equal(p.x,w.x);assert.equal(p.z,w.z);finish(s);assert.equal(p.slot,s.slots[0].id);assert.equal(w.carrying,null);});
test('full solve requires all three marks and an explicit successful test',()=>{const s=createClock();assert.equal(commandClock(s,0,{type:'test'}),false);cleanAll(s);for(let i=0;i<3;i++){fitGear(s,i);}assert.equal(s.running,false);assert.equal(progressClock(s).matched,3);assert.equal(commandClock(s,0,{type:'test'}),false);assert.ok(s.liftPowered);order(s,0,{type:'lift'});order(s,0,{type:'bell'});assert.ok(commandClock(s,0,{type:'test'}));assert.equal(s.running,true);assert.equal(progressClock(s).solved,true);resetClock(s);assert.equal(s.running,false);assert.equal(progressClock(s).cleaned,0);});
test('incorrect shaft remains unpowered until the crew corrects it',()=>{
 const s=createClock();cleanAll(s);
 order(s,1,{type:'part',id:s.parts[0].id});order(s,1,{type:'slot',id:s.slots[1].id});
 order(s,1,{type:'part',id:s.parts[1].id});order(s,1,{type:'slot',id:s.slots[0].id});
 fitGear(s,2);
 assert.equal(progressClock(s).matched,1);
 assert.equal(s.liftPowered,false);
 assert.equal(commandClock(s,0,{type:'test'}),false);
 assert.match(s.message,/wrong gear/);
 for(let i=0;i<2;i++){
  order(s,1,{type:'part',id:s.parts[i].id});
  order(s,1,{type:'floor',x:s.parts[i].home.x,z:s.parts[i].home.z});
 }
 fitGear(s,0);fitGear(s,1);
 assert.equal(s.liftPowered,true);
 order(s,0,{type:'lift'});
 order(s,0,{type:'bell'});
 assert.ok(commandClock(s,0,{type:'test'}));
});
test('pause freezes jobs and concurrent crew cannot claim the same part',()=>{const s=createClock();cleanAll(s);assert.ok(commandClock(s,1,{type:'part',id:s.parts[0].id}));assert.equal(commandClock(s,2,{type:'part',id:s.parts[0].id}),false);s.paused=true;const before=structuredClone(s.workers[1]);tickClock(s,.1);assert.deepEqual(s.workers[1],before);s.paused=false;finish(s);});

test('pickup and placement lift and lower continuously, and pause freezes height',()=>{
  const s=createClock();cleanAll(s);const p=s.parts[0],w=s.workers[0];
  assert.ok(commandClock(s,0,{type:'part',id:p.id}));
  while(w.job.phase==='walk')tickClock(s,.1);
  tickClock(s,.1);assert.ok(p.y>.18 && p.y<.72);
  s.paused=true;const lifted=p.y;tickClock(s,.1);assert.equal(p.y,lifted);s.paused=false;finish(s);
  assert.equal(p.y,.72);
  assert.ok(commandClock(s,0,{type:'slot',id:s.slots[0].id}));
  while(w.job.phase==='walk')tickClock(s,.1);
  tickClock(s,.1);assert.ok(p.y>.4 && p.y<.72);
  s.paused=true;const lowered=p.y;tickClock(s,.1);assert.equal(p.y,lowered);s.paused=false;finish(s);assert.equal(p.y,.4);
});

test('Wake the Cuckoo unlocks an elevator, bell cleanup and animated finale in sequence',()=>{const s=createClock();assert.equal(commandClock(s,0,{type:'lift'}),false);assert.equal(commandClock(s,0,{type:'bell'}),false);cleanAll(s);for(let i=0;i<3;i++)fitGear(s,i);assert.equal(s.liftPowered,true);assert.equal(commandClock(s,0,{type:'test'}),false);order(s,0,{type:'lift'});assert.equal(s.upperReached,true);assert.equal(commandClock(s,1,{type:'bell'}),false);order(s,0,{type:'bell'});assert.equal(s.bellClean,true);assert.ok(commandClock(s,0,{type:'test'}));tickClock(s,.1);assert.ok(s.finaleTime>0);});

test('heavy star gear requires two available workers and synchronizes both grips',()=>{
 const s=createClock();cleanAll(s);const gear=s.parts[2];assert.equal(commandClock(s,0,{type:'part',id:gear.id}),false);
 assert.ok(commandClock(s,1,{type:'part',id:gear.id}));assert.ok(s.teamCarry);assert.equal(s.workers[1].job.kind,'team');assert.equal(s.workers[2].job.kind,'team');
 let sawBrace=false,sawCarry=false,sawLower=false;
 for(let i=0;i<350&&s.teamCarry;i++){tickClock(s,.1);if(s.teamCarry?.phase==='brace')sawBrace=true;if(s.teamCarry?.phase==='carry')sawCarry=true;if(s.teamCarry?.phase==='lower')sawLower=true;}
 assert.ok(sawBrace&&sawCarry&&sawLower);assert.equal(s.teamCarryCompleted,true);assert.equal(gear.slot,'shaft-star');assert.equal(s.workers[1].job,null);assert.equal(s.workers[2].job,null);
});

test('elevator rider boards, rises continuously and arrives upstairs',()=>{
 const s=createClock();cleanAll(s);for(let i=0;i<3;i++)fitGear(s,i);
 const w=s.workers[0];assert.ok(commandClock(s,0,{type:'lift'}));
 assert.equal(s.upperReached,false);assert.equal(s.liftRide.phase,'board');
 let sawRise=false;
 for(let i=0;i<200&&w.job;i++){
  tickClock(s,.1);
  if(s.liftRide.phase==='ascend'&&s.liftRide.progress>0&&s.liftRide.progress<1)sawRise=true;
 }
 assert.ok(sawRise);assert.equal(s.liftRide.progress,1);assert.equal(s.upperReached,true);assert.equal(w.x,3.25);assert.equal(w.z,2.25);
});

test('clock is chamber one and completion unlocks the next passage without pretending chamber two is playable',()=>{
 const s=createClock();assert.equal(s.chapter,1);assert.equal(s.chamber,'clock');assert.equal(s.exitUnlocked,false);
 assert.equal(commandClock(s,0,{type:'exit'}),false);
 cleanAll(s);for(let i=0;i<3;i++)fitGear(s,i);
 order(s,0,{type:'lift'});order(s,0,{type:'bell'});
 assert.equal(commandClock(s,0,{type:'test'}),true);
 assert.equal(s.exitUnlocked,true);
 assert.equal(commandClock(s,0,{type:'exit'}),true);
 assert.match(s.message,/under construction/);
});
