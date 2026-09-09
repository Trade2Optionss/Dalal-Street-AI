---
title: "TradingAgents: Obsidian Command Center"
tags:
  - hub
  - dashboard
  - tradingagents
  - multi-agent
updated: 2026-08-30
cssclasses:
  - dashboard
  - cards
---

# 🌐 TradingAgents Command Center

> [!abstract] **System Overview**
> **TradingAgents** is a multi-agent LLM financial trading framework that mirrors institutional trading firms. It orchestrates specialized analyst teams, structured bull/bear researcher debates, automated risk committees, and memory-driven portfolio management.

---

## ⚡ Quick Navigation

| 🤖 **Agents & Roles** | 🌐 **Data Sources & Tools** | 📁 **Storage & Architecture** |
| :--- | :--- | :--- |
| • [[Market_Analyst\|📈 Technical Analyst]]<br>• [[Sentiment_Analyst\|💬 Sentiment Analyst]]<br>• [[News_Analyst\|📰 News Analyst]]<br>• [[Fundamentals_Analyst\|🏢 Fundamentals Analyst]] | • [[Alpha_Vantage\|⚡ Alpha Vantage]]<br>• [[YFinance\|📊 YFinance]]<br>• [[Finnhub\|🎯 Finnhub Data]]<br>• [[FRED_Macro\|🏛️ FRED Macro Indicators]] | • [[File_Storage_Map\|🗂️ File & Cache Map]]<br>• [[_Template_Trade_Report\|📑 Trade Report Template]]<br>• [[TradingAgents_Architecture.canvas\|🎨 Visual System Canvas]]<br>• [[Trend_Pullback_Structure_Break_Bot\|🤖 MT5 Bot (M5/M15)]] |
| • [[Bull_Researcher\|🐂 Bull Researcher]]<br>• [[Bear_Researcher\|🐻 Bear Researcher]]<br>• [[Research_Manager\|⚖️ Research Manager]] | • [[Polymarket\|🔮 Polymarket Probabilities]]<br>• [[Reddit_Sentiment\|👾 Reddit Chatter]]<br>• [[StockTwits_Sentiment\|📱 StockTwits Sentiment]] | • `results_dir/reports/`<br>• `data_cache_dir/`<br>• `trading_memory.md` |
| • [[Trader_Agent\|🎯 Trader Agent]]<br>• [[Risk_Management_Team\|🛡️ Risk Management Team]]<br>• [[Portfolio_Manager\|💼 Portfolio Manager]] | • [[Trading_Memory_Log\|🧠 Trading Memory Log]] | |


---

## 🏗️ Interactive System Workflow

```mermaid
flowchart TD
    subgraph S1["🌐 1. Live Data Feeds"]
        DS_YF["[[YFinance]]<br>Price & Historical OHLCV"]
        DS_AV["[[Alpha_Vantage]]<br>Technical Indicators & News"]
        DS_FH["[[Finnhub]]<br>Company Financials"]
        DS_FRED["[[FRED_Macro]]<br>Macro & Rates"]
        DS_POLY["[[Polymarket]]<br>Prediction Markets"]
        DS_SOC["[[Reddit_Sentiment]] / [[StockTwits_Sentiment]]<br>Social Sentiment"]
    end

    subgraph S2["🤖 2. Analyst Team"]
        A_MKT["[[Market_Analyst]]<br>RSI, MACD, Patterns"]
        A_SENT["[[Sentiment_Analyst]]<br>Social Mood & Hype"]
        A_NEWS["[[News_Analyst]]<br>Global & Macro News"]
        A_FUND["[[Fundamentals_Analyst]]<br>Financials & Valuation"]
    end

    subgraph S3["⚖️ 3. Research & Debate"]
        R_BULL["[[Bull_Researcher]]<br>Upside Potential"]
        R_BEAR["[[Bear_Researcher]]<br>Downside Risks"]
        R_MGR["[[Research_Manager]]<br>Synthesized Thesis"]
    end

    subgraph S4["🎯 4. Trading & Risk Assessment"]
        T_TRADER["[[Trader_Agent]]<br>Formulates Order Plan"]
        R_RISK["[[Risk_Management_Team]]<br>Aggressive / Neutral / Conservative"]
    end

    subgraph S5["💼 5. Portfolio & Memory"]
        PM["[[Portfolio_Manager]]<br>Final Decision & Sizing"]
        MEM["[[Trading_Memory_Log]]<br>Reflection & Historical Learnings"]
    end

    %% Data Connections
    DS_YF --> A_MKT
    DS_AV --> A_MKT
    DS_SOC --> A_SENT
    DS_AV --> A_NEWS
    DS_FRED --> A_NEWS
    DS_FH --> A_FUND
    DS_POLY --> A_NEWS

    %% Analyst to Debate
    A_MKT & A_SENT & A_NEWS & A_FUND --> R_BULL & R_BEAR
    R_BULL <-->|Structured Debate| R_BEAR
    R_BULL & R_BEAR --> R_MGR

    %% Debate to Trader & Risk
    R_MGR --> T_TRADER
    T_TRADER --> R_RISK
    R_RISK --> PM
    MEM <--> PM
```

---

## 📋 Agent Roster & Responsibility Matrix

> [!tip] Click on any agent name to inspect its prompt structure, tool access, and output files.

| Agent | Category | Primary Resources | Key Output File |
| :--- | :--- | :--- | :--- |
| [[Market_Analyst\|Market Analyst]] | Analyst Team | [[YFinance]], [[Alpha_Vantage]] | `1_analysts/market.md` |
| [[Sentiment_Analyst\|Sentiment Analyst]] | Analyst Team | [[StockTwits_Sentiment]], [[Reddit_Sentiment]] | `1_analysts/sentiment.md` |
| [[News_Analyst\|News Analyst]] | Analyst Team | [[Alpha_Vantage]], [[FRED_Macro]], [[Polymarket]] | `1_analysts/news.md` |
| [[Fundamentals_Analyst\|Fundamentals Analyst]] | Analyst Team | [[Finnhub]], SEC Filings | `1_analysts/fundamentals.md` |
| [[Bull_Researcher\|Bull Researcher]] | Research Team | Analyst Reports | `2_research/bull.md` |
| [[Bear_Researcher\|Bear Researcher]] | Research Team | Analyst Reports | `2_research/bear.md` |
| [[Research_Manager\|Research Manager]] | Research Team | Debate Transcript | `2_research/manager.md` |
| [[Trader_Agent\|Trader Agent]] | Trading Team | Research Synthesis | `3_trading/trader.md` |
| [[Risk_Management_Team\|Risk Management Team]] | Risk Team | Proposed Trades, Volatility | `4_risk/*.md` |
| [[Portfolio_Manager\|Portfolio Manager]] | Executive | [[Trading_Memory_Log]], Risk Reports | `5_portfolio/decision.md` |

---

## 🗂️ Reports & Execution Log
- Check `obsidian/04_Run_Reports/` for all executed run reports formatted with Obsidian tags, callouts, and frontmatter.
- Use [[File_Storage_Map]] to see the precise local paths for all data caches and memory files.
