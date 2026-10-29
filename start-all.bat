@echo off
title AI Failure Prediction Launcher
echo =======================================================
echo   Starting AI Equipment Failure Prediction System
echo =======================================================
echo.

echo [1/2] Launching FastAPI Backend on port 8000...
start "Backend - FastAPI" cmd /k "cd /d "%~dp0backend" && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Launching React Frontend on port 5173...
start "Frontend - Vite" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Waiting for servers to initialize...
timeout /t 3 /nobreak >nul

echo Opening browser at http://localhost:5173 ...
start http://localhost:5173

echo.
echo Both servers are running! Keep their command windows open.
pause
