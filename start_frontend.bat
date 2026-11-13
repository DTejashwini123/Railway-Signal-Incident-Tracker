@echo off
title Railway Tracker - React Frontend (Port 3000)
cd /d "%~dp0frontend"
echo ========================================================
echo Starting Railway Signal Incident Tracker Frontend (Vite)
echo Target Backend: http://127.0.0.1:5000
echo Development URL: http://localhost:3000
echo ========================================================
npm run dev
pause
