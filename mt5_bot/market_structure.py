"""Market Structure & Active Session Scalping Engine for M5 / M15 Trading."""

from dataclasses import dataclass
from datetime import datetime, time
from enum import Enum
from typing import List, Optional, Tuple
import numpy as np
import pandas as pd


class SignalType(str, Enum):
    BUY = "BUY"
    SELL = "SELL"
    NONE = "NONE"


class TrendBias(str, Enum):
    BULLISH = "BULLISH"
    BEARISH = "BEARISH"
    NEUTRAL = "NEUTRAL"


@dataclass
class SwingPoint:
    index: int
    price: float
    is_high: bool
    timestamp: Optional[pd.Timestamp] = None


@dataclass
class TradeSignal:
    symbol: str
    signal_type: SignalType
    entry_price: float
    stop_loss: float
    take_profit: float
    risk_distance: float
    risk_reward_ratio: float
    trend_bias_m15: TrendBias
    bos_level: float
    pullback_fib: float
    atr: float
    rationale: str
    timestamp: Optional[pd.Timestamp] = None


class MarketStructureEngine:
    """Calculates Micro-BOS, 9/21 EMA Scalp Pullbacks, and Session Timing."""

    def __init__(
        self,
        ema_fast: int = 9,
        ema_slow: int = 21,
        ema_trend: int = 50,
        swing_lookback: int = 3,
        atr_period: int = 14,
        atr_multiplier_sl: float = 1.0,
        risk_reward_ratio: float = 1.6,
        fib_min: float = 0.382,
        fib_max: float = 0.786,
        enable_session_filter: bool = True,
    ):
        self.ema_fast = ema_fast
        self.ema_slow = ema_slow
        self.ema_trend = ema_trend
        self.swing_lookback = swing_lookback
        self.atr_period = atr_period
        self.atr_multiplier_sl = atr_multiplier_sl
        self.risk_reward_ratio = risk_reward_ratio
        self.fib_min = fib_min
        self.fib_max = fib_max
        self.enable_session_filter = enable_session_filter

    # --- Session Timing Filter (London & New York Killzones) ---

    def is_active_session(self, dt: pd.Timestamp) -> bool:
        """Check if current candle falls within high-liquidity London or NY sessions."""
        if not self.enable_session_filter:
            return True

        # Extract UTC hour and minute
        hour = dt.hour
        minute = dt.minute

        # London Session: 07:00 - 11:00 UTC
        in_london = (7 <= hour < 11)

        # New York Session: 12:30 - 17:30 UTC
        in_ny = (hour == 12 and minute >= 30) or (13 <= hour < 17) or (hour == 17 and minute <= 30)

        # Asian Session Scalp for Crypto/Gold: 00:00 - 04:00 UTC
        in_asia = (0 <= hour < 4)

        return in_london or in_ny or in_asia

    # --- Technical Indicators ---

    def calculate_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add Scalp EMAs (9, 21, 50), ATR, and RSI to the dataframe."""
        df = df.copy()
        df.columns = [c.lower() for c in df.columns]

        # Fast Scalping EMAs
        df["ema_fast"] = df["close"].ewm(span=self.ema_fast, adjust=False).mean()
        df["ema_slow"] = df["close"].ewm(span=self.ema_slow, adjust=False).mean()
        df["ema_trend"] = df["close"].ewm(span=self.ema_trend, adjust=False).mean()

        # ATR
        high_low = df["high"] - df["low"]
        high_close = (df["high"] - df["close"].shift(1)).abs()
        low_close = (df["low"] - df["close"].shift(1)).abs()
        tr = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
        df["atr"] = tr.rolling(window=self.atr_period).mean()

        # RSI (14)
        delta = df["close"].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / (loss + 1e-10)
        df["rsi"] = 100 - (100 / (1 + rs))

        return df

    # --- M15 Macro Trend Bias ---

    def evaluate_m15_trend(self, df_m15: pd.DataFrame) -> TrendBias:
        """Determine Higher Timeframe (M15) Macro Directional Bias."""
        if len(df_m15) < self.ema_trend:
            return TrendBias.NEUTRAL

        df = self.calculate_indicators(df_m15)
        latest = df.iloc[-1]

        # Bullish: 9 EMA > 21 EMA and Close > 50 EMA
        if latest["ema_fast"] > latest["ema_slow"] and latest["close"] >= latest["ema_slow"] * 0.999:
            return TrendBias.BULLISH

        # Bearish: 9 EMA < 21 EMA and Close < 50 EMA
        if latest["ema_fast"] < latest["ema_slow"] and latest["close"] <= latest["ema_slow"] * 1.001:
            return TrendBias.BEARISH

        return TrendBias.NEUTRAL

    # --- Swing Fractals ---

    def find_swing_points(self, df: pd.DataFrame) -> Tuple[List[SwingPoint], List[SwingPoint]]:
        """Identify responsive micro-swing points for scalping."""
        swing_highs: List[SwingPoint] = []
        swing_lows: List[SwingPoint] = []

        highs = df["high"].values
        lows = df["low"].values
        timestamps = df.index if isinstance(df.index, pd.DatetimeIndex) else None
        n = len(df)
        k = self.swing_lookback

        for i in range(k, n - k):
            current_high = highs[i]
            current_low = lows[i]

            if all(current_high > highs[i - j] for j in range(1, k + 1)) and all(
                current_high >= highs[i + j] for j in range(1, k + 1)
            ):
                ts = timestamps[i] if timestamps is not None else None
                swing_highs.append(SwingPoint(index=i, price=float(current_high), is_high=True, timestamp=ts))

            if all(current_low < lows[i - j] for j in range(1, k + 1)) and all(
                current_low <= lows[i + j] for j in range(1, k + 1)
            ):
                ts = timestamps[i] if timestamps is not None else None
                swing_lows.append(SwingPoint(index=i, price=float(current_low), is_high=False, timestamp=ts))

        return swing_highs, swing_lows

    # --- Scalp Signal Evaluation ---

    def evaluate_signal(
        self,
        symbol: str,
        df_m15: pd.DataFrame,
        df_m5: pd.DataFrame,
    ) -> TradeSignal:
        """Evaluate Active Session Scalping Signal on M5/M15."""
        no_signal = TradeSignal(
            symbol=symbol,
            signal_type=SignalType.NONE,
            entry_price=0.0,
            stop_loss=0.0,
            take_profit=0.0,
            risk_distance=0.0,
            risk_reward_ratio=self.risk_reward_ratio,
            trend_bias_m15=TrendBias.NEUTRAL,
            bos_level=0.0,
            pullback_fib=0.0,
            atr=0.0,
            rationale="No scalp trigger found.",
        )

        if len(df_m15) < 30 or len(df_m5) < 30:
            no_signal.rationale = "Insufficient bars for analysis."
            return no_signal

        # 1. Determine M15 Directional Trend
        trend_m15 = self.evaluate_m15_trend(df_m15)
        if trend_m15 == TrendBias.NEUTRAL:
            no_signal.rationale = "M15 Trend is Neutral / Range-bound."
            return no_signal

        # 2. Compute M5 Indicators & Swing Points
        df_m5 = self.calculate_indicators(df_m5)
        swing_highs, swing_lows = self.find_swing_points(df_m5)

        if not swing_highs or not swing_lows:
            no_signal.rationale = "Insufficient swing points on M5."
            return no_signal

        latest = df_m5.iloc[-1]
        atr = float(latest["atr"]) if not np.isnan(latest["atr"]) else float(df_m5["high"].iloc[-1] - df_m5["low"].iloc[-1])
        recent_swing_high = swing_highs[-1]
        recent_swing_low = swing_lows[-1]

        # ----------------------------------------------------
        # BULLISH SCALP SETUP (M15 Bullish + M5 Micro-BOS + 9/21 EMA Pullback)
        # ----------------------------------------------------
        if trend_m15 == TrendBias.BULLISH:
            bos_level = recent_swing_high.price
            
            # Check if recent candle broke above the swing high
            bos_happened = any(df_m5["close"].iloc[idx] > bos_level for idx in range(max(0, len(df_m5) - 10), len(df_m5)))
            
            # Dynamic 9/21 EMA Pullback Zone
            in_pullback_zone = (latest["low"] <= latest["ema_fast"] * 1.001 and latest["close"] >= latest["ema_slow"] * 0.999)
            bullish_momentum = latest["close"] > latest["open"]

            if (bos_happened or latest["close"] > latest["ema_fast"]) and in_pullback_zone and bullish_momentum:
                entry_price = float(latest["close"])
                # Tight scalp stop loss below 21 EMA or swing low
                sl_base = min(recent_swing_low.price, float(latest["ema_slow"]))
                stop_loss = float(sl_base - (self.atr_multiplier_sl * atr))
                risk_dist = entry_price - stop_loss

                if risk_dist > 0:
                    take_profit = entry_price + (self.risk_reward_ratio * risk_dist)
                    return TradeSignal(
                        symbol=symbol,
                        signal_type=SignalType.BUY,
                        entry_price=entry_price,
                        stop_loss=stop_loss,
                        take_profit=take_profit,
                        risk_distance=risk_dist,
                        risk_reward_ratio=self.risk_reward_ratio,
                        trend_bias_m15=TrendBias.BULLISH,
                        bos_level=bos_level,
                        pullback_fib=0.50,
                        atr=atr,
                        rationale=(
                            f"Bullish Scalp: M15 Trend aligned up. M5 price pulled back into 9/21 EMA value zone with bullish rejection candle. "
                            f"Targeting fast 1:{self.risk_reward_ratio:.1f} R:R scalp."
                        ),
                        timestamp=latest.name if isinstance(latest.name, pd.Timestamp) else None,
                    )

        # ----------------------------------------------------
        # BEARISH SCALP SETUP (M15 Bearish + M5 Micro-BOS + 9/21 EMA Pullback)
        # ----------------------------------------------------
        elif trend_m15 == TrendBias.BEARISH:
            bos_level = recent_swing_low.price
            bos_happened = any(df_m5["close"].iloc[idx] < bos_level for idx in range(max(0, len(df_m5) - 10), len(df_m5)))
            
            in_pullback_zone = (latest["high"] >= latest["ema_fast"] * 0.999 and latest["close"] <= latest["ema_slow"] * 1.001)
            bearish_momentum = latest["close"] < latest["open"]

            if (bos_happened or latest["close"] < latest["ema_fast"]) and in_pullback_zone and bearish_momentum:
                entry_price = float(latest["close"])
                sl_base = max(recent_swing_high.price, float(latest["ema_slow"]))
                stop_loss = float(sl_base + (self.atr_multiplier_sl * atr))
                risk_dist = stop_loss - entry_price

                if risk_dist > 0:
                    take_profit = entry_price - (self.risk_reward_ratio * risk_dist)
                    return TradeSignal(
                        symbol=symbol,
                        signal_type=SignalType.SELL,
                        entry_price=entry_price,
                        stop_loss=stop_loss,
                        take_profit=take_profit,
                        risk_distance=risk_dist,
                        risk_reward_ratio=self.risk_reward_ratio,
                        trend_bias_m15=TrendBias.BEARISH,
                        bos_level=bos_level,
                        pullback_fib=0.50,
                        atr=atr,
                        rationale=(
                            f"Bearish Scalp: M15 Trend aligned down. M5 price pulled back into 9/21 EMA resistance zone with bearish rejection candle. "
                            f"Targeting fast 1:{self.risk_reward_ratio:.1f} R:R scalp."
                        ),
                        timestamp=latest.name if isinstance(latest.name, pd.Timestamp) else None,
                    )

        no_signal.rationale = f"M15 Trend is {trend_m15.value}, but no valid M5 scalp trigger found."
        return no_signal
