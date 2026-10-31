export const VERSION = 4;
export const OBSTACLES = [
  {x:-5.8,z:-2.8,w:3.4,d:2.6}, {x:2,z:-2,w:4.6,d:4.0},
  {x:-6,z:3.6,w:3.3,d:1.6}, {x:5.9,z:3.4,w:2.8,d:2.2}
];
export const CREW = [
  {id:0,name:'PIP',role:'sprayer',color:'#4ec7fa',x:-7.8,z:5.5},
  {id:1,name:'FINN',role:'sprayer',color:'#4ec7fa',x:-6.4,z:5.5},
  {id:2,name:'BOLT',role:'mechanic',color:'#ffad50',x:-4.8,z:5.6},
  {id:3,name:'NUT',role:'mechanic',color:'#ffad50',x:-3.4,z:5.7},
  {id:4,name:'MOP',role:'vacuum',color:'#62dec8',x:-8.7,z:4.5}
];
export const PHASES = ['OPEN & REMOVE','WASH THE PARTS','REFIT & TEST'];
export const TASKS = [
  {id:'guard',title:'Unbolt the access cover',short:'COVER',role:'mechanic',phase:0,x:-1,z:1.4,tx:0,ty:.7,tz:.5,duration:5,deps:[],hint:'Send an orange mechanic to undo the giant fasteners. The cover lifts away, exposing the dirty filter and rotor.'},
  {id:'filter-out',title:'Remove the filter',short:'FILTER',role:'mechanic',phase:0,x:-5.8,z:-.8,tx:-5.8,ty:.8,tz:-2.8,duration:5,deps:['guard'],hint:'Pull the clogged filter from its slot. Your mechanic carries it to the blue wash tray inside the casing.'},
  {id:'rotor-out',title:'Lift out the rotor',short:'ROTOR',role:'mechanic',phase:0,x:2,z:.5,tx:2,ty:.8,tz:-2,duration:6,deps:['guard'],hint:'Lift the seized rotor off its shaft and carry it to the orange service cradle. Its empty seat can then be cleaned.'},
  {id:'wash-filter',title:'Wash the filter',short:'WASH FILTER',role:'sprayer',phase:1,x:-6,z:5,tx:-6,ty:.7,tz:3.6,duration:12,deps:['filter-out'],hint:'Spray the removed cartridge on the blue tray. Clean metal appears as the thick oil washes away.'},
  {id:'wash-rotor',title:'Degrease the rotor',short:'WASH ROTOR',role:'sprayer',phase:1,x:5.9,z:5,tx:5.9,ty:.9,tz:3.4,duration:13,deps:['rotor-out'],hint:'Wash the impeller on the orange cradle. Cleaning uncovers a blue arrow needed for reassembly.'},
  {id:'wash-housing',title:'Clean the empty chamber',short:'CHAMBER',role:'sprayer',phase:1,x:-1.4,z:-2,tx:1.2,ty:.2,tz:-2,duration:12,deps:['filter-out','rotor-out'],hint:'With both parts removed, wash the internal channels and bearing seat. The loosened sludge drains to the sump.'},
  {id:'vacuum',title:'Vacuum the sump',short:'SUMP',role:'vacuum',phase:1,x:-2.5,z:1.6,tx:-2.7,ty:.1,tz:.4,duration:9,deps:['wash-housing'],hint:'Send Mop to collect the loosened oil. The chamber must be dry before the clean parts go back in.'},
  {id:'filter-in',title:'Refit the clean filter',short:'FIT FILTER',role:'mechanic',phase:2,x:-6,z:5,tx:-6,ty:.7,tz:3.6,duration:5,deps:['wash-filter','vacuum'],hint:'Carry the clean cartridge back from the blue tray and seat it in its matching blue slot.'},
  {id:'rotor-in',title:'Refit & align the rotor',short:'FIT ROTOR',role:'mechanic',phase:2,x:5.9,z:5,tx:5.9,ty:.9,tz:3.4,duration:6,deps:['wash-rotor','vacuum'],hint:'Return the clean rotor to its shaft. Then turn it until its blue arrow matches the 90° mark on the housing.'},
  {id:'seal',title:'Replace the access cover',short:'SEAL',role:'mechanic',phase:2,x:-1,z:1.4,tx:0,ty:.7,tz:.5,duration:5,deps:['filter-in','rotor-in'],hint:'The cover only fits when the rotor arrow is aligned. Tighten the fasteners to close the serviced chamber.'},
  {id:'power',title:'Test the rebuilt machine',short:'TEST',role:null,phase:2,x:7.6,z:.7,tx:8,ty:.6,tz:.6,duration:3,deps:[],hint:'Run a safe test. The panel explains what is still missing. Once the assembly is correct, the machine starts spinning.'}
];
export function currentPhase(g){return g.progress['filter-out']<1||g.progress['rotor-out']<1?0:g.progress.vacuum<1||g.progress['wash-filter']<1||g.progress['wash-rotor']<1?1:2;}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function walkable(x,z) {
  return x>=-10.5 && x<=10.5 && z>=-7 && z<=7 && (x/11)**2+(z/7.9)**2<1 && !OBSTACLES.some(o=>Math.abs(x-o.x)<o.w/2+.3&&Math.abs(z-o.z)<o.d/2+.3);
}
const cell = p=>({x:Math.round(p.x*2),z:Math.round(p.z*2)});
const key = p=>p.x+','+p.z;
export function findPath(start,end){
  if(!walkable(end.x,end.z))return null;
  const a=cell(start),b=cell(end),goal=key(b),open=[{...a,g:0,f:0}],came=new Map(),cost=new Map([[key(a),0]]),closed=new Set();
  let iterations=0;
  while(open.length&&iterations++<4000){
    open.sort((u,v)=>u.f-v.f);const cur=open.shift(),ck=key(cur);
    if(closed.has(ck))continue;
    if(ck===goal){const out=[{x:b.x/2,z:b.z/2}];let k=goal;while(came.has(k)){const prev=came.get(k);out.push({x:prev.x/2,z:prev.z/2});k=key(prev);}out.reverse();out.shift();if(out.length===0||Math.hypot(out.at(-1).x-end.x,out.at(-1).z-end.z)>.03)out.push({...end});return out;}
    closed.add(ck);
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
      const n={x:cur.x+dx,z:cur.z+dz},nk=key(n);
      if(!walkable(n.x/2,n.z/2)||closed.has(nk))continue;
      if(dx&&dz&&(!walkable(cur.x/2+dx/2,cur.z/2)||!walkable(cur.x/2,cur.z/2+dz/2)))continue;
      const g=cur.g+Math.hypot(dx,dz);if(g>=(cost.get(nk)??Infinity))continue;
      cost.set(nk,g);came.set(nk,cur);open.push({...n,g,f:g+Math.hypot(n.x-b.x,n.z-b.z)});
    }
  }
  return null;
}
export function createGame(saved){
  const game={crew:CREW.map(c=>({...c,path:[],job:null,status:'Ready',facing:0})),progress:Object.fromEntries(TASKS.map(t=>[t.id,0])),angle:0,running:false,paused:false,elapsed:0,events:[]};
  if(saved?.version===VERSION){
    for(const t of TASKS)game.progress[t.id]=clamp(Number(saved.progress?.[t.id])||0,0,1);
    game.angle=[0,90,180,270].includes(saved.angle)?saved.angle:0;game.running=!!saved.running&&game.progress.power===1;game.elapsed=Math.max(0,Number(saved.elapsed)||0);
    saved.crew?.slice(0,5).forEach((c,i)=>{if(Number.isFinite(c.x)&&Number.isFinite(c.z)&&walkable(c.x,c.z)){game.crew[i].x=c.x;game.crew[i].z=c.z;}});
  }
  return game;
}
export function snapshot(g){return {version:VERSION,progress:g.progress,angle:g.angle,running:g.running,elapsed:g.elapsed,crew:g.crew.map(({x,z})=>({x,z}))};}
export function taskById(id){return TASKS.find(t=>t.id===id);}
export function blockers(g){const out=[];if(g.progress['filter-in']<1)out.push('Refit the clean filter');if(g.progress['rotor-in']<1)out.push('Refit the clean rotor');if(g.angle!==90)out.push('Turn rotor arrow to 90°');if(g.progress.seal<1)out.push('Replace the access cover');return out;}

