#!/bin/bash
# TRADE2OPTIONS — License Authority Launch Script (Mac & Linux)
# Runs dedicated License Key & HWID Manager on port 8060

echo "============================================================="
echo "🔑 TRADE2OPTIONS — Dedicated License & HWID Authority Server"
echo "============================================================="

cd "$(dirname "$0")"

# 1. Check Python installation
if ! command -v python3 &> /dev/null
then
    echo "❌ Python 3 is not installed. Please install Python 3.9+ from https://www.python.org"
    exit 1
fi

echo "📦 1. Verifying dependencies..."
python3 -m pip install -r requirements.txt --quiet

echo "⚡ 2. Launching License Authority Server on port 8060..."
echo "🌐 License Dashboard: http://127.0.0.1:8060"
echo "🌐 Public Terminal:   http://127.0.0.1:8050"
echo "============================================================="

python3 license_server.py
