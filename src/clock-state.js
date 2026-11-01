const MARKS = ['sun', 'moon', 'star'];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const distance = (a,b) => Math.hypot(a.x-b.x,a.z-b.z);

export function createClock() {
  return {
    workers: [
      {id:0,name:'Pip',role:'sprayer',color:'#56c9ee',x:-2,z:-3},
      {id:1,name:'Bolt',role:'mechanic',color:'#f5a552',x:-.7,z:-3},
      {id:2,name:'Moss',role:'vacuum',color:'#a2cf80',x:.7,z:-3},
    ].map(w => ({...w,yaw:0,level:0,job:null,carrying:null,status:'Ready'})),
    parts: MARKS.map((mark,i) => ({id:`gear-${mark}`,name:`${mark[0].toUpperCase()+mark.slice(1)} gear`,x:[-2.6,.2,2.8][i],z:[-1.6,-2.2,-1.2][i],y:.18,home:{x:[-2.6,.2,2.8][i],z:[-1.6,-2.2,-1.2][i]},size:[.65,.52,.76][i],color:['#f4c65d','#8dd5eb','#e7a17d'][i],dirt:1,slot:null,carrier:null,mark})),
    slots: MARKS.map((mark,i) => ({id:`shaft-${mark}`,x:[-2,0,2][i],z:1,size:[.65,.52,.76][i],mark,part:null})),
    chapter:1,chamber:'clock',exitUnlocked:false,selected:0,running:false,paused:false,liftPowered:false,upperReached:false,liftRide:null,bellClean:false,finaleTime:0,heavyGear:'gear-star',teamCarry:null,teamCarryCompleted:false,message:'Select Pip, then tap a dirty gear to wash away the grime and reveal its mark.'
  };
}

export function progressClock(s) {
  const matched = s.slots.filter(slot => s.parts.find(p=>p.id===slot.part)?.mark===slot.mark).length;
  return {cleaned:s.parts.filter(p=>p.dirt===0).length,placed:s.slots.filter(slot=>slot.part!==null).length,matched,total:3,solved:s.running,liftPowered:s.liftPowered,upperReached:s.upperReached,bellClean:s.bellClean};
}