export function reason(g,worker,task,action='work'){
  if(g.running)return 'The pump is already running. Job complete!';
  if(action==='rotate'&&task.id!=='rotor-in')return 'Only the rotor has an alignment adjustment.';
  if(task.role&&worker.role!==task.role)return `Select a ${task.role==='vacuum'?'vacuum operator':task.role} for this job.`;
  if(action==='rotate'&&g.progress['rotor-in']<1)return 'Refit the rotor before rotating its alignment arrow.';
  if(task.id==='seal'&&g.angle!==90)return 'The cover will not seat. Align the rotor arrow to 90° first.';
  for(const dep of task.deps)if(g.progress[dep]<1)return `${taskById(dep).title} first.`;
  if(action==='work'&&task.id!=='power'&&g.progress[task.id]>=1)return 'This part is finished.';
  return '';
}
export function command(g,id,target,action='work'){
  const c=g.crew[id];if(!c)return {ok:false,message:'Select a crew member.'};
  if(g.running)return {ok:false,message:'Machine restored. Start a new shift to replay.'};
  const task=typeof target==='string'?taskById(target):null;
  if(typeof target==='string'&&!task)return {ok:false,message:'Unknown task.'};
  if(task&&task.role==='mechanic'&&g.crew.some(other=>other.id!==id&&other.job?.id===task.id))return {ok:false,message:'Another mechanic is already working on this part.'};
  if(task){const why=reason(g,c,task,action);if(why)return {ok:false,message:why};}
  const rotating=task&&action==='rotate';
  const end=task?{x:(rotating?2:task.x)+(id%2?.35:-.35),z:(rotating?.5:task.z)+.4}:target;
  if(!end||!Number.isFinite(end.x)||!Number.isFinite(end.z))return {ok:false,message:'Choose a clear floor tile.'};
  const path=findPath(c,end);if(!path)return {ok:false,message:'No clear route. Tap an open walkway.'};
  c.path=path;c.job=task?{id:task.id,action,time:0}:null;c.status=task?`To ${task.short.toLowerCase()}`:'Moving';
  return {ok:true,message:`${c.name} → ${task?(action==='rotate'?'align rotor':task.title):'move'}`};
}
export function stop(g,id){const c=g.crew[id];c.path=[];c.job=null;c.status='Ready';}
export function tick(g,dt){
  if(g.paused||g.running)return;
  dt=clamp(dt,0,.1);g.elapsed+=dt;
  for(const c of g.crew){
    if(c.path.length){const p=c.path[0],dx=p.x-c.x,dz=p.z-c.z,d=Math.hypot(dx,dz),step=dt*2.7;c.facing=Math.atan2(dx,dz);if(d<=step){c.x=p.x;c.z=p.z;c.path.shift();}else{c.x+=dx/d*step;c.z+=dz/d*step;}continue;}
    if(!c.job){c.status='Ready';continue;}
    if(c.job.delivering){const id=c.job.id;g.progress[id]=1;g.events.push(taskById(id).title+' complete');stop(g,c.id);continue;}
    const task=taskById(c.job.id),action=c.job.action;c.facing=Math.atan2(task.tx-c.x,task.tz-c.z);
    if(action==='rotate'){c.status='Aligning rotor';c.job.time+=dt;if(c.job.time>=1.2){g.angle=(g.angle+90)%360;g.events.push(`Rotor arrow turned to ${g.angle}°${g.angle===90?' · marks aligned':''}`);stop(g,c.id);}continue;}
    if(task.id==='power'){c.status='Testing';c.job.time+=dt;if(c.job.time>=task.duration){const issues=blockers(g);if(issues.length)g.events.push('Test stopped: '+issues.join(' • '));else{g.running=true;g.progress.power=1;g.events.push('PUMP ONLINE · Nice work, crew!');}stop(g,c.id);}continue;}
    if(g.progress[task.id]>=1){stop(g,c.id);continue;}
    c.status=c.role==='sprayer'?'Spraying':c.role==='vacuum'?'Collecting':task.phase===0?'Removing':'Refitting';g.progress[task.id]=Math.min(1,g.progress[task.id]+dt/task.duration);
    if(g.progress[task.id]===1){
      const destinations={'filter-out':{x:-6,z:5.2},'rotor-out':{x:5.9,z:5.1},'filter-in':{x:-5.8,z:-.4},'rotor-in':{x:2,z:.8}};
      if(destinations[task.id]){g.progress[task.id]=.99;c.job.delivering=true;c.path=findPath(c,destinations[task.id]);c.status='Carrying part';}
      else {g.events.push(task.title+' complete');stop(g,c.id);}
    }
  }
}
