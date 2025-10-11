@echo off
echo ========================================
echo YolNet Kargo Platform - Production Start
echo ========================================

echo Starting production servers...

REM Check if Docker is running
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker is not installed or not running!
    echo Please install Docker Desktop and try again.
    pause
    exit /b 1
)

REM Start with Docker Compose
echo Starting with Docker Compose...
docker-compose up -d

echo ========================================
echo Production servers started!
echo ========================================
echo Frontend: http://localhost:5173
echo Backend: http://localhost:5000
echo API: http://localhost:5000/api
echo ========================================

echo.
echo To stop servers: docker-compose down
echo To view logs: docker-compose logs -f
echo.

pause



