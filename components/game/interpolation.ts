type Sample={time:number;x:number;y:number};
export class PositionBuffer {
 private samples:Sample[]=[];
 add(time:number,x:number,y:number){
  const last=this.samples.at(-1);if(last&&time<=last.time)return;
  if(last&&Math.hypot(x-last.x,y-last.y)>250)this.samples=[];
  this.samples.push({time,x,y});if(this.samples.length>24)this.samples.shift();
 }
 at(time:number,predictMs=0){
  if(!this.samples.length)return null;
  const first=this.samples[0],last=this.samples.at(-1)!;
  if(time<=first.time)return {...first,moving:false,face:1};
  let face=1;
  for(let i=1;i<this.samples.length;i++){
   const b=this.samples[i],a=this.samples[i-1],dx=b.x-a.x,dy=b.y-a.y;
   if(Math.abs(dx)>.1)face=dx<0?-1:1;
   if(time<=b.time){const t=(time-a.time)/(b.time-a.time);return {x:a.x+dx*t,y:a.y+dy*t,moving:Math.hypot(dx,dy)>1,face};}
  }
  const prior=this.samples.at(-2);if(!prior||!predictMs)return {...last,moving:false,face};
  const span=last.time-prior.time,dx=last.x-prior.x,dy=last.y-prior.y;
  // Short, speed-limited prediction hides late packets; velocity decays to a stop.
  const age=Math.max(0,time-last.time),window=Math.min(180,Math.max(0,predictMs)),elapsed=Math.min(age,window);
  if(span<=0||Math.hypot(dx,dy)<.5||!window)return {...last,moving:false,face};
  const speed=Math.hypot(dx,dy)/span,cap=Math.min(1,.26/Math.max(.0001,speed));
  const travel=elapsed-elapsed*elapsed/(2*window);
  return {x:last.x+dx/span*travel*cap,y:last.y+dy/span*travel*cap,time,moving:age<window,face};
 }
}
// A delayed playback clock follows packet cadence without moving backwards on jitter.
export class SnapshotTimeline {
 private latest=0;private arrival=0;private interval=100;private jitter=0;private playback:number|null=null;private frameAt=0;
 add(serverTime:number,arrival:number){
  if(this.latest&&serverTime<=this.latest)return;
  if(this.arrival){const gap=Math.min(1500,Math.max(20,arrival-this.arrival));this.jitter=this.jitter*.8+Math.abs(gap-this.interval)*.2;this.interval=this.interval*.85+gap*.15;}
  this.latest=serverTime;this.arrival=arrival;
 }
 get delay(){return Math.min(450,Math.max(110,this.interval*1.1+this.jitter*1.5));}
 at(arrival:number){
  const target=this.latest+Math.max(0,arrival-this.arrival)-this.delay;
  if(this.playback===null||arrival-this.frameAt>500){this.playback=target;this.frameAt=arrival;return target;}
  const elapsed=Math.max(0,Math.min(100,arrival-this.frameAt)),error=target-this.playback;
  this.playback+=elapsed*(error>80?1.2:error< -40?.75:1);this.frameAt=arrival;return this.playback;
 }
}
