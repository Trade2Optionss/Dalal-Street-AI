---
title: "Data Source: YFinance (Yahoo Finance)"
tags:
  - datasource
  - yfinance
  - market-data
  - prices
  - tradingagents
provider: "Yahoo Finance"
code_module: "tradingagents/dataflows/y_finance.py"
env_var: "None (Public API)"
consuming_agents:
  - "[[Market_Analyst]]"
  - "[[News_Analyst]]"
---

# 📊 YFinance Dataflow

> [!abstract] **Data Provider Overview**
> **YFinance** provides direct market quotes, historical daily/intraday OHLCV candlestick bars, volume data, and corporate news headlines without requiring an API key.

---

## 🛠️ Modules & Capabilities

- **Market Prices & Bars**: `tradingagents/dataflows/y_finance.py`
  - Fetches Open, High, Low, Close, Volume series across custom date ranges.
  - Multi-asset support: Equities, ETFs, Crypto pairs, and Commodities.
- **News Extraction**: `tradingagents/dataflows/yfinance_news.py`
  - Extracts breaking news articles and publisher metadata.

---

## 🤖 Consuming Agents

```mermaid
flowchart LR
    YF["[[YFinance]] Quotes & Bars"] --> MA["[[Market_Analyst]]"]
    YF --> NA["[[News_Analyst]]"]
```

---

## ⚙️ Caching Strategy
- Price bars are cached locally in parquet/JSON format under `data_cache_dir` to accelerate backtests and multi-agent runs (see [[File_Storage_Map]]).
