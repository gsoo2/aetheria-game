@echo off
cd /d "%~dp0.."
where node >nul 2>nul
if errorlevel 1 (
 echo Please install Node.js 22 or 24 LTS first.
 pause
 exit /b 1
)
if not exist node_modules (
 call npm install --omit=dev
 if errorlevel 1 exit /b 1
)
node local/run.mjs
pause
