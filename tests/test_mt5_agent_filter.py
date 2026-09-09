"""Unit tests for Multi-Agent Filter Bridge & Bot Runner."""

import pytest
from mt5_bot.agent_filter import AgentFilterBridge
from mt5_bot.bot_runner import TrendPullbackBot
from mt5_bot.config import BotConfig
from mt5_bot.market_structure import SignalType, TradeSignal, TrendBias


def test_agent_filter_evaluation():
    config = BotConfig(mock_mode=True)
    bridge = AgentFilterBridge(config)

    signal = TradeSignal(
        symbol="EURUSD",
        signal_type=SignalType.BUY,
        entry_price=1.0850,
        stop_loss=1.0820,
        take_profit=1.0925,
        risk_distance=0.0030,
        risk_reward_ratio=2.5,
        trend_bias_m15=TrendBias.BULLISH,
        bos_level=1.0845,
        pullback_fib=0.50,
        atr=0.0015,
        rationale="M5 BOS above 1.0845 followed by 50% pullback to 20 EMA.",
    )

    verdict = bridge.evaluate_signal(signal)
    assert verdict is not None
    assert verdict.approved is True
    assert verdict.rating in ("Buy", "Overweight")
    assert verdict.confidence_score > 0.7
    assert verdict.obsidian_report_path is not None


def test_bot_runner_single_iteration():
    config = BotConfig(mock_mode=True, symbols=["EURUSD", "GBPUSD"])
    bot = TrendPullbackBot(config)

    # Run single scan cycle in simulation mode
    bot.start(single_iteration=True)
    assert bot.connector.is_connected is False  # Safely disconnected at end