export function commandClock(s,workerId,target) {
  const w = s.workers.find(w=>w.id===workerId);
  if (!w || !target) return false;
  const reject = message => {s.message=message; return false;};
  if (s.paused) return reject('Resume the workshop before giving an order.');
  if (target.type==='exit') {
    if(!s.exitUnlocked)return reject('Restore the clock first to unlock the passage.');
    s.message='Chamber 01 complete. The passage to Chamber 02 is open; its repair mission is still under construction.';
    return true;
  }
  if (s.running) return reject('The clock is turning! Reset to try the puzzle again.');
  if (w.job) return reject(`${w.name} is busy. Let this job finish first.`);
  if (target.type==='lift') {
    if(!s.liftPowered)return reject('Install all three gears to power the elevator first.');
    if(s.liftRide)return reject('The elevator has already carried a worker upstairs.');
    if(w.role!=='sprayer')return reject('Select Pip to ride the lift; Pip needs to clean the bell upstairs.');
    if(s.workers.some(a=>a.job))return reject('Wait until the crew finishes their current jobs.');
    s.liftRide={worker:w.id,phase:'board',time:0,progress:0};
    w.job={kind:'lift',phase:'board'};w.status='Walking onto elevator';
    s.message=`${w.name} is boarding the brass elevator.`;return true;
  }
  if (target.type==='bell') {
    if(!s.upperReached)return reject('Ride the elevator to reach the upper bell chamber.');
    if(s.bellClean)return reject('The bell is already aligned. Test the clock!');
    if(w.role!=='sprayer')return reject('Select Pip to spray the jammed bell mechanism.');
    if(w.level!==1)return reject('Pip must ride the elevator upstairs before cleaning the bell. Select Pip and use Ride Lift.');
    const job={kind:'bell',x:2.9,z:2.2,time:0,phase:'walk'};
    w.job=job;w.status='Walking to clean the bell';s.message='Pip is climbing to the bell mechanism.';return true;
  }
  if (target.type==='test') {
    if (s.workers.some(w=>w.job)) return reject('Wait for the crew to finish, then test the clock.');
    const p=progressClock(s);
    if(p.placed<3) return reject(`The clock needs all three gears installed (${p.placed}/3 installed).`);
    const wrong=s.slots.find(slot=>s.parts.find(p=>p.id===slot.part)?.mark!==slot.mark);
    if(wrong) return reject(`The ${wrong.mark} shaft has the wrong gear. Tap its installed gear to remove it, then match the revealed marks.`);
    if(!s.upperReached)return reject('The gears power the elevator. Ride it to discover the bell first.');
    if(!s.bellClean)return reject('The bell is jammed. Send Pip to clean the upper mechanism.');
    s.running=true;s.exitUnlocked=true;s.finaleTime=0;s.message='Chamber 01 restored! The clock drives the passage to the next machine. The exit is now unlocked.'; return true;
  }
  let job;
  if (target.type==='part') {
    const p=s.parts.find(p=>p.id===target.id);
    if(!p) return reject('Choose a gear in the workshop.');
    if(w.carrying) return reject(`${w.name} is already carrying a gear. Choose an empty shaft or floor to set it down.`);
    if(p.id===s.heavyGear && p.dirt===0 && !s.teamCarryCompleted && !p.slot) {
      if(w.role!=='mechanic')return reject('The heavy star gear needs Bolt and Moss. Select Bolt to call the lifting team.');
      const partner=s.workers.find(other=>other.role==='vacuum');
      if(!partner || partner.job || partner.carrying)return reject('Moss needs to be free before the team can lift the heavy star gear.');
      const targetSlot=s.slots.find(slot=>slot.mark===p.mark);
      if(targetSlot.part!==null)return reject('The star shaft must be empty.');
      s.teamCarry={part:p.id,leader:w.id,partner:partner.id,phase:'approach',time:0,x:p.x,z:p.z,slot:targetSlot.id};
      w.job={kind:'team',phase:'approach'};partner.job={kind:'team',phase:'approach'};
      w.status='Moving to left lifting grip';partner.status='Moving to right lifting grip';
      s.message='Bolt and Moss approach opposite sides of the giant star gear. They will lift, carry, and install it together.';
      return true;
    }
    if(p.carrier!==null || s.workers.some(other=>other.job?.part===p.id)) return reject('Another crew member is working on that gear.');
    if(p.id===s.heavyGear && p.slot)return reject('The team-installed star gear is bolted in place. Reset the shift to start over.');
    if(p.dirt>0 && w.role!=='sprayer') return reject('Pip must spray this gear clean to reveal its mark first.');
    job={kind:p.dirt>0?'clean':'pickup',part:p.id,x:p.x,z:p.z,time:0,phase:'walk'};
  } else if(target.type==='slot') {
    const slot=s.slots.find(slot=>slot.id===target.id);
    if(!slot) return reject('Choose a shaft in the clock.');
    if(!w.carrying) return reject('Pick up a clean gear first, then choose a shaft.');
    if(slot.part!==null || s.workers.some(other=>other.job?.slot===slot.id)) return reject('That shaft is occupied. Remove its gear first.');
    job={kind:'place',part:w.carrying,slot:slot.id,x:slot.x,z:slot.z,time:0,phase:'walk'};
  } else if(target.type==='upper-floor') {
    if(w.level!==1)return reject('Ride the elevator to reach the upper walkway.');
    if(!Number.isFinite(target.x)||!Number.isFinite(target.z))return reject('Choose a point on the upper walkway.');
    job={kind:'move',part:null,x:clamp(target.x,1.3,4),z:clamp(target.z,1.8,3),time:0,phase:'walk'};
  } else if(target.type==='floor') {
    if(w.level===1)return reject('This worker is upstairs. Use the upper walkway to reach the bell.');
    if(!Number.isFinite(target.x)||!Number.isFinite(target.z)) return reject('Choose a spot on the floor.');
    job={kind:w.carrying?'drop':'move',part:w.carrying,x:clamp(target.x,-4,4),z:clamp(target.z,-3,3),time:0,phase:'walk'};
  } else return reject('Choose a gear, shaft, or floor.');
  w.job=job; w.status=`Walking to ${job.kind==='clean'?'wash gear':job.kind==='pickup'?'pick up gear':job.kind==='place'?'install gear':job.kind==='drop'?'set down gear':'spot'}`;
  s.message=`${w.name}: ${w.status.toLowerCase()}.`; return true;
}

