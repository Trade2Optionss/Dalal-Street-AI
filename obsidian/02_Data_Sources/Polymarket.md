---
title: "Data Source: Polymarket"
tags:
  - datasource
  - polymarket
  - prediction-market
  - probability
  - tradingagents
provider: "Polymarket"
code_module: "tradingagents/dataflows/polymarket.py"
env_var: "None (Public API)"
consuming_agents:
  - "[[News_Analyst]]"
---

# 🔮 Polymarket Prediction Markets

> [!abstract] **Data Provider Overview**
> **Polymarket** provides real-money decentralized prediction market probabilities for political events, interest rate cuts/hikes, regulatory decisions, and major economic milestones.

---

## 🛠️ Capabilities & Logic
- Extracts real-time implied probability distributions for macroeconomic and sector events.
- Provides forward-looking event probabilities to augment backward-looking historical news.

---

## 🤖 Consuming Agents

```mermaid
flowchart LR
    POLY["[[Polymarket]] Probabilities"] --> NA["[[News_Analyst]]"]
```
