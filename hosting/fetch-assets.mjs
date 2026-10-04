import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
const manifest=JSON.parse(await readFile(new URL('./assets-manifest.json',import.meta.url),'utf8'));
let next=0;await Promise.all(Array.from({length:6},async()=>{while(next<manifest.files.length){const file=manifest.files[next++];const target=resolve('dist/external/client',file.path);if(!target.startsWith(resolve('dist/external/client')+'/'))throw new Error('Invalid asset path');let bytes;for(let attempt=0;attempt<3;attempt++){try{const response=await fetch(manifest.origin+'/'+file.path,{signal:AbortSignal.timeout(45000)});if(!response.ok)throw new Error('Asset HTTP '+response.status);bytes=Buffer.from(await response.arrayBuffer());if(bytes.length!==file.size||createHash('sha256').update(bytes).digest('hex')!==file.sha256)throw new Error('Asset checksum mismatch');break;}catch(error){if(attempt===2)throw new Error(file.path+': '+error.message);}}await mkdir(dirname(target),{recursive:true});await writeFile(target,bytes);}}));
console.log('Verified and installed '+manifest.files.length+' game assets.');
