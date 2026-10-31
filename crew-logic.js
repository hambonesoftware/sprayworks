// SprayWorks Factory Crew: engine-independent simulation.
// Coordinates and deterministic tasks are shared with the Babylon.js scene.
export const BOUNDS={minX:-8.4,maxX:8.4,minZ:-5.4,maxZ:5.4};
export const ROLES=[
  {id:"pip",name:"Pip",role:"Washer",color:"#34e2ee",skill:"clean",x:-7,z:1.4},
  {id:"mox",name:"Mox",role:"Washer",color:"#ffcf39",skill:"clean",x:-7,z:0},
  {id:"bolt",name:"Bolt",role:"Mechanic",color:"#fd8053",skill:"repair",x:-7,z:-1.4},
  {id:"tug",name:"Tug",role:"Hauler",color:"#c49af5",skill:"haul",x:-7,z:-2.8},
  {id:"lux",name:"Lux",role:"Technician",color:"#b0ea73",skill:"restart",x:-7,z:-4.2}
];
export const TASKS=[
  {id:"intake",label:"Wash intake",type:"clean",x:-4.5,z:-0.5,workX:-4.5,workZ:-1.6,duration:4.5,pre:[]},
  {id:"filter",label:"Scrub filter",type:"clean",x:0,z:-2.5,workX:0,workZ:-2.5,duration:5,pre:[]},
  {id:"outlet",label:"Clean exhaust",type:"clean",x:4.6,z:-0.5,workX:4.6,workZ:-1.6,duration:5,pre:[]},
  {id:"sludge-a",label:"Collect oil bag A",type:"haul",x:-5.3,z:3.5,workX:-6.1,workZ:4.2,duration:2,pre:["intake"]},
  {id:"sludge-b",label:"Collect oil bag B",type:"haul",x:5.3,z:3.5,workX:-6.1,workZ:4.2,duration:2,pre:["outlet"]},
  {id:"bearing",label:"Install bearing",type:"repair",x:-3.9,z:3.8,workX:-2.8,workZ:2.5,duration:5,pre:["intake","filter","outlet","sludge-a","sludge-b"]},
  {id:"coupling",label:"Fit drive coupling",type:"repair",x:0,z:3.8,workX:0,workZ:2.5,duration:5.5,pre:["bearing"]},
  {id:"impeller",label:"Mount impeller",type:"repair",x:3.9,z:3.8,workX:2.8,workZ:2.5,duration:6,pre:["coupling"]},
  {id:"restart",label:"Restart pump",type:"restart",x:6.3,z:-3.4,workX:6.3,workZ:-3.4,duration:5.5,pre:["impeller"]}
];
export const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
export function isBlocked(x,z){
  return x<BOUNDS.minX||x>BOUNDS.maxX||z<BOUNDS.minZ||z>BOUNDS.maxZ||
    (x>-2.65&&x<2.65&&z>-1.25&&z<1.65);
}
const GRID=0.55;
const grid=(x,z)=>[Math.round(x/GRID),Math.round(z/GRID)];
const fromGrid=(a,b)=>({x:a*GRID,z:b*GRID});
const k=(a,b)=>a+","+b;
function freePoint(x,z){
  const [cx,cz]=grid(clamp(x,BOUNDS.minX,BOUNDS.maxX),clamp(z,BOUNDS.minZ,BOUNDS.maxZ));
  if(!isBlocked(cx*GRID,cz*GRID))return fromGrid(cx,cz);
  for(let r=1;r<26;r++)for(let dx=-r;dx<=r;dx++)for(let dz=-r;dz<=r;dz++){
    if(Math.max(Math.abs(dx),Math.abs(dz))!==r)continue;
    const p=fromGrid(cx+dx,cz+dz);
    if(!isBlocked(p.x,p.z))return p;
  }
  return {x:-7,z:0};
}
export function findPath(start,end){
  const target=freePoint(end.x,end.z),source=freePoint(start.x,start.z);
  const [sx,sz]=grid(source.x,source.z),[gx,gz]=grid(target.x,target.z);
  const sourceKey=k(sx,sz),goalKey=k(gx,gz);
  if(sourceKey===goalKey)return [target];
  const open=[{x:sx,z:sz,g:0,f:Math.hypot(gx-sx,gz-sz)}];
  const scores=new Map([[sourceKey,0]]),parent=new Map(),closed=new Set();
  let cycles=0;
  while(open.length&&cycles++<5000){
    open.sort((a,b)=>a.f-b.f);
    const n=open.shift(),nk=k(n.x,n.z);
    if(closed.has(nk))continue;
    closed.add(nk);
    if(nk===goalKey){
      const path=[];
      let cur=goalKey;
      while(cur!==sourceKey){
        const [a,b]=cur.split(",").map(Number);
        path.push(fromGrid(a,b));
        cur=parent.get(cur);
        if(cur===undefined)return [source];
      }
      path.reverse();
      if(path.length)path[path.length-1]=target;
      return path;
    }
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
      const nx=n.x+dx,nz=n.z+dz,p=fromGrid(nx,nz);
      if(isBlocked(p.x,p.z))continue;
      if(dx&&dz&&(isBlocked((n.x+dx)*GRID,n.z*GRID)||isBlocked(n.x*GRID,(n.z+dz)*GRID)))continue;
      const next=k(nx,nz),g=n.g+Math.hypot(dx,dz);
      if(g>=((scores.get(next))??Infinity))continue;
      parent.set(next,nk);scores.set(next,g);
      open.push({x:nx,z:nz,g,f:g+Math.hypot(gx-nx,gz-nz)});
    }
  }
  return [source];
}
export function createMission(){
  return {time:0,won:false,paused:false,selected:"pip",events:["Find the oil, clean the pump, and bring it back to life."],
    workers:ROLES.map(r=>({...r,state:"idle",taskId:null,phase:"",carrying:false,path:[],speed:r.skill==="haul"?3.25:2.85})),
    tasks:TASKS.map(t=>({...t,status:"idle",progress:0,assigned:null}))};
}
export const taskById=(m,id)=>m.tasks.find(t=>t.id===id);
export const workerById=(m,id)=>m.workers.find(w=>w.id===id);
export function isReady(m,t){return Boolean(t&&t.status!=="done"&&t.pre.every(id=>taskById(m,id)?.status==="done"));}
function notice(m,msg){m.events.unshift(msg);m.events.length=Math.min(5,m.events.length);}
function release(m,w){
  if(w.taskId){
    const t=taskById(m,w.taskId);
    if(t&&t.assigned===w.id&&t.status!=="done"){t.status="idle";t.assigned=null;}
  }
  w.taskId=null;w.phase="";w.carrying=false;w.path=[];w.state="idle";
}
export function selectWorker(m,id){if(!workerById(m,id))return false;m.selected=id;return true;}
export function orderMove(m,id,x,z){
  const w=workerById(m,id);
  if(!w||m.won)return false;
  release(m,w);w.path=findPath(w,{x,z});w.state="moving";return true;
}
export function assignTask(m,id,taskId){
  const w=workerById(m,id),t=taskById(m,taskId);
  if(!w||!isReady(m,t)||w.skill!==t.type||m.won)return false;
  if(t.assigned&&t.assigned!==id)release(m,workerById(m,t.assigned));
  release(m,w);t.assigned=id;t.status="assigned";
  w.taskId=taskId;w.phase="approach";w.state="moving";w.path=findPath(w,t);
  notice(m,w.name+" assigned: "+t.label);
  return true;
}
function advance(w,dt){
  let distance=w.speed*dt;
  while(w.path.length&&distance>0){
    const p=w.path[0],dx=p.x-w.x,dz=p.z-w.z,d=Math.hypot(dx,dz);
    if(d<0.001){w.x=p.x;w.z=p.z;w.path.shift();continue;}
    const travel=Math.min(d,distance);
    w.x+=dx/d*travel;w.z+=dz/d*travel;distance-=travel;
    if(travel>=d-0.001)w.path.shift();
  }
  return !w.path.length;
}
export function tickMission(m,dt){
  if(m.paused||m.won)return;
  dt=clamp(dt,0,0.05);m.time+=dt;
  for(const w of m.workers){
    if(w.state==="idle")continue;
    if(w.state==="moving"){
      if(!advance(w,dt))continue;
      if(!w.taskId){w.state="idle";continue;}
      const t=taskById(m,w.taskId);
      if(!t){release(m,w);continue;}
      if(w.phase==="approach"){
        w.state="working";w.phase="working";t.status="working";
      }else if(w.phase==="deliver"){
        w.carrying=false;t.status="done";t.progress=1;t.assigned=null;
        notice(m,w.name+" delivered "+t.label.toLowerCase());
        release(m,w);
      }
    }else if(w.state==="working"){
      const t=taskById(m,w.taskId);
      if(!t){release(m,w);continue;}
      t.progress=clamp(t.progress+dt/t.duration,0,1);
      if(t.progress<1)continue;
      if(t.type==="haul"){
        w.carrying=true;w.phase="deliver";w.state="moving";w.path=findPath(w,{x:t.workX,z:t.workZ});
        notice(m,w.name+" hauling waste to the bin");
      }else{
        t.status="done";t.assigned=null;
        notice(m,w.name+" finished "+t.label.toLowerCase());
        release(m,w);
        if(t.type==="restart"){m.won=true;notice(m,"MISSION COMPLETE — the machine is running!");}
      }
    }
  }
}
export function getSummary(m){
  const done=type=>m.tasks.filter(t=>t.type===type&&t.status==="done").length;
  const clean=done("clean"),haul=done("haul"),repair=done("repair"),restart=done("restart");
  return {clean,haul,repair,restart,done:clean+haul+repair+restart,total:m.tasks.length,
    stage:m.won?4:repair===3?3:clean===3&&haul===2?2:0};
}
