import {gmLocalConfig} from './gm-config.mjs';
import {fileURLToPath} from 'node:url';
const base=fileURLToPath(new URL('..',import.meta.url));
console.log('\nGM Admin login code: '+gmLocalConfig(base).loginCode+'\n');
console.log('Open GM-WINDOWS.bat, then enter this code. Never share your backend token.');
