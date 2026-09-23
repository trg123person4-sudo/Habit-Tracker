@echo off
title PulseChat Launchpad
echo ========================================================
echo   ⚡ PulseChat — Next-Gen Real-Time Messaging Hub
echo ========================================================
echo.
echo [1/2] Starting Backend API & Socket Server (Port 4000)...
start "PulseChat Backend" cmd /k "set PATH=C:\Program Files\nodejs;%PATH% && cd /d %~dp0realtime-chat\apps\server && npm run dev"

echo [2/2] Starting Frontend Web Application (Port 5173)...
start "PulseChat Web" cmd /k "set PATH=C:\Program Files\nodejs;%PATH% && cd /d %~dp0realtime-chat\apps\web && npm run dev"

echo.
echo ========================================================
echo   PulseChat successfully launched!
echo   Web App: http://localhost:5173
echo   API Hub: http://localhost:4000
echo ========================================================
echo.
timeout /t 4 >nul
start http://localhost:5173
