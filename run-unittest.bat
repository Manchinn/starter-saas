@echo off
cd /d "%~dp0"
if not exist "server\node_modules" (
    echo Installing dependencies...
    call npm run install:all
)
call npm --workspace=server test %*
set TEST_EXIT=%ERRORLEVEL%
set REPORT=%~dp0test-results\unit-tests.html
if exist "%REPORT%" (
    echo.
    echo HTML report: %REPORT%
    start "" "%REPORT%"
) else (
    echo.
    echo WARNING: report file not found at %REPORT%
)
exit /b %TEST_EXIT%
