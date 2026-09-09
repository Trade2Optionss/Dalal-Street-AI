"""Configuration settings for Active Session Scalping MT5 Bot."""

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional


@dataclass
class BotConfig:
    """Master configuration for the Daily Session Scalping MT5 Bot."""

    # --- Target Trading Instruments ---
    symbols: List[str] = field(
        default_factory=lambda: ["EURUSD", "GBPUSD", "XAUUSD", "BTCUSD"]
    )
    timeframe_trend: str = "M15"       # Higher Timeframe Trend Alignment
    timeframe_entry: str = "M5"        # Lower Timeframe Scalp Execution

    # --- Active Scalping Strategy Parameters ---
    mode: str = "SCALPING"             # Active Intraday Scalping Mode
    ema_fast: int = 9                  # Fast Scalp Ribbon (9 EMA)
    ema_slow: int = 21                 # Slow Scalp Ribbon (21 EMA)
    ema_trend: int = 50                # Dynamic Trend Baseline (50 EMA)
    swing_lookback: int = 3            # Fast Micro-Fractal Lookback (3 bars for scalping)
    atr_period: int = 14               # ATR for volatility stop-loss
    atr_multiplier_sl: float = 1.0     # Tight Scalp Stop Loss (1.0 * ATR)
    risk_reward_ratio: float = 1.6     # High-Probability Scalp Target (1 : 1.6 R:R)
    
    # --- Break-Even Control ---
    enable_breakeven: bool = False     # REMOVED: Prevent premature BE stop-outs during scalps
    breakeven_trigger_rr: float = 2.0  # Only move to BE if well in profit (>2.0R)
    trailing_stop_enabled: bool = False # Direct SL / TP target locking for scalps

    # --- Session Timing (Killzones) ---
    enable_session_filter: bool = True # Focus on high-liquidity volume sessions
    london_start_hour: int = 7         # 07:00 UTC (London Open)
    london_end_hour: int = 11          # 11:00 UTC
    ny_start_hour: int = 12            # 12:30 UTC (New York Open)
    ny_end_hour: int = 17              # 17:00 UTC (London/NY Overlap)

    # --- Risk Management ---
    risk_percent_per_trade: float = 1.0 # 1.0% equity risk per scalp position
    max_open_trades_total: int = 4     # Simultaneous scalp limit across symbols
    max_open_trades_per_symbol: int = 1 # One active scalp per symbol at a time
    max_daily_drawdown_percent: float = 4.0 # Daily loss circuit breaker
    max_spread_points: int = 25        # Max allowable spread in points
    magic_number: int = 777333         # Unique Scalp Magic Number
    order_comment: str = "TradingAgents-Scalp"

    # --- Multi-Agent Filter ---
    use_agent_filter: bool = True      # Fast Agent committee validation
    require_pm_approval: bool = True

    # --- MT5 Terminal Credentials ---
    mt5_login: Optional[int] = None
    mt5_password: Optional[str] = None
    mt5_server: Optional[str] = None
    mt5_path: Optional[str] = None
    mock_mode: bool = False

    # --- Paths ---
    project_root: Path = field(
        default_factory=lambda: Path(__file__).resolve().parent.parent
    )
    obsidian_reports_dir: Path = field(
        default_factory=lambda: Path(__file__).resolve().parent.parent / "obsidian" / "04_Run_Reports"
    )
    memory_log_path: Path = field(
        default_factory=lambda: Path(__file__).resolve().parent.parent / "trading_memory.md"
    )

    @classmethod
    def from_env(cls) -> "BotConfig":
        symbols_raw = os.getenv("MT5_SYMBOLS")
        symbols = [s.strip() for s in symbols_raw.split(",")] if symbols_raw else None
        risk_pct = float(os.getenv("MT5_RISK_PERCENT", "1.0"))
        use_agents = os.getenv("MT5_USE_AGENTS", "true").lower() in ("true", "1", "yes")

        cfg = cls()
        if symbols:
            cfg.symbols = symbols
        cfg.risk_percent_per_trade = risk_pct
        cfg.use_agent_filter = use_agents
        return cfg
