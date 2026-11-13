@echo off
title Railway Tracker - Flask Backend (Port 5000)
cd /d "%~dp0backend"
echo ========================================================
echo Starting Railway Signal Incident Tracker Backend API
echo Database: railway_tracker.db (SQLite)
echo Serving API and Full Application on: http://127.0.0.1:5000
echo ========================================================
.\.venv\Scripts\python.exe app.py
pause
