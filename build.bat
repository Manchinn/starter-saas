@echo off
echo Building frontend...
cd client
call npm run build
if %ERRORLEVEL% neq 0 (
  echo Build failed.
  exit /b %ERRORLEVEL%
)
echo Build complete. Output in client/dist/
