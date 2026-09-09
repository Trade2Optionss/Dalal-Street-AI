---
title: "Data Source: FRED (Federal Reserve Economic Data)"
tags:
  - datasource
  - fred
  - macroeconomics
  - rates
  - inflation
  - tradingagents
provider: "Federal Reserve Bank of St. Louis"
code_module: "tradingagents/dataflows/fred.py"
env_var: "FRED_API_KEY"
consuming_agents:
  - "[[News_Analyst]]"
---

# 🏛️ FRED Macroeconomic Dataflow

> [!abstract] **Data Provider Overview**
> **FRED (Federal Reserve Economic Data)** provides macroeconomic indicators, including Federal Funds Effective Rate, 10-Year Treasury Yields, CPI Inflation, GDP Growth, and Unemployment statistics.

---

## 🛠️ Key Tracked Series

| Indicator Code | Description | Economic Impact |
| :--- | :--- | :--- |
| `FEDFUNDS` | Effective Federal Funds Rate | Monetary policy stance & borrowing costs |
| `DGS10` | 10-Year Treasury Constant Maturity | Benchmark risk-free discount rate |
| `CPIAUCSL` | Consumer Price Index (All Urban) | Inflation pressure & Fed reaction function |
| `UNRATE` | Civilian Unemployment Rate | Labor market strength & recession indicator |

---

## 🤖 Consuming Agents

```mermaid
flowchart LR
    FRED["[[FRED_Macro]] Series"] --> NA["[[News_Analyst]]"]
```
