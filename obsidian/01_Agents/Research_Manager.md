---
title: "Agent: Research Manager"
tags:
  - agent
  - manager
  - judge
  - consensus
  - tradingagents
category: "Research Team"
status: "Active"
code_file: "tradingagents/agents/managers/research_manager.py"
output_file: "2_research/manager.md"
upstream_agents:
  - "[[Bull_Researcher]]"
  - "[[Bear_Researcher]]"
downstream_agent: "[[Trader_Agent]]"
---

# ⚖️ Research Manager

> [!info] **Agent Overview**
> The **Research Manager** adjudicates the debate between the [[Bull_Researcher]] and the [[Bear_Researcher]]. It weighs the strength of evidence from both sides and issues an unbiased, synthesized **Investment Thesis & Directional Bias**.

---

## 🎯 Role & Objectives
- Act as the objective judge of the bull vs bear debate.
- Resolve conflicting analyst signals (e.g. strong fundamentals vs weakening technicals).
- Determine the overall conviction rating (Bullish, Bearish, or Neutral).
- Produce a structured investment brief that guides the [[Trader_Agent]].

---

## 📁 File Storage & Output Path

- **Source Code**: `tradingagents/agents/managers/research_manager.py`
- **Execution Output**: Saved in `2_research/manager.md` (see [[File_Storage_Map]]).
- **Consuming Agents**: [[Trader_Agent]]

---

## 🔄 Upstream & Downstream Flow

```mermaid
flowchart LR
    BULL["[[Bull_Researcher]]"] --> RM["[[Research_Manager]]"]
    BEAR["[[Bear_Researcher]]"] --> RM
    RM --> TR["[[Trader_Agent]]"]
```
