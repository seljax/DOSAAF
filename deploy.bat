@echo off
cd /d "%~dp0"
set "TARGET=B:\DOSAAF"

if not exist "%TARGET%\server.ts" (
  echo [ERROR] Server folder %TARGET% not found.
  echo Check that network drive B: is connected and contains the DOSAAF folder.
  pause
  exit /b 1
)

echo [DOSAAF] Copying updated files to %TARGET% ...
echo.

robocopy "src" "%TARGET%\src" /E /XO /NJH /NJS /NDL /NP
if errorlevel 8 goto fail

robocopy "public" "%TARGET%\public" /E /XO /NJH /NJS /NDL /NP
if errorlevel 8 goto fail

for %%F in (package.json vite.config.ts index.html start.bat) do (
  robocopy "." "%TARGET%" "%%F" /XO /NJH /NJS /NDL /NP >nul
)

echo.
echo [DOSAAF] Done. Refresh the site page with Ctrl+F5.
echo If server.ts or package.json changed - restart the server.
pause
exit /b 0

:fail
echo.
echo [ERROR] Copy failed. See messages above.
pause
exit /b 1
