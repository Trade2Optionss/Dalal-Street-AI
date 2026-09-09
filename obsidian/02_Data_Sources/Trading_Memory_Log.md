---
title: "Data Store: Trading Memory Log"
tags:
  - datastore
  - memory
  - reflection
  - reinforcement
  - tradingagents
code_module: "tradingagents/agents/utils/memory.py"
storage_file: "trading_memory.md"
consuming_agents:
  - "[[Portfolio_Manager]]"
---

# 🧠 Trading Memory & Reflection Engine

> [!abstract] **Memory Engine Overview**
> The **Trading Memory Log** is a persistent markdown-based memory store that records trade rationales, outcomes, prediction errors, and self-reflections. When the system re-analyzes a company, the [[Portfolio_Manager]] injects relevant past lessons into its reasoning context.

---

## 🛠️ How Reflection Works

```mermaid
sequenceDiagram
    participant Graph as Trading Graph
    participant PM as Portfolio Manager
    participant Log as trading_memory.md
    participant Reflector as Reflector Node

    Graph->>PM: Graph evaluates ticker (e.g. NVDA)
    Log->>PM: Injects previous NVDA decisions & lessons
    PM->>Graph: Final Trade Executed
    Graph->>Log: Appends new decision
    Note over Reflector,Log: Later: Trade outcome known (P&L +/-)
    Reflector->>Log: Records retrospective critique & learned takeaway
```

---

## 📁 File Location & Configuration
- **Default Path**: `~/.tradingagents/memory/trading_memory.md` (or configurable via `TRADINGAGENTS_MEMORY_LOG_PATH` in `.env`).
- **Pruning**: Configurable via `memory_log_max_entries` (see [[File_Storage_Map]]).
