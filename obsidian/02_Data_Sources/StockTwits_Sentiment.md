---
title: "Data Source: StockTwits Sentiment"
tags:
  - datasource
  - stocktwits
  - sentiment
  - social
  - tradingagents
provider: "StockTwits API"
code_module: "tradingagents/dataflows/stocktwits.py"
env_var: "None (Public API Stream)"
consuming_agents:
  - "[[Sentiment_Analyst]]"
---

# 📱 StockTwits Sentiment Dataflow

> [!abstract] **Data Provider Overview**
> Real-time message streaming and retail trader sentiment polling directly from the StockTwits feed for any US equity or cryptocurrency ticker.

---

## 🛠️ Extracted Signals
- Explicit User Bullish vs Bearish tags.
- Message velocity per hour.
- Community sentiment trend change over 24h/7d windows.

---

## 🤖 Consuming Agents

```mermaid
flowchart LR
    ST["[[StockTwits_Sentiment]] Message Stream"] --> SA["[[Sentiment_Analyst]]"]
```
