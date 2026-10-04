import {randomUUID} from 'node:crypto';

// The old database remains durable storage. It is no longer in the movement loop.
export function remoteStore(url,token){
 if(!url||!token||token.length<32)throw new Error('Realtime checkpoint configuration required');
 const owner=randomUUID();let generation,worldVersion,checkpoint=0,handoff=false;
 async function call(action,extra={}){
  const response=await fetch(url,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({action,owner,generation,...extra}),signal:AbortSignal.timeout(12000)});
  if(!response.ok){const error=new Error('Checkpoint HTTP '+response.status);error.status=response.status;throw error;}
  return response.json();
 }
 return {
  get handoff(){return handoff;},
  async load(){
   const deadline=Date.now()+180000;
   while(true){
    try{const result=await call('acquire');generation=result.generation;worldVersion=result.worldVersion;return result.world;}
    catch(error){if(error.status!==409||Date.now()>deadline)throw error;await new Promise(resolve=>setTimeout(resolve,750));}
   }
  },
  async save(world){
   const payload={checkpoint:++checkpoint,worldVersion,world};
   for(let attempt=0;attempt<3;attempt++){
    try{const result=await call('save',payload);worldVersion=result.worldVersion;handoff=!!result.handoff;return;}
    catch(error){if(error.status===409||error.status===401||attempt===2)throw error;}
   }
  },
  async close(){if(generation)await call('release');}
 };
}
