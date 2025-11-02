@echo off
title PAYDAY Starter
cd /d %~dp0
echo === Checking Node.js ===
where node >nul 2>nul
if errorlevel 1 (
  echo [!] Node.js not found. Please install from https://nodejs.org/ and re-run this file.
  pause
  exit /b 1
)
echo === Installing dependencies (first time may take a minute) ===
npm i
if errorlevel 1 (
  echo [!] npm install failed.
  pause
  exit /b 1
)
echo === Starting PAYDAY on http://localhost:3000 ===
start "" http://localhost:3000
npm run dev
pause
