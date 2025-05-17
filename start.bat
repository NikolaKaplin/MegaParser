@echo off
chcp 1251 > nul
SETLOCAL

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js is not installed. installing...
    powershell -Command "Invoke-WebRequest 'https://nodejs.org/dist/v22.15.1/node-v22.15.1-x64.msi' -OutFile 'node-installer.msi'"
    msiexec /i node-installer.msi /quiet /norestart
    del node-installer.msi
    echo Node.js installed. Please, restart start.bat...
    pause
    exit /b
)

where tsx >nul 2>nul
if %errorlevel% neq 0 (
    echo tsx is not installed. installing global...
    npm install -g tsx
)

if exist package.json (
    if not exist node_modules (
        echo Installing npm packages...
        npm install
        if %errorlevel% equ 0 (
            echo Installing Playwright browsers...
            npx playwright install
        ) else (
            echo "Error: npm install failed!"
        )
    ) else (
        echo node_modules exist, skipping npm install...
    )
)

echo Start parser scripts...
tsx index.ts

pause
ENDLOCAL