@echo off
REM Safe test runner - prevents OOM errors
REM Sets memory limits and uses API-only tests

echo Starting Safe Test Mode (API-only, prevents memory issues)...
echo.

REM Set Node.js memory limit (adjust based on your system)
set NODE_OPTIONS=--max-old-space-size=2048

REM Run test with API-only mode
set USE_BROWSER_TESTS=false
set CONCURRENT_USERS=5
set TOTAL_USERS=5000

node tools/comprehensive-live-test.cjs

pause

REM Safe test runner - optimized for system stability
echo ==========================================
echo Safe Comprehensive Test Runner
echo ==========================================
echo.
echo This test uses:
echo - Only 3 concurrent browser instances (reduced from 50)
echo - 90%% API tests + 10%% browser tests (reduces system load)
echo - Optimized timeouts and resource limits
echo - Proper cleanup between batches
echo.
echo Starting test with 5000 users...
echo.

REM Set Node options for better memory management
set NODE_OPTIONS=--max-old-space-size=4096 --expose-gc

REM Run test
node --expose-gc tools/comprehensive-live-test.cjs

pause

