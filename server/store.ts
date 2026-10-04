import {ownedPlayer} from '../shared/accounts';
import {env} from 'cloudflare:workers';
import {applyInput,createWorld,migrateWorld,newPlayer,snapshot,tickWorld} from './engine';
import type {Input,World,Snapshot} from '../shared/types';
const DB=()=>{if(!env.DB)throw new Error('Progress storage unavailable');return env.DB;};
export async function readWorld(){const row=await DB().prepare('SELECT data, version FROM realms WHERE id = ?').bind('aetheria').first<{data:string;version:number}>();if(!row)return null;const world=JSON.parse(row.data) as World;migrateWorld(world,Date.now());return {world,version:row.version};}
type Job={accountId?:string;id:string;input:Input;join?:{name:string;classId:number};resolve:(s:Snapshot|null)=>void;reject:(e:unknown)=>void};
let jobs:Job[]=[],scheduled=false,running=false;
// Share one durable read / compare-and-swap across concurrent players. No in-memory world authority.
async function flush(){scheduled=false;if(running)return;running=true;const batch=jobs.splice(0);try{let committed=false;for(let attempt=0;attempt<10;attempt++){let row=await readWorld();if(!row){await DB().prepare('INSERT OR IGNORE INTO realms (id,data,version) VALUES (?,?,0)').bind('aetheria',JSON.stringify(createWorld(Date.now()))).run();row=await readWorld();}if(!row)throw new Error('Realm unavailable');const {world,version}=row,now=Date.now();tickWorld(world,now);for(const j of batch){let p=j.accountId?ownedPlayer(world,j.accountId,j.id):world.players[j.id];if(!p&&j.join){p=newPlayer(j.id,j.join.name,j.join.classId,now);world.players[j.id]=p;}if(!p)continue;if(j.join){p.seen=now;p.last=now;}else applyInput(world,p,j.input,now);}const result=await DB().prepare('UPDATE realms SET data=?,version=version+1 WHERE id=? AND version=?').bind(JSON.stringify(world),'aetheria',version).run();if(result.meta.changes===1){batch.forEach(j=>j.resolve((!j.accountId||ownedPlayer(world,j.accountId,j.id))&&world.players[j.id]?snapshot(world,world.players[j.id],now):null));committed=true;break;}}if(!committed)throw new Error('Realm busy, retry');}catch(e){batch.forEach(j=>j.reject(e));}finally{running=false;if(jobs.length)schedule();}}
function schedule(){if(!scheduled&&!running){scheduled=true;setTimeout(()=>void flush(),25);}}
export function mutate(id:string,input:Input,join?:{name:string;classId:number},accountId?:string){return new Promise<Snapshot|null>((resolve,reject)=>{jobs.push({id,input,join,accountId,resolve,reject});schedule();});}

// Account and chat writes share the same D1 compare-and-swap as gameplay.
export async function transactWorld<T>(change:(w:World,now:number)=>T):Promise<T>{
 for(let attempt=0;attempt<12;attempt++){
  let row=await readWorld();
  if(!row){await DB().prepare('INSERT OR IGNORE INTO realms (id,data,version) VALUES (?,?,0)').bind('aetheria',JSON.stringify(createWorld(Date.now()))).run();row=await readWorld();}
  if(!row)throw new Error('Realm unavailable');
  const result=change(row.world,Date.now());
  const committed=await DB().prepare('UPDATE realms SET data=?,version=version+1 WHERE id=? AND version=?').bind(JSON.stringify(row.world),'aetheria',row.version).run();
  if(committed.meta.changes===1)return result;
 }
 throw new Error('Realm busy, retry');
}
