@echo off
echo ========================================
echo YolNext Port Checker
echo ========================================

echo.
echo Checking port 5000 (Backend)...
netstat -ano | findstr :5000 >nul
if %errorlevel% equ 0 (
    echo ❌ Port 5000 is in use
    echo Processes using port 5000:
    netstat -ano | findstr :5000
    echo.
    echo Do you want to kill these processes? (y/n)
    set /p choice=
    if /i "%choice%"=="y" (
        for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
            taskkill /f /pid %%a >nul 2>&1
        )
        echo Processes killed
    )
) else (
    echo ✅ Port 5000 is available
)

echo.
echo Checking port 5173 (Frontend)...
netstat -ano | findstr :5173 >nul
if %errorlevel% equ 0 (
    echo ❌ Port 5173 is in use
    echo Processes using port 5173:
    netstat -ano | findstr :5173
    echo.
    echo Do you want to kill these processes? (y/n)
    set /p choice=
    if /i "%choice%"=="y" (
        for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do (
            taskkill /f /pid %%a >nul 2>&1
        )
        echo Processes killed
    )
) else (
    echo ✅ Port 5173 is available
)

echo.
echo Port check completed!
pause




