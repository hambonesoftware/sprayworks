export const PATCH_COUNT=48;
export function makeCorner(){return {dirt:Array(PATCH_COUNT).fill(1),phase:'wash',angle:0,turns:0};}
export function cleanAt(s,index,amount){if(s.phase!=='wash')return;for(let k=-1;k<=1;k++){const i=(index+k+PATCH_COUNT)%PATCH_COUNT;s.dirt[i]=Math.max(0,s.dirt[i]-amount*(k===0?1:.35));}if(s.dirt.every(v=>v<.08))s.phase='lift';}
export function progress(s){return Math.round((1-s.dirt.reduce((a,b)=>a+b,0)/PATCH_COUNT)*100);}
export function act(s){if(s.phase==='lift')s.phase='fit';else if(s.phase==='fit')s.phase='align';else if(s.phase==='align'){s.turns++;s.angle=Math.PI/2;s.phase='start';}else if(s.phase==='start')s.phase='running';}
