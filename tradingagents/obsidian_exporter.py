"""Obsidian note generator for TradingAgents execution runs.

Produces aesthetic, Obsidian-flavored markdown reports with YAML frontmatter,
Dataview tags, custom callout blocks, and bidirectional wikilinks to agent and
data source documentation notes in the vault.
"""

from datetime import datetime
from pathlib import Path
from typing import Any, Optional


def export_run_to_obsidian(
    final_state: dict[str, Any],
    ticker: str,
    vault_dir: Optional[Path] = None,
) -> Path:
    """Export a completed graph execution state to an aesthetic Obsidian note.

    Args:
        final_state: Final state dictionary from TradingAgentsGraph.
        ticker: Symbol analyzed (e.g. 'NVDA').
        vault_dir: Root obsidian directory. Defaults to repo's ``obsidian/``.

    Returns:
        Path to the generated Obsidian report.
    """
    if vault_dir is None:
        # Default to repo root's obsidian directory
        repo_root = Path(__file__).resolve().parent.parent
        vault_dir = repo_root / "obsidian"

    reports_dir = vault_dir / "04_Run_Reports"
    reports_dir.mkdir(parents=True, exist_ok=True)

    trade_date = final_state.get("trade_date") or datetime.now().strftime("%Y-%m-%d")
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    clean_ticker = ticker.replace("/", "-").replace(":", "-").upper()
    file_timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    target_filename = f"{clean_ticker}_{trade_date}_{file_timestamp}.md"
    target_path = reports_dir / target_filename

    # Extract decision metadata
    decision_raw = final_state.get("final_trade_decision") or ""
    action = "HOLD"
    if "BUY" in decision_raw.upper():
        action = "BUY"
    elif "SELL" in decision_raw.upper() or "SHORT" in decision_raw.upper():
        action = "SELL"

    # 1. Frontmatter
    content_parts = [
        "---",
        f'ticker: "{clean_ticker}"',
        f'trade_date: "{trade_date}"',
        f'action: "{action}"',
        f'generated: "{timestamp}"',
        "tags:",
        "  - trade-report",
        "  - tradingagents",
        f'  - "{clean_ticker}"',
        f'  - "{action.lower()}"',
        "cssclasses:",
        "  - trade-report",
        "  - dashboard",
        "---",
        "",
        f"# 📊 Trade Analysis Report: [[{clean_ticker}]]",
        "",
        "> [!abstract] **Executive Run Summary**",
        f"> - **Target Asset**: `{clean_ticker}`",
        f"> - **Analysis Date**: `{trade_date}`",
        f"> - **Generated At**: `{timestamp}`",
        f"> - **Portfolio Manager Verdict**: **`{action}`**",
        "",
        "---",
        "",
        "## 🏛️ Stage 1: Analyst Team Insights",
        "",
        "> [!info] **Analyst Data Intelligence**",
        "> Ingested and processed from [[YFinance]], [[Alpha_Vantage]], [[Finnhub]], [[FRED_Macro]], [[Polymarket]], and social sentiment feeds.",
        "",
    ]

    # Analysts
    if final_state.get("market_report"):
        content_parts.extend([
            "### 📈 [[Market_Analyst|Technical Market Analyst]]",
            "",
            "> [!note]- Click to expand Technical Analysis",
            "> " + final_state["market_report"].replace("\n", "\n> "),
            "",
        ])

    if final_state.get("sentiment_report"):
        content_parts.extend([
            "### 💬 [[Sentiment_Analyst|Social & Sentiment Analyst]]",
            "",
            "> [!note]- Click to expand Sentiment Analysis",
            "> " + final_state["sentiment_report"].replace("\n", "\n> "),
            "",
        ])

    if final_state.get("news_report"):
        content_parts.extend([
            "### 📰 [[News_Analyst|Macro & Global News Analyst]]",
            "",
            "> [!note]- Click to expand News & Macro Analysis",
            "> " + final_state["news_report"].replace("\n", "\n> "),
            "",
        ])

    if final_state.get("fundamentals_report"):
        content_parts.extend([
            "### 🏢 [[Fundamentals_Analyst|Fundamental Valuation Analyst]]",
            "",
            "> [!note]- Click to expand Fundamental Analysis",
            "> " + final_state["fundamentals_report"].replace("\n", "\n> "),
            "",
        ])

    # Research Debate
    debate = final_state.get("investment_debate_state") or {}
    if debate:
        content_parts.extend([
            "---",
            "",
            "## ⚖️ Stage 2: Research Team Debate",
            "",
            "> [!example] **Debate Adjudication**",
            "> Structured multi-turn debate between the [[Bull_Researcher]] and [[Bear_Researcher]], evaluated by the [[Research_Manager]].",
            "",
        ])

        if debate.get("bull_history"):
            content_parts.extend([
                "### 🐂 [[Bull_Researcher|Bull Thesis]]",
                "",
                "> [!tip]- Bull Argument Summary",
                "> " + debate["bull_history"].replace("\n", "\n> "),
                "",
            ])

        if debate.get("bear_history"):
            content_parts.extend([
                "### 🐻 [[Bear_Researcher|Bear Critique]]",
                "",
                "> [!warning]- Bear Risk Analysis",
                "> " + debate["bear_history"].replace("\n", "\n> "),
                "",
            ])

        if debate.get("judge_decision"):
            content_parts.extend([
                "### ⚖️ [[Research_Manager|Manager Synthesis & Directive]]",
                "",
                debate["judge_decision"],
                "",
            ])

    # Trader
    if final_state.get("trader_investment_plan"):
        content_parts.extend([
            "---",
            "",
            "## 🎯 Stage 3: [[Trader_Agent|Trader Execution Plan]]",
            "",
            final_state["trader_investment_plan"],
            "",
        ])

    # Risk Management
    risk = final_state.get("risk_debate_state") or {}
    if risk:
        content_parts.extend([
            "---",
            "",
            "## 🛡️ Stage 4: [[Risk_Management_Team|Risk Committee Assessment]]",
            "",
            "> [!caution] **Risk Perspectives**",
            "> Multi-perspective stress testing across Aggressive, Neutral, and Conservative risk mandates.",
            "",
        ])

        if risk.get("aggressive_history"):
            content_parts.extend([
                "#### 🔥 Aggressive Risk View",
                risk["aggressive_history"],
                "",
            ])

        if risk.get("neutral_history"):
            content_parts.extend([
                "#### ⚖️ Neutral Risk View",
                risk["neutral_history"],
                "",
            ])

        if risk.get("conservative_history"):
            content_parts.extend([
                "#### 🛡️ Conservative Risk View",
                risk["conservative_history"],
                "",
            ])

    # Portfolio Manager
    pm_decision = (
        risk.get("judge_decision")
        or final_state.get("final_trade_decision")
        or ""
    )
    if pm_decision:
        content_parts.extend([
            "---",
            "",
            "## 💼 Stage 5: [[Portfolio_Manager|Portfolio Manager Final Decision]]",
            "",
            "> [!quote] **Authorized Execution Order**",
            "> Historical memory reflections from [[Trading_Memory_Log]] integrated into this allocation.",
            "",
            pm_decision,
            "",
        ])

    # Footer
    content_parts.extend([
        "---",
        "",
        "🔗 **Vault Links**: [[00_Dashboard|🏠 Dashboard]] | [[File_Storage_Map|📁 Storage Map]] | [[TradingAgents_Architecture.canvas|🎨 System Canvas]]",
        "",
    ])

    report_text = "\n".join(content_parts)
    target_path.write_text(report_text, encoding="utf-8")
    return target_path