export function tickClock(s,dt) {
  if(s.paused || !Number.isFinite(dt) || dt<=0) return s;
  if(s.running){s.finaleTime+=Math.min(dt,.1);return s;}
  // Bound each update so a suspended tab cannot teleport the crew across the room.
  dt=Math.min(dt,.1);
  const ride=s.liftRide;
  if(ride){
    const rider=s.workers.find(a=>a.id===ride.worker);
    if(ride.phase==='board'){
      const d=Math.hypot(3.25-rider.x,2.25-rider.z),step=Math.min(d,dt*2.65);
      if(d>.001){rider.yaw=Math.atan2(3.25-rider.x,2.25-rider.z);rider.x+=(3.25-rider.x)/d*step;rider.z+=(2.25-rider.z)/d*step;}
      if(d<=step+.02){rider.x=3.25;rider.z=2.25;ride.phase='ascend';ride.time=0;rider.status='Riding elevator up';s.message='The lift carries the crew into the upper clock chamber!';}
    }else if(ride.phase==='ascend'){
      ride.time+=dt;ride.progress=Math.min(1,ride.time/1.65);
      if(ride.progress>=1){s.upperReached=true;rider.level=1;ride.phase='arrived';rider.job=null;rider.status='Upstairs';s.message='The elevator has arrived! The bell mechanism is jammed with grime.';}
    }
  }
  const team=s.teamCarry;
  if(team){
    const a=s.workers.find(w=>w.id===team.leader),b=s.workers.find(w=>w.id===team.partner),p=s.parts.find(p=>p.id===team.part),slot=s.slots.find(x=>x.id===team.slot);
    team.time+=dt;
    const move=(w,x,z,speed)=>{const d=Math.hypot(x-w.x,z-w.z),step=Math.min(d,dt*speed);if(d>.001){w.yaw=Math.atan2(x-w.x,z-w.z);w.x+=(x-w.x)/d*step;w.z+=(z-w.z)/d*step;}return d<=step+.02;};
    if(team.phase==='approach'){
      const readyA=move(a,p.x-.7,p.z,1.65),readyB=move(b,p.x+.7,p.z,1.65);
      if(readyA&&readyB){team.phase='brace';team.time=0;a.status='Bracing left grip';b.status='Bracing right grip';s.message='Both workers lock their hands to the wheel. One, two, lift!';}
    }else if(team.phase==='brace'){
      p.y=.18+.65*Math.min(1,team.time/.8);
      if(team.time>=.8){team.phase='carry';team.time=0;a.status='Carrying left side';b.status='Carrying right side';}
    }else if(team.phase==='carry'){
      const targetX=slot.x,targetZ=slot.z;
      const dx=targetX-p.x,dz=targetZ-p.z,dist=Math.hypot(dx,dz),step=Math.min(dist,dt*.85);
      if(dist>.001){p.x+=dx/dist*step;p.z+=dz/dist*step;}
      a.x=p.x-.7;b.x=p.x+.7;a.z=p.z;b.z=p.z;p.y=.83+Math.sin(team.time*9)*.025;
      if(dist<=step+.02){team.phase='lower';team.time=0;a.status='Guiding gear onto shaft';b.status='Supporting gear';}
    }else if(team.phase==='lower'){
      p.y=.83-(.83-.4)*Math.min(1,team.time/.85);
      if(team.time>=.85){p.x=slot.x;p.z=slot.z;p.y=.4;p.slot=slot.id;p.carrier=null;slot.part=p.id;s.teamCarryCompleted=true;s.teamCarry=null;a.job=null;b.job=null;a.status='Ready';b.status='Ready';s.liftPowered=progressClock(s).matched===3;s.message=s.liftPowered?'The team seats the final gear! The drive train engages and the lift powers up.':'Bolt and Moss celebrate fitting the heavy star gear.';}
    }
  }
  for(const w of s.workers) {
    if(w.job?.kind==='team'||w.job?.kind==='lift')continue;
    const j=w.job;
    if(j) {
      if(j.phase==='walk') {
        const d=distance(w,j), step=Math.min(d,dt*2.65);
        if(d>.001) {w.yaw=Math.atan2(j.x-w.x,j.z-w.z);w.x+=(j.x-w.x)/d*step;w.z+=(j.z-w.z)/d*step;}
        if(d<=step+.001) {j.phase='work';j.time=0;w.status=({bell:'Clearing bell jam',clean:'Spraying grime',pickup:'Picking up gear',place:'Installing gear',drop:'Setting down gear',move:'Ready'})[j.kind];}
      } else {
        j.time+=dt;
        const p=s.parts.find(p=>p.id===j.part);
        if(j.kind==='clean' && p) p.dirt=Math.max(0,1-j.time/1.6);
        if(j.kind==='pickup' && p) {const start=p.slot ? .4 : .18;p.y=start+(.72-start)*Math.min(1,j.time/.45);}
        if(j.kind==='place' && p) p.y=.72-(.72-.4)*Math.min(1,j.time/.6);
        if(j.kind==='drop' && p) p.y=.72-(.72-.18)*Math.min(1,j.time/.35);
        const duration=({bell:2.4,clean:1.6,pickup:.45,place:.6,drop:.35,move:0})[j.kind];
        if(j.time+1e-8>=duration) {
          if(j.kind==='bell'){s.bellClean=true;s.message='The bell swings freely! Test the clock to wake the cuckoo.';}
          if(j.kind==='clean') {p.dirt=0;s.message=`Clean! The gear bears a ${p.mark} mark. Tap it again to pick it up.`;}
          if(j.kind==='pickup') {
            if(p.slot){s.slots.find(slot=>slot.id===p.slot).part=null;s.liftPowered=false;s.upperReached=false;s.liftRide=null;s.bellClean=false;}
            p.slot=null;p.carrier=w.id;w.carrying=p.id;s.message=`${w.name} is carrying the ${p.mark} gear. Choose a shaft with the same mark.`;
          }
          if(j.kind==='place') {const slot=s.slots.find(slot=>slot.id===j.slot);slot.part=p.id;p.slot=slot.id;p.carrier=null;p.x=slot.x;p.z=slot.z;p.y=.4;w.carrying=null;s.message='Gear installed. You can remove it by tapping it.';if(progressClock(s).matched===3){s.liftPowered=true;s.message='CLUNK! The restored drive train powers the brass elevator. Ride it to the upper chamber!';}else{s.liftPowered=false;}}
          if(j.kind==='drop') {p.carrier=null;p.slot=null;p.x=w.x;p.z=w.z;p.y=.18;w.carrying=null;s.message='Gear set down safely.';}
          w.job=null;w.status=w.carrying?'Carrying gear':'Ready';
        }
      }
    }
    if(w.carrying) {const p=s.parts.find(p=>p.id===w.carrying);p.x=w.x;p.z=w.z;if(!w.job || w.job.phase!=='work' || !['place','drop'].includes(w.job.kind))p.y=.72;}
  }
  return s;
}

export function resetClock(s) {
  Object.assign(s,createClock());
  return s;
}
