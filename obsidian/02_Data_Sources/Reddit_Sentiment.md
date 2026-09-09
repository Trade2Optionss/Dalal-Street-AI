---
title: "Data Source: Reddit Chatter & Sentiment"
tags:
  - datasource
  - reddit
  - sentiment
  - social
  - retail
  - tradingagents
provider: "Reddit API"
code_module: "tradingagents/dataflows/reddit.py"
env_var: "REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET"
consuming_agents:
  - "[[Sentiment_Analyst]]"
---

# 👾 Reddit Chatter & Sentiment Dataflow

> [!abstract] **Data Provider Overview**
> Ingests discussions, post velocity, and comment sentiment from top retail trading communities on Reddit (including `r/wallstreetbets`, `r/stocks`, `r/investing`, and `r/options`).

---

## 🛠️ Tracked Metrics
- Mention frequency & ticker buzz velocity.
- Retail hype vs panic ratio.
- Sentiment scoring across top-ranked submissions and comments.

---

## 🤖 Consuming Agents

```mermaid
flowchart LR
    REDDIT["[[Reddit_Sentiment]] Posts & Comments"] --> SA["[[Sentiment_Analyst]]"]
```
