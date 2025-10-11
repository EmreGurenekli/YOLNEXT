@echo off
echo ========================================
echo    YolNet Kargo - Production Deploy
echo ========================================
echo.

echo Building project...
call scripts\prod\build.bat

echo.
echo Deploying to production...
echo Please configure your deployment settings in docs/deployment/README.md
echo.

pause







