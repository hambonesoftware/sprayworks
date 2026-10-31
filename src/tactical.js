import { TASKS, CREW } from './simulation.js';
// A complete, playable fallback for browsers without a usable WebGL context.
export function createTactical(canvas,game){
  const ctx=canvas.getContext('2d');let width=1,height=1,scale=27,zoom=1,panX=0,panY=0;
  const project=(x,y,z)=>({x:width*.55+(x-z)*scale+panX,y:height*.49+(x+z)*scale*.46-y*scale+panY,visible:true});
  function polygon(points,fill,stroke='#a4cccd20'){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}
  function box(x,z,w,d,h,color){const a=project(x-w/2,0,z-d/2),b=project(x+w/2,0,z-d/2),c=project(x+w/2,0,z+d/2),e=project(x-w/2,0,z+d/2);const top=[a,b,c,e].map(p=>({x:p.x,y:p.y-h*scale}));polygon([b,c,top[2],top[1]],'#163b44');polygon([c,e,top[3],top[2]],'#254a50');polygon(top,color);}
  function circle(x,y,r,color,stroke){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
  function text(value,x,y,size=12,color='#e3eeeb'){ctx.font=`600 ${size}px system-ui`;ctx.fillStyle=color;ctx.textAlign='center';ctx.fillText(value,x,y);}
  const api={kind:'tactical',project,
    resize(){width=canvas.clientWidth;height=canvas.clientHeight;canvas.width=width*Math.min(devicePixelRatio,2);canvas.height=height*Math.min(devicePixelRatio,2);ctx.setTransform(canvas.width/width,0,0,canvas.height/height,0,0);scale=Math.min(width/34,height/22)*zoom;},
    pick(x,y){for(const c of game.crew){const p=project(c.x,.6,c.z);if(Math.hypot(x-p.x,y-p.y)<20)return {worker:c.id};}const a=(x-width*.55-panX)/scale,b=(y-height*.49-panY)/(scale*.46);return {x:(a+b)/2,z:(b-a)/2};},
    pan(dx,dy){panX+=dx;panY+=dy;},zoom(d){zoom=Math.max(.65,Math.min(1.8,zoom-d*.035));api.resize();},focus(c){const p=project(c.x,0,c.z);panX+=width*.55-p.x;panY+=height*.49-p.y;},home(){zoom=1;panX=panY=0;api.resize();},
    render(time,selected){
      ctx.fillStyle='#10262e';ctx.fillRect(0,0,width,height);const bg=ctx.createRadialGradient(width*.6,height*.45,10,width*.6,height*.45,width*.7);bg.addColorStop(0,'#31525b');bg.addColorStop(1,'#0c2028');ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);
      // An open oval pump casing; the player is inside its curved walls.
      const oval=(rx,rz,y,fill,stroke)=>{const points=[];for(let i=0;i<64;i++){const a=i/64*Math.PI*2;points.push(project(Math.cos(a)*rx,y,Math.sin(a)*rz));}polygon(points,fill,stroke);};
      oval(11.5,8.3,-.4,'#926c30');oval(11.5,8.3,0,'#efb344');oval(10.9,7.8,.03,'#173c43');oval(10.5,7.5,.05,'#36848a');
      for(let i=0;i<25;i++){const a=Math.PI+i/24*Math.PI,x=Math.cos(a)*10.8,z=Math.sin(a)*7.6;const p=project(x,0,z),q=project(x,2,z);ctx.strokeStyle='#f4bb55';ctx.lineWidth=scale*.5;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();if(i%3===0){ctx.strokeStyle='#a3c2bd';ctx.lineWidth=scale*.1;ctx.stroke();}}
      for(let i=0;i<22;i++){const a=i/22*Math.PI*2,p=project(Math.cos(a)*11, .2,Math.sin(a)*7.9);circle(p.x,p.y,scale*.21,'#c8d9ce','#618b91');circle(p.x,p.y,scale*.08,'#244b52');}
      const bore=project(-6.4,1.6,-6.1);circle(bore.x,bore.y,scale*1.4,'#102d35','#b1cbc5');circle(bore.x,bore.y,scale*1.1,'#0b232b','#456b72');
      const seat=project(2,.15,-2);ctx.fillStyle='#163f48';ctx.beginPath();ctx.ellipse(seat.x,seat.y,scale*2.2,scale*1.1,0,0,7);ctx.fill();ctx.strokeStyle='#b8d4cb';ctx.lineWidth=3;ctx.stroke();circle(seat.x,seat.y-7,scale*.2,'#a6c4c0');
      box(-5.8,-2.8,3.5,2.7,.25,'#153e49');box(-6,3.6,3.3,1.7,.4,'#78bac7');box(5.9,3.4,2.9,2.3,.4,'#f4b954');
      const position=(part)=>{const out=part+'-out',inside=part+'-in',worker=game.crew.find(c=>[out,inside].includes(c.job?.id)&&c.job.delivering);if(worker)return {x:worker.x,y:1.3,z:worker.z};if(game.progress[inside]>=1||game.progress[out]<1)return part==='filter'?{x:-5.8,y:.5,z:-2.8}:{x:2,y:.5,z:-2};return part==='filter'?{x:-6,y:.8,z:3.6}:{x:5.9,y:.9,z:3.4};};
      const filter=position('filter'),rotor=position('rotor');box(filter.x,filter.z,3,2.2,filter.y,'#b6d6d2');for(let i=0;i<11;i++){const a=project(filter.x-1.25+i*.25,filter.y+.1,filter.z-.9),b=project(filter.x-1.25+i*.25,filter.y+.1,filter.z+.9);ctx.strokeStyle='#385e67';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
      const rp=project(rotor.x,rotor.y,rotor.z),r=scale*1.65;circle(rp.x,rp.y,r,'#a8c3be','#dcebdc');for(let i=0;i<8;i++){const a=i*Math.PI/4-game.angle*Math.PI/180+(game.running?time*2:0);ctx.save();ctx.translate(rp.x,rp.y);ctx.rotate(a);polygon([{x:7,y:-5},{x:r*.7,y:-r*.23},{x:r*.8,y:r*.06},{x:r*.28,y:10}],'#eab145');ctx.restore();}circle(rp.x,rp.y,r*.2,'#e1e8da');
      const mark=(game.angle-90)*Math.PI/180;ctx.strokeStyle='#74f4ff';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(rp.x+Math.cos(mark)*r*.65,rp.y+Math.sin(mark)*r*.65);ctx.lineTo(rp.x+Math.cos(mark)*r*.9,rp.y+Math.sin(mark)*r*.9);ctx.stroke();
      for(const [id,pos,rx,rz] of [['wash-filter',filter,1.3,.85],['wash-rotor',rotor,1.4,1.4],['wash-housing',{x:2,y:.18,z:-2},2,1.5],['vacuum',{x:-2.7,y:.08,z:.4},1.4,.7]]){for(let i=0;i<35*(1-game.progress[id]);i++){const p=project(pos.x+Math.sin(i*23.6)*rx,pos.y+.15,pos.z+Math.cos(i*12.7)*rz);circle(p.x,p.y,scale*(.11+i%4*.04),i%3?'#303527':'#6f6534');}}
      const coverX=-game.progress.guard*(1-game.progress.seal)*2,coverZ=.5-game.progress.guard*(1-game.progress.seal)*6;
      box(coverX,coverZ,6,1.65,.7,'#36a5ab');for(let i=-2;i<=2;i+=.5){const a=project(coverX+i,.75,coverZ-.5),b=project(coverX+i,.75,coverZ+.5);ctx.strokeStyle='#163e48';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
      box(8,.6,1.6,1.3,.35,'#173e48');const start=project(8,.45,.6);circle(start.x,start.y,5,game.running?'#7cf2b7':'#ffb853');
      const caption=project(0,.1,6.2);text('PUMP 07 • INTERNAL SERVICE',caption.x,caption.y,Math.max(9,scale*.33),'#a8dfd5');
      const selectedCrew=game.crew[selected];if(selectedCrew.path.length){ctx.strokeStyle='#64dfe4';ctx.lineWidth=2;ctx.setLineDash([4,5]);ctx.beginPath();const p=project(selectedCrew.x,0,selectedCrew.z);ctx.moveTo(p.x,p.y);for(const waypoint of selectedCrew.path){const q=project(waypoint.x,0,waypoint.z);ctx.lineTo(q.x,q.y);}ctx.stroke();ctx.setLineDash([]);}
      [...game.crew].sort((a,b)=>(a.x+a.z)-(b.x+b.z)).forEach(c=>{const p=project(c.x,0,c.z),s=Math.max(.65,scale/25);ctx.save();ctx.translate(p.x,p.y);ctx.scale(s,s);ctx.fillStyle='#0004';ctx.beginPath();ctx.ellipse(0,2,12,5,0,0,7);ctx.fill();if(c.id===selected){ctx.strokeStyle='#60e7ee';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,2,16,8,0,0,7);ctx.stroke();}const bob=c.path.length?Math.sin(time*12)*2:0;ctx.translate(0,bob);ctx.fillStyle='#132c35';ctx.fillRect(-7,-8,6,9);ctx.fillRect(2,-8,6,9);ctx.fillStyle=c.color;ctx.fillRect(-9,-24,18,18);circle(0,-30,10,'#e7e9da');ctx.fillStyle='#143440';ctx.fillRect(-7,-32,14,7);ctx.fillStyle=c.color;ctx.fillRect(-2,-41,4,7);ctx.fillStyle='#a7bcb7';ctx.fillRect(9,-23,5,14);ctx.restore();
        if(c.job&&!c.path.length&&!c.job.delivering){const target=TASKS.find(t=>t.id===c.job.id),q=project(target.tx,target.ty,target.tz);ctx.strokeStyle=c.role==='vacuum'?'#b9c6ab':c.role==='mechanic'?'#f8c679':'#b4fcff';ctx.lineWidth=c.role==='sprayer'?2:3;ctx.setLineDash(c.role==='vacuum'?[5,3]:[2,4]);ctx.lineDashOffset=-time*35;ctx.beginPath();ctx.moveTo(p.x+8*s,p.y-18*s);ctx.lineTo(q.x+Math.sin(time*13)*3,q.y);ctx.stroke();ctx.setLineDash([]);}
      });
    },dispose(){}
  };api.resize();return api;
}
