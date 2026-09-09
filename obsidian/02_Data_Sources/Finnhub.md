---
title: "Data Source: Finnhub"
tags:
  - datasource
  - finnhub
  - fundamentals
  - earnings
  - tradingagents
provider: "Finnhub"
code_module: "tradingagents/dataflows/interface.py"
env_var: "FINNHUB_API_KEY"
consuming_agents:
  - "[[Fundamentals_Analyst]]"
---

# 🏢 Finnhub Financial Dataflow

> [!abstract] **Data Provider Overview**
> **Finnhub** supplies real-time financial fundamentals, SEC filings, insider sentiment, earnings surprise history, and analyst recommendation consensus.

---

## 🛠️ Modules & Capabilities

- **Financial Statements**: Standardized quarterly and annual Balance Sheets, Income Statements, and Cash Flows.
- **Insider Activity**: Aggregated executive transactions, buy/sell ratios, and net share movements.
- **Valuation Metrics**: Trailing and Forward Price-to-Earnings, Enterprise Value, Debt ratios.

---

## 🤖 Consuming Agents

```mermaid
flowchart LR
    FH["[[Finnhub]] Financials & SEC Data"] --> FA["[[Fundamentals_Analyst]]"]
```

---

## ⚙️ Configuration & Storage
- **API Key**: Set via `FINNHUB_API_KEY` in `.env`.
- **Cache**: Parsed fundamental JSON structures are cached under `data_cache_dir` (see [[File_Storage_Map]]).
