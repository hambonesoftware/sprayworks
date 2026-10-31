import test from "node:test";
import assert from "node:assert/strict";
import { createMission,findPath,isBlocked,orderMove,assignTask,selectWorker,taskById,workerById,tickMission,getSummary,isReady } from "./crew-logic.js";
function until(m,predicate,maxSeconds=120){
  for(let i=0;i<maxSeconds*20;i++){tickMission(m,.05);if(predicate())return;}
  assert.fail("Timed out waiting for mission task");
}
function finish(m,worker,task){
  assert.equal(assignTask(m,worker,task),true,"assignment should be accepted: "+task);
  until(m,()=>taskById(m,task).status==="done");
}
test("all workers are available and selection works",()=>{
  const m=createMission();
  assert.equal(m.workers.length,5);
  assert.equal(selectWorker(m,"bolt"),true);
  assert.equal(m.selected,"bolt");
  assert.equal(selectWorker(m,"unknown"),false);
});
test("A* goes around machine housing and avoids blocked cells",()=>{
  const path=findPath({x:-7,z:0},{x:7,z:0});
  assert.ok(path.length>10);
  for(const p of path)assert.equal(isBlocked(p.x,p.z),false,JSON.stringify(p));
  assert.ok(Math.hypot(path.at(-1).x-7,path.at(-1).z)<.6);
});
test("manual move crosses the factory without walking through the machine",()=>{
  const m=createMission();
  assert.equal(orderMove(m,"pip",7,0),true);
  for(let i=0;i<2000&&workerById(m,"pip").state!=="idle";i++){
    tickMission(m,.05);
    const w=workerById(m,"pip");
    assert.equal(isBlocked(w.x,w.z),false);
  }
  const w=workerById(m,"pip");
  assert.equal(w.state,"idle");
  assert.ok(w.x>6.5);
});
test("tasks demand the appropriate crew skill, and repairs must wait",()=>{
  const m=createMission();
  assert.equal(assignTask(m,"bolt","intake"),false);
  assert.equal(assignTask(m,"pip","bearing"),false);
  assert.equal(isReady(m,taskById(m,"sludge-a")),false);
  assert.equal(assignTask(m,"pip","intake"),true);
  assert.equal(assignTask(m,"mox","intake"),true);
  assert.equal(workerById(m,"pip").taskId,null);
  assert.equal(taskById(m,"intake").assigned,"mox");
});
test("complete mission requires cleanup, hauling, ordered repairs and technician restart",()=>{
  const m=createMission();
  finish(m,"pip","intake");
  finish(m,"mox","filter");
  finish(m,"pip","outlet");
  assert.equal(assignTask(m,"bolt","bearing"),false);
  finish(m,"tug","sludge-a");
  finish(m,"tug","sludge-b");
  assert.equal(assignTask(m,"bolt","coupling"),false);
  finish(m,"bolt","bearing");
  finish(m,"bolt","coupling");
  finish(m,"bolt","impeller");
  assert.equal(assignTask(m,"bolt","restart"),false);
  finish(m,"lux","restart");
  assert.equal(m.won,true);
  assert.equal(getSummary(m).done,9);
  assert.equal(getSummary(m).stage,4);
  assert.equal(assignTask(m,"pip","intake"),false);
});
test("pause freezes progress and moving workers",()=>{
  const m=createMission();
  assignTask(m,"pip","intake");
  const before=workerById(m,"pip").x;
  m.paused=true;
  tickMission(m,.05);
  assert.equal(workerById(m,"pip").x,before);
  assert.equal(m.time,0);
});

test("trial: all five workers deploy concurrently and finish a complete mission",()=>{
  const m=createMission();
  assert.equal(assignTask(m,"pip","intake"),true);
  assert.equal(assignTask(m,"mox","filter"),true);
  assert.equal(assignTask(m,"tug","sludge-a"),false);
  assert.equal(assignTask(m,"bolt","bearing"),false);
  until(m,()=>taskById(m,"intake").status==="done"&&taskById(m,"filter").status==="done");
  assert.equal(assignTask(m,"pip","outlet"),true);
  assert.equal(assignTask(m,"tug","sludge-a"),true);
  until(m,()=>taskById(m,"outlet").status==="done"&&taskById(m,"sludge-a").status==="done");
  finish(m,"tug","sludge-b");
  finish(m,"bolt","bearing");
  finish(m,"bolt","coupling");
  finish(m,"bolt","impeller");
  finish(m,"lux","restart");
  assert.equal(m.won,true);
});
test("trial: 50 randomized worker movements remain inside walkable space",()=>{
  let seed=1984;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let trial=0;trial<50;trial++){
    const m=createMission();
    const w=m.workers[trial%5];
    orderMove(m,w.id,-8+random()*16,-5+random()*10);
    for(let i=0;i<600&&w.state!=="idle";i++){
      tickMission(m,.05);
      assert.equal(isBlocked(w.x,w.z),false,"trial "+trial+" position "+w.x+","+w.z);
    }
    assert.equal(w.state,"idle","trial "+trial+" must reach destination");
  }
});
