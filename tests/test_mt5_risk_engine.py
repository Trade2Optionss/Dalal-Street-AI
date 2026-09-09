"""Unit tests for MT5 Risk Engine & Position Sizing."""

import pytest
from mt5_bot.risk_engine import RiskEngine


def test_lot_size_forex_standard():
    risk = RiskEngine(risk_percent_per_trade=1.0, min_lot=0.01, max_lot=10.0)
    # Account: $10,000 | 1% Risk = $100
    # Entry: 1.0850, SL: 1.0830 (20 pips / 200 points)
    # 200 points * $1 tick_value = $200 per lot -> 100 / 200 = 0.50 lots
    res = risk.calculate_lot_size(
        symbol="EURUSD",
        account_equity=10000.0,
        entry_price=1.0850,
        stop_loss=1.0830,
        point_size=0.00001,
        tick_value=1.0,
    )

    assert res.is_valid is True
    assert res.risk_amount_cash == 100.0
    assert 0.45 <= res.lot_size <= 0.55


def test_lot_size_gold():
    risk = RiskEngine(risk_percent_per_trade=1.0)
    # Account: $10,000 | 1% Risk = $100
    # Gold entry: 2400.0, SL: 2395.0 ($5 distance)
    # 1 lot of gold = 100 oz -> $5 move = $500 risk per lot -> $100 / $500 = 0.20 lots
    res = risk.calculate_lot_size(
        symbol="XAUUSD",
        account_equity=10000.0,
        entry_price=2400.0,
        stop_loss=2395.0,
    )

    assert res.is_valid is True
    assert res.risk_amount_cash == 100.0
    assert res.lot_size == 0.20


def test_spread_filter():
    risk = RiskEngine(max_spread_points=25)
    assert risk.check_spread(15) is True
    assert risk.check_spread(35) is False


def test_drawdown_circuit_breaker():
    risk = RiskEngine(max_daily_drawdown_percent=4.0)
    risk.initialize_day(10000.0)

    # 2% drawdown: Allowed
    assert risk.check_daily_drawdown(9800.0) is True

    # 5% drawdown: Blocked
    assert risk.check_daily_drawdown(9450.0) is False
