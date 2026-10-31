import { createGame, TASKS, CREW, command, stop, tick, snapshot, blockers, reason, currentPhase, PHASES } from './simulation.js';
import { createWorld } from './world.js';
import { createTactical } from './tactical.js';
const $=id=>document.getElementById(id),KEY='sprayworks-machine-v4';
let saved=null;try{saved=JSON.parse(localStorage.getItem(KEY));}catch{}
const game=createGame(saved);let selected=2,taskSelection=null,world,started=false,lastFrame=0,uiClock=0,saveClock=0,toastTimer,showedVictory=game.running,audio=null,sound=false;
window.sprayworksProgress?.(35,'Building the inside of Pump 07');
let canvas=$('scene');
try{world=createWorld(canvas,game);}catch(error){console.warn('3D unavailable; using tactical renderer.',error);const fresh=canvas.cloneNode();canvas.replaceWith(fresh);canvas=fresh;world=createTactical(canvas,game);$('renderer-note').hidden=false;}
window.sprayworksProgress?.(78,'Assembling five crew members and repair orders');
const icons={sprayer:'SPRAYER',mechanic:'MECHANIC',vacuum:'VACUUM'};
function portrait(c){return `<svg viewBox="0 0 60 54" aria-hidden="true"><path d="M9 53v-9q0-12 21-12t21 12v9" fill="${c.color}"/><path d="M12 23C12 1 48 1 48 23v6H12Z" fill="#edf2e5"/><path d="M26 5h8v16h-8" fill="${c.color}"/><rect x="15" y="21" width="30" height="17" rx="8" fill="#132d3b"/><path d="M20 25h13" stroke="#9bc6cf" stroke-width="2" stroke-linecap="round"/><rect x="9" y="23" width="6" height="10" rx="2" fill="#bbcfce"/><rect x="45" y="23" width="6" height="10" rx="2" fill="#bbcfce"/><path d="M23 43v9m14-9v9" stroke="#eaf2e5" stroke-width="3"/></svg>`;}
$('crew').innerHTML=CREW.map(c=>`<button class="crew-card" id="crew-${c.id}" style="--worker:${c.color}" aria-label="Select ${c.name}, ${c.role}" aria-pressed="${c.id===selected}" data-crew="${c.id}"><i class="role-dot"></i>${portrait(c)}<b>${c.name}</b><small>Ready</small></button>`).join('');
$('jobs').innerHTML=TASKS.map((t,i)=>`<button class="job" id="job-${t.id}" data-task="${t.id}"><span class="num">0${i+1}</span><span>${t.title}</span><span class="state">0%</span><i class="job-progress"></i></button>`).join('');
$('labels').innerHTML=TASKS.map(t=>`<button class="task-marker" id="marker-${t.id}" data-task="${t.id}" aria-label="${t.title}"><i></i><span>${t.short}</span></button>`).join('');
function toast(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),5000);}
function beep(success=true){if(!sound||!audio)return;const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(success?640:220,audio.currentTime);o.frequency.exponentialRampToValueAtTime(success?960:160,audio.currentTime+.12);g.gain.setValueAtTime(.035,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.2);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.22);}
function save(){try{localStorage.setItem(KEY,JSON.stringify(snapshot(game)));$('save-status').textContent='SAVED ON DEVICE';}catch{$('save-status').textContent='SAVE UNAVAILABLE';}}
function choose(id){selected=id;beep();updateUI();if(taskSelection)renderTask();}
function give(target,action='work'){const result=command(game,selected,target,action);toast(result.message);beep(result.ok);updateUI();return result;}
function selectTask(id,auto=true){taskSelection=id;renderTask();if(auto&&(game.progress[id]<1||id==='power'))give(id);}
function renderTask(){const t=TASKS.find(t=>t.id===taskSelection);if(!t){$('task-panel').hidden=true;return;}const panel=$('task-panel');panel.hidden=false;const state=t.id==='rotor-in'?`ROTOR ARROW ${game.angle}° / HOUSING MARK 90°`:t.id==='power'?(game.running?'PRESSURE NOMINAL':`${blockers(game).length} checks outstanding`):`${Math.round(game.progress[t.id]*100)}% COMPLETE`;
  const body=`<button class="close-task" aria-label="Close task">×</button><div class="eyebrow">${t.role?icons[t.role]:'ANY CREW'} / ${t.short}</div><h2>${t.title}</h2><p>${t.hint}</p><div class="readout">${state}</div><button class="action" id="assign-task">${t.id==='power'?'Run system test':game.progress[t.id]>=1?'Work complete':'Assign '+game.crew[selected].name}</button>${t.id==='rotor-in'?'<button class="action" id="rotate-task">↻ Turn rotor arrow 90°</button>':''}<div class="task-footer">${game.paused?'Order will begin when you resume.':'Tap a different crew card to change worker.'}</div>`;
  if(panel.dataset.html===body)return;panel.dataset.html=body;panel.innerHTML=body;
  panel.querySelector('.close-task').onclick=()=>{taskSelection=null;panel.hidden=true;};$('assign-task').disabled=game.running||(game.progress[t.id]>=1&&!['power'].includes(t.id));$('assign-task').onclick=()=>give(t.id);if($('rotate-task')){$('rotate-task').disabled=game.progress['rotor-in']<1||game.running;$('rotate-task').onclick=()=>give('rotor-in','rotate');}
}
function updateUI(){
  for(const c of game.crew){const button=$('crew-'+c.id);button.classList.toggle('selected',c.id===selected);button.setAttribute('aria-pressed',String(c.id===selected));button.querySelector('small').textContent=c.status;}
  const c=game.crew[selected];$('selected-name').textContent=c.name;$('selected-role').textContent=icons[c.role];$('selected-role').style.color=c.color;
  $('order-hint').textContent=game.running?'Pump restored. Take a look around.':c.role==='sprayer'?'Tap a removed part to wash it on its tray.':c.role==='mechanic'?'Tap a part to remove, refit or align it.':'Clean the chamber first, then collect its sludge.';
  const active=game.crew.filter(c=>c.job||c.path.length).length;$('active-count').textContent=active?`${active} working · ${5-active} ready`:'5 ready';
  const phase=currentPhase(game);$('phases').querySelectorAll('span').forEach((e,i)=>{e.classList.toggle('active',i===phase);e.classList.toggle('complete',i<phase);});
  const next=TASKS.find(t=>t.phase===phase&&game.progress[t.id]<1&&t.deps.every(id=>game.progress[id]>=1));
  $('next-step').textContent=game.running?'All clean. All working.':phase===2&&game.progress['rotor-in']===1&&game.angle!==90?'Next: mechanic → turn rotor arrow to 90°':next?`Next: ${next.role||'any worker'} → ${next.title.toLowerCase()}`:'Finish the active jobs to continue.';
  for(const t of TASKS){const pct=Math.round(game.progress[t.id]*100),done=pct===100,button=$('job-'+t.id),marker=$('marker-'+t.id);button.hidden=t.phase!==phase;button.classList.toggle('done',done);button.classList.toggle('current',game.crew.some(c=>c.job?.id===t.id));const locked=t.deps.some(id=>game.progress[id]<1);button.classList.toggle('locked',locked);button.querySelector('.state').textContent=done?'✓':locked?'WAIT':pct+'%';button.querySelector('.job-progress').style.width=pct+'%';marker.classList.toggle('done',done);marker.classList.toggle('active',taskSelection===t.id);}
  const count=TASKS.filter(t=>game.progress[t.id]===1).length;$('mission-status').textContent=game.running?'PUMP ONLINE · SHIFT COMPLETE':`${count} / ${TASKS.length} jobs · ${PHASES[phase].toLowerCase()}`;$('mission-bar').style.width=(Object.values(game.progress).reduce((a,b)=>a+b,0)/TASKS.length*100)+'%';
  $('pause').textContent=game.paused?'▶':'Ⅱ';$('pause').setAttribute('aria-label',game.paused?'Resume work':'Pause and give orders');$('pause-banner').hidden=!game.paused||!started;
  if(taskSelection)renderTask();
}
function reset(){try{localStorage.removeItem(KEY);}catch{}location.reload();}
function start(){started=true;$('welcome').close();game.paused=false;updateUI();toast(saved?'Welcome back. Your crew is ready for new orders.':'Bolt is selected. Tap COVER to unbolt the access cover.');}
$('begin').onclick=start;$('reset').onclick=()=>{if(confirm('Start a fresh shift? This replaces the saved progress for this prototype.'))reset();};
$('pause').onclick=()=>{game.paused=!game.paused;updateUI();};$('help').onclick=()=>{game.paused=true;$('welcome').showModal();$('begin').textContent='BACK TO WORK →';updateUI();};
$('welcome').addEventListener('cancel',e=>{e.preventDefault();start();});
$('stop').onclick=()=>{stop(game,selected);toast(game.crew[selected].name+' · order cancelled');updateUI();};$('focus').onclick=()=>world.focus(game.crew[selected]);$('home').onclick=()=>world.home();$('zoom-in').onclick=()=>world.zoom(-3);$('zoom-out').onclick=()=>world.zoom(3);
$('sound').onclick=async()=>{sound=!sound;if(sound){audio??=new(window.AudioContext||window.webkitAudioContext)();await audio.resume();} $('sound').textContent=sound?'♫':'♪';$('sound').setAttribute('aria-label',sound?'Disable sound':'Enable sound');beep();};
$('jobs-toggle').onclick=()=>{const hidden=!$('jobs').hidden;$('jobs').hidden=hidden;$('jobs-toggle').setAttribute('aria-expanded',String(!hidden));};
if(innerWidth<650){$('jobs').hidden=true;$('jobs-toggle').setAttribute('aria-expanded','false');}
$('crew').addEventListener('click',e=>{const b=e.target.closest('[data-crew]');if(b)choose(Number(b.dataset.crew));});
for(const container of [$('jobs'),$('labels')])container.addEventListener('click',e=>{const b=e.target.closest('[data-task]');if(b)selectTask(b.dataset.task);});
$('keep-looking').onclick=()=>$('victory').close();$('replay').onclick=reset;
const pointers=new Map();let down=null,drag=false,pinchDistance=0;
canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1){down={x:e.clientX,y:e.clientY};drag=false;}else{drag=true;const p=[...pointers.values()];pinchDistance=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);}});
canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;const prev=pointers.get(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2){const p=[...pointers.values()],d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);world.zoom((pinchDistance-d)*.045);pinchDistance=d;world.pan((e.clientX-prev.x)/2,(e.clientY-prev.y)/2);drag=true;}else if(down&&(drag||Math.hypot(e.clientX-down.x,e.clientY-down.y)>7)){world.pan(e.clientX-prev.x,e.clientY-prev.y);drag=true;}});
canvas.addEventListener('pointerup',e=>{if(pointers.size===1&&!drag&&down&&started){const r=canvas.getBoundingClientRect(),hit=world.pick(e.clientX-r.left,e.clientY-r.top);if(hit?.worker!==undefined)choose(hit.worker);else if(hit?.task){selectTask(hit.task);}else if(hit){taskSelection=null;$('task-panel').hidden=true;give(hit);}}pointers.delete(e.pointerId);if(!pointers.size)down=null;});
canvas.addEventListener('pointercancel',e=>{pointers.delete(e.pointerId);drag=true;down=null;});
canvas.addEventListener('wheel',e=>{e.preventDefault();world.zoom(e.deltaY*.015);},{passive:false});
window.addEventListener('keydown',e=>{if($('welcome').open||$('victory').open)return;if(/^[1-5]$/.test(e.key))choose(Number(e.key)-1);else if(e.code==='Space'){e.preventDefault();$('pause').click();}else if(e.key==='Escape'){taskSelection=null;$('task-panel').hidden=true;}else if(e.key.toLowerCase()==='s')$('stop').click();});
window.addEventListener('resize',()=>world.resize());window.addEventListener('pagehide',save);document.addEventListener('visibilitychange',()=>{if(document.hidden){save();game.paused=true;updateUI();}lastFrame=performance.now();});
function frame(now){const dt=Math.min(.1,(now-(lastFrame||now))/1000);lastFrame=now;if(started&&!document.hidden)tick(game,dt);world.render(now/1000,selected);if(!window.machineFirstFrame){window.machineFirstFrame=true;window.sprayworksReadyForPlay?.();if(!saved)$('welcome').showModal();}
  for(const t of TASKS){let tx=t.tx,tz=t.tz;if(t.id==='rotor-in'&&game.progress['rotor-in']===1){tx=2;tz=-2;}if(t.id==='filter-in'&&game.progress['filter-in']===1){tx=-5.8;tz=-2.8;}const p=world.project(tx,t.ty+1.1,tz),el=$('marker-'+t.id);el.style.left=p.x+'px';el.style.top=p.y+'px';el.style.display=t.phase===currentPhase(game)&&p.visible&&p.x>0&&p.x<innerWidth&&p.y>75&&p.y<innerHeight-155?'flex':'none';}
  uiClock+=dt;saveClock+=dt;if(uiClock>.2){updateUI();uiClock=0;}if(saveClock>5){if(started)save();saveClock=0;}
  while(game.events.length){const message=game.events.shift();toast(message);beep(!message.startsWith('Test stopped'));save();}
  if(game.running&&!showedVictory){showedVictory=true;$('finish-time').textContent=Math.floor(game.elapsed/60)+'m '+Math.floor(game.elapsed%60)+'s';$('victory').showModal();}
  requestAnimationFrame(frame);
}
updateUI();if(saved){started=true;toast('Shift restored · tap a worker to give an order');}window.sprayworksProgress?.(95,'Drawing the first frame');requestAnimationFrame(frame);
