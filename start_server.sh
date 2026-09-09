#!/bin/bash
# TRADE2OPTIONS — 1-Click Launch Script (Mac & Linux)

echo "============================================================="
echo "🚀 TRADE2OPTIONS — Indian Stock Market Multi-Agent Suite"
echo "============================================================="

# 1. Check Python installation
if ! command -v python3 &> /dev/null
then
    echo "❌ Python 3 is not installed. Please install Python 3.9+ from https://www.python.org"
    exit 1
fi

echo "📦 1. Verifying and installing required dependencies..."
python3 -m pip install -r requirements.txt --quiet

echo "⚡ 2. Launching Live Data Pipeline & Web Server..."
echo "🌐 Dashboard will be available at: http://127.0.0.1:8050"
echo "============================================================="

python3 web_server.py
