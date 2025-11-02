#!/bin/bash
cd "$(dirname "$0")"
echo "=== Checking Node.js ==="
if ! command -v node >/dev/null 2>&1; then
  echo "[!] Node.js not found. Install from https://nodejs.org/ then re-run this file."
  exit 1
fi
echo "=== Installing dependencies (first time may take a minute) ==="
npm i || { echo "[!] npm install failed"; exit 1; }
echo "=== Starting PAYDAY on http://localhost:3000 ==="
open "http://localhost:3000"
npm run dev
