import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const modules=process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;if(!modules)throw new Error('Canvas verification needs CODEX_PRIMARY_RUNTIME_NODE_MODULES');
const runtime=createRequire(resolve(modules,'@napi-rs/canvas/package.json'));const {createCanvas,Image:CanvasImage}=runtime('@napi-rs/canvas');
const require=createRequire(import.meta.url);
class AssetImage extends CanvasImage{set src(value){super.src=resolve('public'+value);}get src(){return super.src;}}
globalThis.Image=AssetImage;globalThis.HTMLInputElement=class{};globalThis.HTMLTextAreaElement=class{};globalThis.document={activeElement:null,createElement:()=>createCanvas(1,1)};
const {loadArt}=require('../.test/components/game/art.js');const {drawGame}=require('../.test/components/game/render.js');const {createWorld,newPlayer,snapshot}=require('../.test/server/engine.js');
const art=await loadArt();
for(const index of [3,14,15]){const c=art.sprites[index],d=c.getContext('2d').getImageData(0,0,512,512).data;let minX=512,minY=512,maxX=0,maxY=0;for(let y=0;y<512;y++)for(let x=0;x<512;x++){if(d[(y*512+x)*4+3]>64){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}}assert.ok(minX>=20&&maxX<=492&&minY>=20&&maxY<=492);console.log('PASS: NPC',index,'complete silhouette, alpha bounds',minX,minY,maxX,maxY);}
const time=Date.now();const w=createWorld(time),p=newPlayer('visual','별빛 여행자',0,time);w.players[p.id]=p;const state={snapshot:snapshot(w,p,time),keys:new Set(),camera:{x:900,y:680},local:{x:900,y:740,zone:0},mouse:{x:830,y:560},clockOffset:0,lastSnapshot:time,debug:false,volume:0};
const output=createCanvas(1366,768);drawGame(output.getContext('2d'),1366,768,state,art,1/60,time);writeFileSync('.test/npc-world-verification.png',output.toBuffer('image/png'));
const contact=createCanvas(960,400),ctx=contact.getContext('2d');ctx.fillStyle='#173338';ctx.fillRect(0,0,960,400);[3,14,15].forEach((index,i)=>{ctx.drawImage(art.sprites[index],i*320,30,320,320);ctx.font='18px sans-serif';ctx.fillStyle='#e3d6a8';ctx.textAlign='center';ctx.fillText(['SERA','ROEN','ELIN'][i],i*320+160,382);});writeFileSync('.test/npc-silhouette-verification.png',contact.toBuffer('image/png'));
console.log('PASS: actual game renderer produced town and all NPC previews');
const frames=createCanvas(4*160,9*160),fc=frames.getContext('2d');fc.fillStyle='#16343a';fc.fillRect(0,0,frames.width,frames.height);
for(let cls=0;cls<3;cls++)for(let i=0;i<12;i++){const frame=art.animations[cls][i],data=frame.getContext('2d').getImageData(0,0,512,512).data;let left=512,top=512,right=0,bottom=0;for(let y=0;y<512;y++)for(let x=0;x<512;x++)if(data[(y*512+x)*4+3]>80){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}assert.ok(left>=2&&top>=2&&right<=510&&bottom<=510,`Motion frame ${cls}/${i} reaches edge: ${left},${top},${right},${bottom}`);fc.drawImage(frame,(i%4)*160,(cls*3+Math.floor(i/4))*160,160,160);}
writeFileSync('.test/motion-verification.png',frames.toBuffer('image/png'));console.log('PASS: 36 real motion frames have padded uncut silhouettes');
for(const zone of [10,16]){p.zone=zone;p.level=50;p.x=900;p.y=700;state.snapshot=snapshot(w,p,time);state.local.zone=-1;drawGame(output.getContext('2d'),1366,768,state,art,1/60,time);writeFileSync(`.test/biome-${zone}-verification.png`,output.toBuffer('image/png'));}console.log('PASS: snow and ember actual renderer previews');

for(const index of [12,13]){const frame=art.sprites[index],data=frame.getContext('2d').getImageData(0,0,512,512).data;let x1=512,y1=512,x2=0,y2=0;for(let y=0;y<512;y++)for(let x=0;x<512;x++)if(data[(y*512+x)*4+3]>80){x1=Math.min(x1,x);x2=Math.max(x2,x);y1=Math.min(y1,y);y2=Math.max(y2,y);}assert.ok(x1>=20&&y1>=20&&x2<=492&&y2<=492);console.log('PASS: elite full silhouette',index,x1,y1,x2,y2);}
const petContact=createCanvas(4*180,3*180),pc=petContact.getContext('2d');pc.fillStyle='#153438';pc.fillRect(0,0,720,540);for(let row=0;row<3;row++)for(let col=0;col<4;col++){const frame=art.pets[row][col],data=frame.getContext('2d').getImageData(0,0,512,512).data;let top=512,bottom=0;for(let y=0;y<512;y++)for(let x=0;x<512;x++)if(data[(y*512+x)*4+3]>80){top=Math.min(top,y);bottom=Math.max(bottom,y);}assert.ok(top>=2&&bottom<510);pc.drawImage(frame,col*180,row*180,180,180);}writeFileSync('.test/pet-frames-verification.png',petContact.toBuffer('image/png'));p.petId=0;p.pets=[0];p.zone=1;state.snapshot=snapshot(w,p,time);state.local.zone=-1;drawGame(output.getContext('2d'),1366,768,state,art,1/60,time);writeFileSync('.test/pet-world-verification.png',output.toBuffer('image/png'));

