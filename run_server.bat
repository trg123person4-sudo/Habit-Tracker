@echo off
title NudgePoint Production Hub
echo ========================================================
echo   ⚡ NudgePoint — Classroom Pulse & Comprehension Radar
echo ========================================================
echo.

set LAN_FLAG=
if /i "%1"=="--lan" (
    set LAN_FLAG=--lan
    echo [LAN MODE ENABLED] Binding to 0.0.0.0 (Accessible across your local network)
    echo To test on mobile: Connect phone to same Wi-Fi and open:
    echo   http://YOUR_PC_IP:8080/#view=student^&room=CALC
) else (
    echo [SECURE DEFAULT] Binding strictly to 127.0.0.1 (Localhost Only)
    echo To allow phones on your local Wi-Fi to connect, run:
    echo   run_server.bat --lan
)

echo.
echo Local URL: http://localhost:8080
echo Press Ctrl+C in this window to stop the server.
echo.

where py >nul 2>nul
if %ERRORLEVEL% equ 0 (
    py server.py %LAN_FLAG%
    goto end
)

where python >nul 2>nul
if %ERRORLEVEL% equ 0 (
    python server.py %LAN_FLAG%
    goto end
)

echo Neither 'py' nor 'python' was found on PATH.
pause

:end
