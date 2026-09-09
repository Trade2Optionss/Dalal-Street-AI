---
title: "Agent: Bull Researcher"
tags:
  - agent
  - researcher
  - debate
  - bullish
  - tradingagents
category: "Research Team"
status: "Active"
code_file: "tradingagents/agents/researchers/bull_researcher.py"
output_file: "2_research/bull.md"
upstream_agents:
  - "[[Market_Analyst]]"
  - "[[Sentiment_Analyst]]"
  - "[[News_Analyst]]"
  - "[[Fundamentals_Analyst]]"
counterpart: "[[Bear_Researcher]]"
---

# 🐂 Bull Researcher

> [!info] **Agent Overview**
> The **Bull Researcher** ingests reports from the four analyst disciplines and constructs the most rigorous, data-backed **upside investment thesis**. It actively defends this thesis during multi-round debates against the [[Bear_Researcher]].

---

## 🎯 Role & Objectives
- Synthesize technical breakouts, bullish sentiment, macro tailwinds, and strong fundamentals.
- Formulate concrete price targets, upside catalysts, and margin expansion arguments.
- Defend against skeptical critiques from the [[Bear_Researcher]].
- Prioritize high-probability growth drivers.

---

## 🔄 Structured Debate Flow

The Bull and Bear researchers engage in an interactive debate loop (configured via `max_debate_rounds`):

```mermaid
sequenceDiagram
    participant Analysts as Analyst Team
    participant Bull as Bull Researcher
    participant Bear as Bear Researcher
    participant Mgr as Research Manager

    Analysts->>Bull: Market, Sentiment, News, Fundamentals Reports
    Analysts->>Bear: Market, Sentiment, News, Fundamentals Reports
    Bull->>Bear: Round 1: Present Bullish Thesis
    Bear->>Bull: Round 1: Counter-arguments & Risk Rebuttal
    Note over Bull,Bear: Additional Debate Rounds...
    Bull->>Mgr: Final Bull Defense
    Bear->>Mgr: Final Bear Critique
```

---

## 📁 File Storage & Output Path

- **Source Code**: [`tradingagents/agents/researchers/bull_researcher.py`](file:///Users/ankit/Desktop/new%20lms%20trading/TradingAgents/tradingagents/agents/researchers/bull_researcher.py)
- **Execution Output**: Saved in `2_research/bull.md` (see [[File_Storage_Map]]).
- **Consuming Agents**: [[Bear_Researcher]], [[Research_Manager]]
