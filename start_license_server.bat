@echo off
title TRADE2OPTIONS — License Authority & HWID Server (Port 8060)
color 0E

cd /d "%~dp0"

echo ==============================================================================
echo    TRADE2OPTIONS -- License Authority & HWID Security Server
echo ==============================================================================
echo.

:: 1. Locate Python
set "PY_BIN="
where python >nul 2>&1
if %errorlevel% equ 0 (
    set "PY_BIN=python"
) else (
    where py >nul 2>&1
    if %errorlevel% equ 0 (
        set "PY_BIN=py"
    ) else (
        if exist "C:\Python313\python.exe" (
            set "PY_BIN=C:\Python313\python.exe"
        ) else if exist "C:\Python312\python.exe" (
            set "PY_BIN=C:\Python312\python.exe"
        ) else if exist "C:\Python311\python.exe" (
            set "PY_BIN=C:\Python311\python.exe"
        ) else (
            echo [ERROR] Python not found in system PATH.
            echo Please install Python 3.10+ from https://www.python.org/
            echo.
            pause
            exit /b 1
        )
    )
)

echo [1/3] Using Python: %PY_BIN%

:: 2. Verify requirements
echo [2/3] Checking dependencies...
"%PY_BIN%" -m pip install -r requirements.txt --quiet --disable-pip-version-check

:: 3. Launch License Server & Open Browser
echo [3/3] Starting License Authority Server on http://127.0.0.1:8060 ...
echo.
echo ==============================================================================
echo   License Admin UI : http://127.0.0.1:8060
echo   Public Terminal  : http://127.0.0.1:8050
echo ==============================================================================
echo.
echo Server is running on port 8060. Press Ctrl+C or close window to stop.
echo.

:: Open browser after 2 seconds
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://127.0.0.1:8060"

:: Run Server
"%PY_BIN%" license_server.py

pause
