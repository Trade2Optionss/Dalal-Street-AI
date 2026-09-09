---
title: "Storage & File Architecture Map"
tags:
  - architecture
  - storage
  - files
  - cache
  - tradingagents
---

# 📁 File & Storage Architecture Map

> [!important] **Storage Transparency**
> This document maps every single directory, file type, data cache, checkpoint, memory log, and report produced by the TradingAgents multi-agent framework.

---

## 🗺️ Complete Storage Topology

```mermaid
flowchart TD
    ROOT["🏠 TradingAgents Project Root"]

    subgraph VAULT["📑 Obsidian Knowledge Vault (`obsidian/`)"]
        DASH["`00_Dashboard.md` (Central Hub)"]
        CANV["`TradingAgents_Architecture.canvas`"]
        AGENTS["`01_Agents/*.md` (Agent Profiles)"]
        SOURCES["`02_Data_Sources/*.md` (Data Feeds)"]
        STOR["`03_Storage_Architecture/`"]
        REPORTS["`04_Run_Reports/*.md` (Obsidian Runs)"]
    end

    subgraph RUN_OUTPUTS["📊 Execution Reports (`results_dir/reports/`)"]
        RUN_DIR["`<ticker>_<timestamp>/`"]
        R_ANALYSTS["`1_analysts/` (market.md, sentiment.md, news.md, fundamentals.md)"]
        R_RESEARCH["`2_research/` (bull.md, bear.md, manager.md)"]
        R_TRADING["`3_trading/` (trader.md)"]
        R_RISK["`4_risk/` (aggressive.md, neutral.md, conservative.md)"]
        R_PM["`5_portfolio/` (decision.md)"]
        R_ALL["`complete_report.md`"]
    end

    subgraph CACHE_STORE["💾 Data Cache & State (`data_cache_dir/`)"]
        C_PRICES["`prices/` (Cached OHLCV Parquet/JSON)"]
        C_NEWS["`news/` (Cached news sentiment JSON)"]
        C_FUND["`fundamentals/` (Cached company balance sheets)"]
        C_CHECK["`checkpoints/` (LangGraph recovery state)"]
    end

    subgraph MEMORY_STORE["🧠 Long-term Memory (`memory_log_path`)"]
        MEM_FILE["`trading_memory.md` (Historical trades & self-reflections)"]
    end

    ROOT --> VAULT
    ROOT --> RUN_OUTPUTS
    ROOT --> CACHE_STORE
    ROOT --> MEMORY_STORE

    RUN_DIR --> R_ANALYSTS & R_RESEARCH & R_TRADING & R_RISK & R_PM & R_ALL
```

---

## 📂 Detailed Directory & File Reference Table

| Path / Folder | Purpose | Managed By | Configuration Key |
| :--- | :--- | :--- | :--- |
| `obsidian/` | Obsidian Vault & visual architecture | Obsidian / TradingAgents | Local directory |
| `obsidian/04_Run_Reports/` | Obsidian-formatted trade reports with wikilinks & tags | `tradingagents/obsidian_exporter.py` | Automatic export |
| `results_dir/reports/<ticker>_<time>/` | Raw Markdown reports generated per run | `tradingagents/reporting.py` | `TRADINGAGENTS_RESULTS_DIR` |
| `data_cache_dir/` | Cache for API responses (AlphaVantage, YFinance, Finnhub) | `tradingagents/dataflows/` | `TRADINGAGENTS_CACHE_DIR` |
| `data_cache_dir/checkpoints/` | LangGraph node checkpoints for crash resumption | `tradingagents/graph/checkpointer.py` | `checkpoint_enabled: true` |
| `memory_log_path` (`trading_memory.md`) | Persistent ledger of trade rationales and reflection learnings | `tradingagents/agents/utils/memory.py` | `TRADINGAGENTS_MEMORY_LOG_PATH` |

---

## 🔍 Step-by-Step Execution File Generation

When you run a ticker analysis (e.g. `python3 main.py` or CLI `tradingagents run`):

1. **Analyst Step**:
   - `1_analysts/market.md` ➔ Produced by [[Market_Analyst]]
   - `1_analysts/sentiment.md` ➔ Produced by [[Sentiment_Analyst]]
   - `1_analysts/news.md` ➔ Produced by [[News_Analyst]]
   - `1_analysts/fundamentals.md` ➔ Produced by [[Fundamentals_Analyst]]
2. **Debate Step**:
   - `2_research/bull.md` ➔ Produced by [[Bull_Researcher]]
   - `2_research/bear.md` ➔ Produced by [[Bear_Researcher]]
   - `2_research/manager.md` ➔ Produced by [[Research_Manager]]
3. **Trader Step**:
   - `3_trading/trader.md` ➔ Produced by [[Trader_Agent]]
4. **Risk Debate Step**:
   - `4_risk/aggressive.md`, `neutral.md`, `conservative.md` ➔ Produced by [[Risk_Management_Team]]
5. **Portfolio Final Step**:
   - `5_portfolio/decision.md` ➔ Produced by [[Portfolio_Manager]]
   - `complete_report.md` ➔ Consolidated single-file summary
   - `obsidian/04_Run_Reports/<ticker>_<date>.md` ➔ Interactive Obsidian note
