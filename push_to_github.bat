@echo off
title TRADE2OPTIONS -- 1-Click GitHub Push
color 0A
cls

echo ============================================================
echo    TRADE2OPTIONS -- 1-Click GitHub Uploader
echo    Repository: https://github.com/Trade2Optionss/Dalal-Street-AI
echo ============================================================
echo.

set "TARGET_DIR=%~dp0"
if exist "%TARGET_DIR%final files of screener\.git" (
    cd /d "%TARGET_DIR%final files of screener"
) else (
    cd /d "%TARGET_DIR%"
)

echo Working directory: %cd%
echo.
set /p "GITHUB_TOKEN=Enter your GitHub Personal Access Token (ghp_...): "

if "%GITHUB_TOKEN%"=="" (
    echo [ERROR] Token cannot be empty.
    pause
    exit /b 1
)

echo.
echo [1/2] Staging and verifying commits...
git add -A
git commit -m "feat: Trade2Options Dalal Street Indian Market Multi-Agent Intelligence Suite" >nul 2>&1

echo [2/2] Pushing to GitHub...
git push "https://Trade2Optionss:%GITHUB_TOKEN%@github.com/Trade2Optionss/Dalal-Street-AI.git" main --force

if %errorlevel% equ 0 (
    echo.
    echo ============================================================
    echo    SUCCESS! All files uploaded to GitHub:
    echo    https://github.com/Trade2Optionss/Dalal-Street-AI
    echo ============================================================
) else (
    echo.
    echo [ERROR] Push failed. Please check your token permissions.
)

echo.
pause
