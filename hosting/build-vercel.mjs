import {readFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const root=resolve('dist/external/client');
const html=await readFile(resolve(root,'index.html'),'utf8');
for(const match of html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)[^"]*"/g)){
 await access(resolve(root,'.'+match[1]));
}
const manifest=JSON.parse(await readFile('hosting/assets-manifest.json','utf8'));
let complete=true;
for(const file of manifest.files){
 try{
  const bytes=await readFile(resolve(root,file.path));
  if(bytes.length!==file.size||createHash('sha256').update(bytes).digest('hex')!==file.sha256){complete=false;break;}
 }catch{complete=false;break;}
}
if(!complete)await import('./fetch-assets.mjs');
console.log('Vercel game client ready; '+manifest.files.length+' original assets verified.');
