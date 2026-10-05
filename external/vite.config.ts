import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
export default defineConfig({resolve:{alias:{'@':fileURLToPath(new URL('..',import.meta.url))}},root:fileURLToPath(new URL('.',import.meta.url)),publicDir:'../public',plugins:[react()],build:{outDir:'../dist/external/client',emptyOutDir:true}});
