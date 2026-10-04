import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
const dir='.sites-runtime/i18n-tests';mkdirSync(dir,{recursive:true});
const build=spawnSync(process.execPath,['node_modules/typescript/bin/tsc','tests/i18n.test.ts','--target','es2022','--module','commonjs','--moduleResolution','node','--jsx','react-jsx','--esModuleInterop','--skipLibCheck','--outDir',dir],{stdio:'inherit'});if(build.status!==0)process.exit(build.status??1);
writeFileSync(dir+'/package.json','{"type":"commonjs"}');
const result=spawnSync(process.execPath,['--test',dir+'/tests/i18n.test.js'],{stdio:'inherit'});process.exit(result.status??1);
