@echo off
setlocal

echo Starting YolNext Panel Test...

echo Starting full system...
call "%~dp0start-full-system.bat"

timeout /t 8 /nobreak >nul

echo Opening all panels...
start http://localhost:5173/individual/create-shipment
timeout /t 2 /nobreak >nul
start http://localhost:5173/corporate/create-shipment
timeout /t 2 /nobreak >nul
start http://localhost:5173/nakliyeci/dashboard
timeout /t 2 /nobreak >nul
start http://localhost:5173/tasiyici/dashboard

echo All panels opened for testing!
pause

endlocal










