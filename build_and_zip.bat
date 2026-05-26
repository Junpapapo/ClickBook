@echo off
:: ClickBook Build & Zip Batch Utility
:: OS: Windows

setlocal enabledelayedexpansion

echo ===================================================
echo  ClickBook - Production Build ^& Archive Utility
echo ===================================================
echo.

:: 1. Navigate to the project root directory (containing this bat file)
cd /d "%~dp0"

:: 2. Check if package.json exists to verify we are in the correct root folder
if not exist "package.json" (
    echo [ERROR] package.json not found in this directory.
    echo Please make sure this batch file is in the ClickBook root folder.
    pause
    exit /b 1
)

:: 3. Run production build
echo [1/3] Running 'npm run build'...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] npm run build failed with exit code %errorlevel%.
    echo Aborting archive creation.
    pause
    exit /b %errorlevel%
)
echo.
echo [SUCCESS] Build completed successfully.
echo.

:: 4. Ensure target directory docs\assets\dist_zip exists and clear any existing archive
echo [2/3] Preparing destination folder...
set DEST_DIR=docs\assets\dist_zip
if not exist "%DEST_DIR%" (
    echo Destination directory "%DEST_DIR%" does not exist. Creating it...
    mkdir "%DEST_DIR%"
)
if exist "%DEST_DIR%\dist.zip" (
    echo Existing "%DEST_DIR%\dist.zip" found. Deleting for a fresh overwrite with latest build...
    del /f /q "%DEST_DIR%\dist.zip"
)
echo.

:: 5. Compress dist contents using PowerShell Compress-Archive
echo [3/3] Compressing dist contents to %DEST_DIR%\dist.zip...
:: PowerShell Compress-Archive is standard on Windows 10/11 and doesn't require external tools.
powershell -NoProfile -Command "Compress-Archive -Path 'dist\*' -DestinationPath '%DEST_DIR%\dist.zip' -Force"

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Compression failed.
    pause
    exit /b %errorlevel%
)

echo.
echo ===================================================
echo  [SUCCESS] All steps completed successfully!
echo  Archive location: %DEST_DIR%\dist.zip
echo ===================================================
echo.
pause
