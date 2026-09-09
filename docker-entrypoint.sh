#!/bin/bash
set -e

# Ensure output directories exist with proper permissions
mkdir -p /home/appuser/app/data_cache \
         /home/appuser/app/generated_pdfs \
         /home/appuser/app/generated_reports \
         /home/appuser/.tradingagents

case "$1" in
    web|server)
        echo "🚀 Starting TradingAgents Web Intelligence Suite on 0.0.0.0:8000..."
        exec python3 web_server.py
        ;;
    cli)
        shift
        echo "⚡ Launching TradingAgents CLI..."
        exec tradingagents "$@"
        ;;
    daemon)
        echo "🔄 Starting TradingAgents Live Market Data Pipeline Daemon..."
        exec python3 data_pipeline_daemon.py
        ;;
    audit-pdf)
        echo "📄 Compiling Executive Technical Audit PDF..."
        exec python3 generate_audit_pdf.py
        ;;
    mt5-bot)
        shift
        echo "📈 Starting MT5 Algorithmic Bot Runner..."
        exec python3 -m mt5_bot.bot_runner "$@"
        ;;
    *)
        exec "$@"
        ;;
esac
