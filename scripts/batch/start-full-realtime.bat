@echo off
setlocal

echo ========================================
echo YolNext - Start Full System + Realtime
echo ========================================

call "%~dp0start-realtime.bat"
call "%~dp0start-full-system.bat"

endlocal
