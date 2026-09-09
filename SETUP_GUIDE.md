# TRADE2OPTIONS — Complete Installation & Setup Guide

This standalone package contains the complete **TRADE2OPTIONS Multi-Agent Intelligence Suite (Indian Equities NSE/BSE Edition)** ready to run on any computer (Mac, Windows, or Linux).

---

## 🚀 Quick 1-Click Launch

### On Windows PC:
1. Double-click **`start_server.bat`**.
2. Open your browser and go to **`http://localhost:8000`** (or `http://127.0.0.1:8000`).

### On Mac / Linux:
1. Open Terminal in this folder.
2. Run:
   ```bash
   ./start_server.sh
   ```
3. Open your browser and go to **`http://localhost:8000`**.

---

## 📋 Manual Setup (Optional)

If you prefer to run manually in a virtual environment:

```bash
# 1. Create a virtual environment
python3 -m venv venv

# 2. Activate virtual environment
# On Mac/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# 3. Install requirements
pip install -r requirements.txt

# 4. Start the server
python web_server.py
```

---

## 🌐 Included Modules & Workspaces

1. **🏆 Our Results & Past Performance Ledger:**
   - On-screen verifiable past records reconciled against live TradingView EOD closing prices.
   - Dynamic Market Session detector (Pre-Market / Live Market / Post-Market).
   - Smart Tomorrow Radar: Next-day earnings dates, institutional block buys, and pre-market setups.
   - Live Discord Webhook Dispatcher for signal and ledger broadcasting.

2. **🔍 Universal NSE/BSE Research Terminal:**
   - Universal search across all Indian equities.
   - ROCE, PAT, P/E, RSI, Delivery Volumes, and SEBI-aligned PDF Audit Reports in INR (₹).

3. **⚔️ Stock Comparison & Bull/Bear Sentiment Radar:**
   - Daily Advance/Decline market breadth, FII/DII Net Flow tracker, Nifty PCR.
   - Top Bull-Side vs. Top Bear-Side split boards.
   - Head-to-Head Stock Battle Comparator (Stock A vs. Stock B).

4. **📰 20-Stock Conviction Matrix & Publishing Hub:**
   - Live 20 NSE bluechip conviction leaderboard with 1-click Substack / Ghost / CMS export.

5. **🥊 Adversarial War Room Arena & Live Widgets:**
   - Animated Bull vs. Bear debate duel for ANY Indian stock.
   - LMS "Challenge the Committee" Trade Grader with live price validation.
   - Embeddable Indian market widgets.

6. **⚡ Zero-Lag Live Market Data Pipeline Daemon:**
   - `data_pipeline_daemon.py`: Background worker continuously scanning TradingView India Scanner with sub-millisecond memory caching and automated target hit alerts.

---

## 🤖 Discord Webhook Configuration
The pre-configured Discord Webhook is active:
`https://discord.com/api/webhooks/1543704850804641803/...`

To change or update the webhook URL, edit `DISCORD_WEBHOOK_DEFAULT` in `web_server.py` or enter your webhook URL directly in the UI.

---

## 📞 Support & Verification
- Server Health Check: `http://localhost:8000/api/health`
- Live Pulse Telemetry: `http://localhost:8000/api/market/live-pulse`
- Pipeline Status: `http://localhost:8000/api/pipeline/status`
