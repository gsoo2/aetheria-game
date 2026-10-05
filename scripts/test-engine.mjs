import {writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
writeFileSync('.test/package.json','{"type":"commonjs"}');
const result=spawnSync(process.execPath,['--test','.test/tests/gm-v14.test.js','.test/tests/beginner-tutorial-skins.test.js','.test/tests/google-auth.test.js','.test/tests/quests-v13.test.js','.test/tests/engine.test.js','.test/tests/convenience.test.js','.test/tests/gm.test.js','.test/tests/cash.test.js','.test/tests/workshop.test.js','.test/tests/plazas.test.js'],{stdio:'inherit'});
process.exit(result.status??1);
