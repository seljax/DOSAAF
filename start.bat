@echo off
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js not found. Install Node.js 22 or newer from https://nodejs.org
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo [DOSAAF] node_modules not found - installing dependencies, please wait...
  call npm install
  if errorlevel 1 (
    echo [ERROR] npm install failed. See messages above.
    pause
    exit /b 1
  )
)

echo [DOSAAF] Starting server...
call npm run dev
echo.
echo [DOSAAF] Server stopped. See messages above.
pause
