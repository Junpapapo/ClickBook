@echo off
:: ClickBook Version Bump Utility
:: OS: Windows

setlocal enabledelayedexpansion

echo ===================================================
echo  ClickBook - Version Bump Utility
echo ===================================================
echo.

:: 1. Navigate to the project root directory
cd /d "%~dp0"

:: 2. Check if package.json exists
if not exist "package.json" (
    echo [ERROR] package.json not found in this directory.
    echo Please make sure this batch file is in the ClickBook root folder.
    pause
    exit /b 1
)

:: 3. Run TypeScript type check
echo [1/3] Checking TypeScript types ('npx tsc --noEmit')...
call npx tsc --noEmit
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] TypeScript type check failed with exit code %errorlevel%.
    echo Aborting version bump.
    pause
    exit /b %errorlevel%
)

:: 4. Run production build check
echo [2/3] Verifying production build ('npm run build')...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] npm run build failed with exit code %errorlevel%.
    echo Aborting version bump.
    pause
    exit /b %errorlevel%
)
echo.
echo [SUCCESS] Build check passed successfully.
echo.

:: 5. Execute version bump script
echo [3/3] Bumping version...
call node scripts/bump-version.js
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Version bump failed with exit code %errorlevel%.
    pause
    exit /b %errorlevel%
)

echo.
echo ===================================================
echo  [SUCCESS] Version bumped successfully!
echo ===================================================
echo.
pause