// Render real chat bubbles and the new arena through the production Canvas code.
const {enterRaid}=require('../.test/server/raids.js');
p.level=30;p.gold=5000;enterRaid(w,p,0,time);p.bubbleId=11;
w.chat.push({id:p.id+':bubble',playerId:p.id,name:p.name,text:'별빛의 수호자들이여, 함께 성소를 지켜 주세요! 공격 경고를 피하면서 전투를 준비합니다.',time,zone:p.zone});
state.snapshot=snapshot(w,p,time);state.local.zone=-1;state.debug=true;
drawGame(output.getContext('2d'),1366,768,state,art,1/60,time);writeFileSync('.test/raid-bubble-verification.png',output.toBuffer('image/png'));
console.log('PASS: actual arena renderer, collision contour and multiline equipped speech bubble');

const batContact=createCanvas(960,260),bc=batContact.getContext('2d');bc.fillStyle='#101925';bc.fillRect(0,0,960,260);for(let i=0;i<4;i++){const frame=art.batFrames[i],d=frame.getContext('2d').getImageData(0,0,512,512).data;let l=512,t=512,r=0,b=0;for(let y=0;y<512;y++)for(let x=0;x<512;x++)if(d[(y*512+x)*4+3]>64){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);}assert.ok(l>=20&&r<=492&&t>=20&&b<=492,`Bat frame ${i} clipped: ${l},${t},${r},${b}`);bc.drawImage(frame,i*240,0,240,240);console.log('PASS: bat flight frame',i,'padded bounds',l,t,r,b);}writeFileSync('.test/bat-flight-verification.png',batContact.toBuffer('image/png'));for(const zone of [28,29]){p.zone=zone;p.level=50;state.snapshot=snapshot(w,p,time);state.local.zone=-1;drawGame(output.getContext('2d'),1366,768,state,art,1/60,time);writeFileSync(`.test/plaza-${zone}-verification.png`,output.toBuffer('image/png'));}

const monsterContact=createCanvas(1000,440),mc=monsterContact.getContext('2d');mc.fillStyle='#132333';mc.fillRect(0,0,1000,440);for(let i=4;i<=13;i++){const frame=art.sprites[i],d=frame.getContext('2d').getImageData(0,0,512,512).data;let left=512,top=512,right=0,bottom=0;for(let y=0;y<512;y++)for(let x=0;x<512;x++)if(d[(y*512+x)*4+3]>80){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}assert.ok(left>=20&&top>=20&&right<=492&&bottom<=492,`Monster ${i} outside padded area`);mc.drawImage(frame,(i-4)%5*200,Math.floor((i-4)/5)*220,200,200);mc.fillStyle='#ecd4a2';mc.font='14px sans-serif';mc.fillText('MONSTER '+i,(i-4)%5*200+45,Math.floor((i-4)/5)*220+215);}writeFileSync('.test/all-monsters-v12.png',monsterContact.toBuffer('image/png'));console.log('PASS: all 10 monster silhouettes fit padded frames');

const motionContact=createCanvas(4*180,4*180),motionCtx=motionContact.getContext('2d');motionCtx.fillStyle='#14202d';motionCtx.fillRect(0,0,720,720);
for(const [row,sprite] of [11,22,23,24].entries())for(let col=0;col<4;col++){
 const frame=art.monsterAnimations[sprite][col],data=frame.getContext('2d').getImageData(0,0,512,512).data;
 let l=512,t=512,r=0,b=0;for(let y=0;y<512;y++)for(let x=0;x<512;x++)if(data[(y*512+x)*4+3]>64){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);}
 assert.ok(l>=20&&t>=20&&r<=492&&b<=492,`Monster ${sprite}/${col} clipping: ${l},${t},${r},${b}`);
 motionCtx.drawImage(frame,col*180,row*180,180,180);
}
writeFileSync('.test/monster-motion-v13-verification.png',motionContact.toBuffer('image/png'));console.log('PASS: all 16 monster frames preserve complete silhouettes and transparent gutters');
