"""Unit tests for MT5 Market Structure & Pullback Engine."""

import numpy as np
import pandas as pd
import pytest

from mt5_bot.market_structure import MarketStructureEngine, SignalType, TrendBias


def create_sample_df(trend="bullish", length=120):
    """Generate synthetic OHLCV dataframe with a clear trend and pullback structure."""
    times = pd.date_range(start="2026-08-30 08:00", periods=length, freq="5min")
    
    if trend == "bullish":
        # Upward drift with an intermediate swing high, BOS, and pullback
        step = 0.0002
        prices = [1.0800 + (i * step) for i in range(length)]
        # Inject an impulse and pullback at the end
        prices[-10] = prices[-11] + 0.0030  # BOS Breakout High
        prices[-9] = prices[-10] + 0.0010
        prices[-8] = prices[-9] - 0.0015   # Pullback
        prices[-7] = prices[-8] - 0.0010   # Pullback to EMA
        prices[-1] = prices[-7] + 0.0008   # Bullish bounce
    else:
        # Downward drift
        step = -0.0002
        prices = [1.1200 + (i * step) for i in range(length)]
        prices[-10] = prices[-11] - 0.0030
        prices[-9] = prices[-10] - 0.0010
        prices[-8] = prices[-9] + 0.0015
        prices[-7] = prices[-8] + 0.0010
        prices[-1] = prices[-7] - 0.0008

    closes = np.array(prices)
    highs = closes + 0.0004
    lows = closes - 0.0004
    opens = closes - (np.random.normal(0, 0.0001, length))
    volumes = np.random.randint(100, 1000, length)

    return pd.DataFrame(
        {
            "open": opens,
            "high": highs,
            "low": lows,
            "close": closes,
            "tick_volume": volumes,
        },
        index=times,
    )


def test_market_structure_indicators():
    engine = MarketStructureEngine(ema_fast=20, ema_slow=50, ema_trend=200)
    df = create_sample_df(trend="bullish", length=220)
    df_ind = engine.calculate_indicators(df)

    assert "ema_fast" in df_ind.columns
    assert "ema_slow" in df_ind.columns
    assert "ema_trend" in df_ind.columns
    assert "atr" in df_ind.columns
    assert "rsi" in df_ind.columns
    assert not df_ind["ema_fast"].isna().all()


def test_m15_trend_bias():
    engine = MarketStructureEngine()
    df_bull = create_sample_df(trend="bullish", length=250)
    bias_bull = engine.evaluate_m15_trend(df_bull)
    assert bias_bull == TrendBias.BULLISH

    df_bear = create_sample_df(trend="bearish", length=250)
    bias_bear = engine.evaluate_m15_trend(df_bear)
    assert bias_bear == TrendBias.BEARISH


def test_swing_point_detection():
    engine = MarketStructureEngine(swing_lookback=3)
    df = create_sample_df(trend="bullish", length=100)
    highs, lows = engine.find_swing_points(df)

    assert len(highs) > 0
    assert len(lows) > 0
    assert all(h.is_high for h in highs)
    assert all(not l.is_high for l in lows)


def test_signal_evaluation():
    engine = MarketStructureEngine()
    df_m15 = create_sample_df(trend="bullish", length=250)
    df_m5 = create_sample_df(trend="bullish", length=120)

    signal = engine.evaluate_signal("EURUSD", df_m15, df_m5)
    assert signal is not None
    assert signal.symbol == "EURUSD"
    assert signal.risk_reward_ratio == 2.5
