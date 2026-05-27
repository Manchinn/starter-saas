@echo off
cd /d "%~dp0"
if not exist "server\node_modules" (
    echo Installing dependencies...
    call npm run install:all
)
call npm --workspace=server test %*
exit /b %ERRORLEVEL%
