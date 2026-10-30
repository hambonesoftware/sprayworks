export const SOURCE={x:-4.5,y:2.1,z:6};
export const WHEEL={x:-1.6,y:2.45,z:0,r:1.45};
export const FUNNEL={x:3,y:1.7,z:0,r:1.15};
export const RATE=300;
export const GRAVITY=3.6;
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function createState(sandbox=false){return {sandbox,supply:100,collected:0,charge:0,angle:0,omega:0,open:sandbox,won:false,lost:false,emitted:0,captured:0,time:0};}
export function launch(target,pressure,pattern,random=Math.random){
 const speed=9+pressure*9,dx=target.x-SOURCE.x,dy=target.y-SOURCE.y,dz=target.z-SOURCE.z;
 const t=Math.hypot(dx,dy,dz)/speed;
 const width=pattern==='jet'?0.018:pattern==='fan'?0.3:0.2;
 return {x:SOURCE.x,y:SOURCE.y,z:SOURCE.z,vx:dx/t+(random()-.5)*width*speed,vy:dy/t+GRAVITY*t/2+(random()-.5)*width*speed*(pattern==='fan'?.16:1),vz:dz/t,life:3,volume:(2.4+pressure*2.4)/RATE,splash:false};
}
export function emit(state,target,pressure,pattern,random){
 const p=launch(target,pressure,pattern,random);
 if(!state.sandbox&&state.supply<p.volume)return null;
 if(!state.sandbox)state.supply=Math.max(0,state.supply-p.volume);
 state.emitted+=p.volume;return p;
}
export function stepState(s,dt){
 s.time+=dt;s.angle+=s.omega*dt;s.omega*=Math.exp(-.8*dt);
 if(!s.open){s.charge=clamp(s.charge+Math.abs(s.omega)*dt*.085,0,1);if(s.charge>=1)s.open=true;}
 if(s.collected>=18.75){s.won=true;}
}
export function stepParticle(p,s,dt){
 const old={x:p.x,y:p.y,z:p.z};p.vy-=GRAVITY*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.life-=dt;
 if(p.splash)return p.life<=0||p.y<=.13?'dead':null;
 // Sweep against the closed gate, so fast droplets cannot tunnel through it.
 if(!s.open&&old.z>1.3&&p.z<=1.3){const t=(old.z-1.3)/(old.z-p.z),x=old.x+(p.x-old.x)*t,y=old.y+(p.y-old.y)*t;if(x>.65&&x<4.45&&y>.2&&y<3.65){p.x=x;p.y=y;p.z=1.3;return 'gate';}}
 if(old.z>0&&p.z<=0){const t=old.z/(old.z-p.z),x=old.x+(p.x-old.x)*t-WHEEL.x,y=old.y+(p.y-old.y)*t-WHEEL.y;
 const a=-s.angle,c=Math.cos(a),sn=Math.sin(a),lx=x*c-y*sn,ly=x*sn+y*c;
 const paddle=(Math.abs(lx)<.24&&Math.abs(ly)<1.45)||(Math.abs(ly)<.24&&Math.abs(lx)<1.45);
 if(paddle){s.omega+=clamp((x*p.vy-y*p.vx)*p.volume*.4,-.08,.08);p.z=0;return 'wheel';}}
 if(old.y>=FUNNEL.y&&p.y<FUNNEL.y){const t=(old.y-FUNNEL.y)/(old.y-p.y),x=old.x+(p.x-old.x)*t,z=old.z+(p.z-old.z)*t;
 if(Math.hypot(x-FUNNEL.x,z-FUNNEL.z)<FUNNEL.r){s.collected=Math.min(25,s.collected+p.volume);s.captured+=p.volume;return 'collect';}}
 if(p.y<=.14){p.y=.14;return 'floor';}
 return p.life<=0||Math.abs(p.x)>12||Math.abs(p.z)>12?'dead':null;
}
