@echo off
title Railway Signal Incident Tracker - Launcher
echo ========================================================
echo Launching Railway Signal Incident Tracker (P15)
echo ========================================================
echo Starting Backend Server on port 5000...
start "" "%~dp0start_backend.bat"
timeout /t 3 /nobreak >nul
echo Starting Frontend Server on port 3000...
start "" "%~dp0start_frontend.bat"
echo.
echo ========================================================
echo Both services are now running!
echo Access the full application at:
echo   - Option 1 (Direct Unified Full-Stack): http://127.0.0.1:5000
echo   - Option 2 (Vite React Dev Server):    http://localhost:3000
echo ========================================================
pause
