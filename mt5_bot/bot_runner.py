"""Main Bot Runner: Orchestrates market structure scanning, multi-agent validation, and MT5 order execution."""

import argparse
import logging
import time
from datetime import datetime
from typing import Dict, Optional

from mt5_bot.agent_filter import AgentFilterBridge
from mt5_bot.config import BotConfig
from mt5_bot.market_structure import MarketStructureEngine, SignalType, TradeSignal
from mt5_bot.mt5_connector import MT5Connector, OrderType, Position
from mt5_bot.risk_engine import RiskEngine

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("MT5Bot")


class TrendPullbackBot:
    """Production Algorithmic Trading Bot for M5/M15 Trend Pullback + Structure Break."""

    def __init__(self, config: Optional[BotConfig] = None):
        self.config = config or BotConfig.from_env()
        self.connector = MT5Connector(
            login=self.config.mt5_login,
            password=self.config.mt5_password,
            server=self.config.mt5_server,
            path=self.config.mt5_path,
            mock_mode=self.config.mock_mode,
        )
        self.structure_engine = MarketStructureEngine(
            ema_fast=self.config.ema_fast,
            ema_slow=self.config.ema_slow,
            ema_trend=self.config.ema_trend,
            swing_lookback=self.config.swing_lookback,
            atr_period=self.config.atr_period,
            atr_multiplier_sl=self.config.atr_multiplier_sl,
            risk_reward_ratio=self.config.risk_reward_ratio,
            fib_min=self.config.fib_pullback_min,
            fib_max=self.config.fib_pullback_max,
        )
        self.risk_engine = RiskEngine(
            risk_percent_per_trade=self.config.risk_percent_per_trade,
            max_daily_drawdown_percent=self.config.max_daily_drawdown_percent,
            max_spread_points=self.config.max_spread_points,
        )
        self.agent_bridge = AgentFilterBridge(self.config) if self.config.use_agent_filter else None
        self.is_running = False

    def start(self, single_iteration: bool = False, poll_interval_sec: int = 15):
        """Start the trading bot execution loop."""
        logger.info("=" * 70)
        logger.info("🚀 Starting Trend Pullback + Structure Break MT5 Bot (M5 / M15)")
        logger.info(f"Target Symbols: {', '.join(self.config.symbols)}")
        logger.info(f"Risk Per Trade: {self.config.risk_percent_per_trade}% | R:R Ratio: 1:{self.config.risk_reward_ratio}")
        logger.info(f"Multi-Agent Filter: {'ENABLED (TradingAgents)' if self.config.use_agent_filter else 'DISABLED'}")
        logger.info("=" * 70)

        if not self.connector.connect():
            logger.error("Failed to connect to MT5. Aborting bot start.")
            return

        account = self.connector.get_account_info()
        self.risk_engine.initialize_day(account.balance)
        logger.info(f"💰 Initialized Account Balance: ${account.balance:,.2f} | Equity: ${account.equity:,.2f}")

        self.is_running = True

        try:
            if single_iteration:
                logger.info("Running single scan iteration...")
                self.run_iteration()
            else:
                logger.info(f"Entering continuous monitoring loop (poll interval: {poll_interval_sec}s)...")
                while self.is_running:
                    self.run_iteration()
                    time.sleep(poll_interval_sec)
        except KeyboardInterrupt:
            logger.info("Stopping bot on user interrupt...")
        finally:
            self.stop()

    def stop(self):
        """Gracefully disconnect and halt bot."""
        self.is_running = False
        self.connector.disconnect()
        logger.info("🛑 Trading bot safely halted.")

    def run_iteration(self):
        """Scan all symbols, process signals, and manage open positions."""
        account = self.connector.get_account_info()

        # Check circuit breaker
        if not self.risk_engine.check_daily_drawdown(account.equity):
            logger.warning("Daily drawdown limit active. Skipping new signal scans.")
            self.manage_open_positions()
            return

        # Check max open trades total
        open_positions = self.connector.get_open_positions()
        if len(open_positions) >= self.config.max_open_trades_total:
            logger.info(f"Maximum concurrent trades reached ({len(open_positions)}/{self.config.max_open_trades_total}).")
            self.manage_open_positions()
            return

        # 1. Scan Each Symbol
        for symbol in self.config.symbols:
            # Check symbol-specific position limit
            sym_positions = [p for p in open_positions if p.symbol == symbol]
            if len(sym_positions) >= self.config.max_open_trades_per_symbol:
                continue

            self._process_symbol(symbol, account)

        # 2. Manage Active Open Positions (Break-Even & Trailing Stops)
        self.manage_open_positions()

    def _process_symbol(self, symbol: str, account):
        """Analyze market structure for a single instrument and execute trades."""
        # Fetch OHLCV data
        df_m15 = self.connector.get_rates(symbol, self.config.timeframe_trend, 200)
        df_m5 = self.connector.get_rates(symbol, self.config.timeframe_entry, 200)

        if df_m15.empty or df_m5.empty:
            return

        # Evaluate Technical Structure & Pullback
        signal: TradeSignal = self.structure_engine.evaluate_signal(symbol, df_m15, df_m5)

        if signal.signal_type == SignalType.NONE:
            return

        logger.info(f"🔔 [SIGNAL DETECTED] {symbol} {signal.signal_type.value} @ {signal.entry_price:.5f} | Rationale: {signal.rationale}")

        # Check Spread
        sym_info = self.connector.get_symbol_info(symbol)
        if not sym_info or not self.risk_engine.check_spread(sym_info.spread):
            logger.warning(f"Aborting {symbol} trade: Spread is too wide.")
            return

        # Multi-Agent Committee Review
        if self.config.use_agent_filter and self.agent_bridge:
            verdict = self.agent_bridge.evaluate_signal(signal)
            logger.info(f"🤖 Multi-Agent Committee Verdict for {symbol}: Approved={verdict.approved} | Rating={verdict.rating}")

            if not verdict.approved:
                logger.info(f"⛔ Trade for {symbol} rejected by Multi-Agent Committee.")
                return

        # Position Sizing
        sizing = self.risk_engine.calculate_lot_size(
            symbol=symbol,
            account_equity=account.equity,
            entry_price=signal.entry_price,
            stop_loss=signal.stop_loss,
            point_size=sym_info.point,
            tick_value=sym_info.tick_value,
            contract_size=sym_info.contract_size,
        )

        if not sizing.is_valid:
            logger.warning(f"Sizing rejected for {symbol}: {sizing.rejection_reason}")
            return

        # Execute Order on MT5
        order_type = OrderType.BUY if signal.signal_type == SignalType.BUY else OrderType.SELL
        ticket = self.connector.open_position(
            symbol=symbol,
            order_type=order_type,
            volume=sizing.lot_size,
            stop_loss=signal.stop_loss,
            take_profit=signal.take_profit,
            comment=self.config.order_comment,
            magic=self.config.magic_number,
        )

        if ticket:
            logger.info(
                f"🎉 Order executed successfully! Ticket: #{ticket} | Symbol: {symbol} | "
                f"Lot: {sizing.lot_size} | Cash Risk: ${sizing.risk_amount_cash:.2f}"
            )

    def manage_open_positions(self):
        """Enforce Dynamic Break-Even Shifting and Trailing Stops on active positions."""
        positions = self.connector.get_open_positions()
        for pos in positions:
            if pos.magic != self.config.magic_number:
                continue

            sym_info = self.connector.get_symbol_info(pos.symbol)
            if not sym_info:
                continue

            current_price = sym_info.bid if pos.order_type == OrderType.BUY else sym_info.ask
            risk_dist = abs(pos.open_price - pos.stop_loss)

            if risk_dist <= 0:
                continue

            # --- 1. Break-Even Shift (At 1.0x R:R gain) ---
            if pos.order_type == OrderType.BUY:
                profit_distance = current_price - pos.open_price
                if profit_distance >= (self.config.breakeven_trigger_rr * risk_dist):
                    new_sl = pos.open_price + (2.0 * sym_info.point)  # Entry + small buffer
                    if pos.stop_loss < pos.open_price:
                        logger.info(f"🛡️ Moving #{pos.ticket} ({pos.symbol}) Stop Loss to Break-Even: {new_sl:.5f}")
                        self.connector.modify_position(pos.ticket, stop_loss=new_sl, take_profit=pos.take_profit)

            elif pos.order_type == OrderType.SELL:
                profit_distance = pos.open_price - current_price
                if profit_distance >= (self.config.breakeven_trigger_rr * risk_dist):
                    new_sl = pos.open_price - (2.0 * sym_info.point)
                    if pos.stop_loss > pos.open_price:
                        logger.info(f"🛡️ Moving #{pos.ticket} ({pos.symbol}) Stop Loss to Break-Even: {new_sl:.5f}")
                        self.connector.modify_position(pos.ticket, stop_loss=new_sl, take_profit=pos.take_profit)


def main():
    parser = argparse.ArgumentParser(description="TradingAgents MT5 Trend Pullback + Structure Break Bot")
    parser.add_argument("--single", action="store_true", help="Run a single scan iteration and exit")
    parser.add_argument("--symbols", type=str, default=None, help="Comma-separated symbols to trade")
    parser.add_argument("--risk", type=float, default=1.0, help="Risk percent per trade (default: 1.0)")
    parser.add_argument("--no-agents", action="store_true", help="Disable multi-agent filter")
    args = parser.parse_args()

    cfg = BotConfig.from_env()
    if args.symbols:
        cfg.symbols = [s.strip() for s in args.symbols.split(",")]
    cfg.risk_percent_per_trade = args.risk
    if args.no_agents:
        cfg.use_agent_filter = False

    bot = TrendPullbackBot(cfg)
    bot.start(single_iteration=args.single)


if __name__ == "__main__":
    main()
