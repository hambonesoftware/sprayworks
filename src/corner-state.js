export const PATCH_COUNT=48;
export function makeCorner(){return {dirt:Array(PATCH_COUNT).fill(1),phase:'wash',angle:0,turns:0,job:null,worker:{x:-2.65,z:-2.15,y:.23,yaw:.9,walk:0,arms:0},gear:{x:.75,y:.12,z:0}};}
export function cleanAt(s,index,amount){if(s.phase!=='wash')return;for(let k=-1;k<=1;k++){const i=(index+k+PATCH_COUNT)%PATCH_COUNT;s.dirt[i]=Math.max(0,s.dirt[i]-amount*(k===0?1:.35));}if(s.dirt.every(v=>v<.08)){s.dirt.fill(0);s.phase='lift';}}
export function progress(s){return Math.round((1-s.dirt.reduce((a,b)=>a+b,0)/PATCH_COUNT)*100);}
const home=[-2.65,-2.15],pickup=[.75,-2.4],stand=[-1.8,-1.4];
const sequences={
 lift:[['walk',2.1,pickup],['raise',1.3,[.75,.12,0],[.75,2.2,-.7]],['carry',2.6,stand],['lower',1.2,[-1.8,2.2,.3],[-1.8,.55,1]],['rest',.4]],
 fit:[['raise',1.2,[-1.8,.55,1],[-1.8,2.2,.3]],['carry',2.6,pickup],['lower',1.3,[.75,2.2,-.7],[.75,.12,0]],['rest',.4]],
 align:[['turn',1.2],['walk',2.1,home]],
 start:[['test',.8]]
};
export function act(s){if(s.job||!sequences[s.phase])return false;s.job={steps:sequences[s.phase],index:0,time:0,from:[s.worker.x,s.worker.z],source:s.phase};return true;}
export function advance(s,dt){if(!s.job)return;const j=s.job,step=j.steps[j.index],kind=step[0];j.time=Math.min(step[1],j.time+Math.max(0,Math.min(dt,.1)));const u=j.time/step[1],ease=u*u*(3-2*u),lerp=(a,b)=>a+(b-a)*ease;
 s.worker.walk=kind==='walk'||kind==='carry'?1:0;s.worker.arms=['raise','carry','lower'].includes(kind)?kind==='raise'?ease:kind==='lower'?1-ease:1:kind==='turn'?.5:0;
 if(s.worker.walk){s.worker.x=lerp(j.from[0],step[2][0]);s.worker.z=lerp(j.from[1],step[2][1]);s.worker.yaw=Math.atan2(-(step[2][0]-j.from[0]),-(step[2][1]-j.from[1]));if(kind==='carry'){s.gear={x:s.worker.x,y:2.2,z:s.worker.z+1.7};s.worker.yaw=Math.PI;}}
 if(kind==='raise'||kind==='lower'){s.worker.yaw=Math.PI;s.gear={x:lerp(step[2][0],step[3][0]),y:lerp(step[2][1],step[3][1]),z:lerp(step[2][2],step[3][2])};}
 if(kind==='turn'){s.worker.yaw=Math.PI;s.angle=Math.PI/2*ease;}
 if(j.time>=step[1]){j.index++;j.time=0;j.from=[s.worker.x,s.worker.z];if(j.index===j.steps.length){s.phase={lift:'fit',fit:'align',align:'start',start:'running'}[j.source];if(j.source==='align')s.turns++;s.job=null;s.worker.walk=0;s.worker.arms=0;}}
}
export function jobLabel(s){if(!s.job)return '';return {walk:'Pip is walking over…',raise:'Pip is lifting the gear…',carry:'Pip is carrying the gear…',lower:'Pip is lowering the gear…',rest:'Setting it down safely…',turn:'Pip is aligning the key…',test:'Testing the gearbox…'}[s.job.steps[s.job.index][0]];}
