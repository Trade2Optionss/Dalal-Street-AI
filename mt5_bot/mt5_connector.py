"""MetaTrader 5 Connector & High-Fidelity Paper Trading Simulator."""

import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional, Tuple
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)

# Attempt to import native MetaTrader5
try:
    import MetaTrader5 as mt5
    MT5_AVAILABLE = True
except ImportError:
    mt5 = None
    MT5_AVAILABLE = False


class OrderType(str, Enum):
    BUY = "BUY"
    SELL = "SELL"


@dataclass
class SymbolInfo:
    name: str
    bid: float
    ask: float
    spread: float
    point: float
    digits: int
    tick_value: float
    contract_size: float


@dataclass
class AccountInfo:
    login: int
    balance: float
    equity: float
    margin: float
    free_margin: float
    leverage: int
    currency: str


@dataclass
class Position:
    ticket: int
    symbol: str
    order_type: OrderType
    volume: float
    open_price: float
    open_time: datetime
    stop_loss: float
    take_profit: float
    current_price: float
    profit: float
    magic: int
    comment: str


class MT5Connector:
    """Unified MetaTrader 5 Bridge supporting both live terminal API and simulated dry-run mode."""

    # Timeframe mapping
    TIMEFRAME_MAP = {
        "M1": 1,
        "M5": 5,
        "M15": 15,
        "M30": 30,
        "H1": 60,
        "H4": 240,
        "D1": 1440,
    }

    def __init__(
        self,
        login: Optional[int] = None,
        password: Optional[str] = None,
        server: Optional[str] = None,
        path: Optional[str] = None,
        mock_mode: bool = False,
    ):
        self.login = login
        self.password = password
        self.server = server
        self.path = path
        self.mock_mode = mock_mode or not MT5_AVAILABLE
        self.is_connected = False

        # Paper simulator state
        self._sim_balance: float = 10000.0
        self._sim_positions: Dict[int, Position] = {}
        self._sim_ticket_counter: int = 100001
        self._sim_prices: Dict[str, float] = {}

    # --- Connection Lifecycle ---

    def connect(self) -> bool:
        """Initialize connection to MT5 terminal or start simulation mode."""
        if self.mock_mode or not MT5_AVAILABLE:
            logger.info("🟢 MT5Connector: Running in Simulated Paper Trading Mode (macOS / Standalone)")
            self.is_connected = True
            return True

        # Initialize native MT5
        init_kwargs = {}
        if self.path:
            init_kwargs["path"] = self.path
        if self.login:
            init_kwargs["login"] = self.login
        if self.password:
            init_kwargs["password"] = self.password
        if self.server:
            init_kwargs["server"] = self.server

        if not mt5.initialize(**init_kwargs):
            logger.warning(f"⚠️ MT5 native initialization failed ({mt5.last_error()}). Falling back to Paper Simulation Mode.")
            self.mock_mode = True
            self.is_connected = True
            return True

        self.is_connected = True
        logger.info(f"✅ Connected to MetaTrader 5 Terminal (Account: {mt5.account_info().login})")
        return True

    def disconnect(self):
        """Shutdown MT5 terminal connection."""
        if MT5_AVAILABLE and not self.mock_mode and self.is_connected:
            mt5.shutdown()
        self.is_connected = False
        logger.info("🔌 Disconnected from MetaTrader 5.")

    # --- Account & Market Data ---

    def get_account_info(self) -> AccountInfo:
        """Fetch account balance, floating equity, and margin."""
        if self.mock_mode or not MT5_AVAILABLE:
            # Calculate floating equity in sim
            floating_pnl = sum(p.profit for p in self._sim_positions.values())
            equity = self._sim_balance + floating_pnl
            return AccountInfo(
                login=999888,
                balance=self._sim_balance,
                equity=equity,
                margin=0.0,
                free_margin=equity,
                leverage=100,
                currency="USD",
            )

        info = mt5.account_info()
        return AccountInfo(
            login=info.login,
            balance=info.balance,
            equity=info.equity,
            margin=info.margin,
            free_margin=info.margin_free,
            leverage=info.leverage,
            currency=info.currency,
        )

    def get_symbol_info(self, symbol: str) -> Optional[SymbolInfo]:
        """Fetch current tick prices, spread, and contract specs."""
        if self.mock_mode or not MT5_AVAILABLE:
            # Default specs for simulator
            base_price = self._sim_prices.get(symbol, 1.0850 if "EUR" in symbol else (2400.0 if "XAU" in symbol else 100.0))
            spread_pts = 12.0
            point = 0.00001 if ("EUR" in symbol or "GBP" in symbol) else 0.01
            bid = base_price
            ask = base_price + (spread_pts * point)
            return SymbolInfo(
                name=symbol,
                bid=bid,
                ask=ask,
                spread=spread_pts,
                point=point,
                digits=5 if point == 0.00001 else 2,
                tick_value=1.0,
                contract_size=100000.0 if ("EUR" in symbol or "GBP" in symbol) else 100.0,
            )

        sym = mt5.symbol_info(symbol)
        if sym is None:
            mt5.symbol_select(symbol, True)
            sym = mt5.symbol_info(symbol)
        if sym is None:
            return None

        tick = mt5.symbol_info_tick(symbol)
        bid = tick.bid if tick else sym.bid
        ask = tick.ask if tick else sym.ask
        spread = sym.spread
        return SymbolInfo(
            name=symbol,
            bid=bid,
            ask=ask,
            spread=float(spread),
            point=sym.point,
            digits=sym.digits,
            tick_value=sym.trade_tick_value,
            contract_size=sym.trade_contract_size,
        )

    def get_rates(
        self,
        symbol: str,
        timeframe: str = "M5",
        count: int = 200,
    ) -> pd.DataFrame:
        """Fetch OHLCV candles as a pandas DataFrame."""
        if self.mock_mode or not MT5_AVAILABLE:
            return self._generate_simulated_ohlcv(symbol, timeframe, count)

        tf_code = getattr(mt5, f"TIMEFRAME_{timeframe}", mt5.TIMEFRAME_M5)
        rates = mt5.copy_rates_from_pos(symbol, tf_code, 0, count)
        if rates is None or len(rates) == 0:
            logger.warning(f"No rates returned from MT5 for {symbol} {timeframe}. Using fallback data.")
            return self._generate_simulated_ohlcv(symbol, timeframe, count)

        df = pd.DataFrame(rates)
        df["time"] = pd.to_datetime(df["time"], unit="s")
        df.set_index("time", inplace=True)
        return df

    def _generate_simulated_ohlcv(
        self,
        symbol: str,
        timeframe: str = "M5",
        count: int = 200,
    ) -> pd.DataFrame:
        """Generate realistic synthetic/cached market bars for simulator testing."""
        np.random.seed(42)
        base = 1.0850 if "EUR" in symbol else (2400.0 if "XAU" in symbol else 120.0)
        minutes = self.TIMEFRAME_MAP.get(timeframe, 5)

        end_time = datetime.now()
        times = [end_time - timedelta(minutes=minutes * (count - 1 - i)) for i in range(count)]

        # Generate trending random walk
        changes = np.random.normal(loc=0.0001, scale=0.0008, size=count)
        prices = base + np.cumsum(changes)

        opens = prices - (changes * 0.5)
        closes = prices
        highs = np.maximum(opens, closes) + np.random.uniform(0.0002, 0.0008, size=count)
        lows = np.minimum(opens, closes) - np.random.uniform(0.0002, 0.0008, size=count)
        volumes = np.random.randint(100, 2000, size=count)

        df = pd.DataFrame(
            {
                "open": opens,
                "high": highs,
                "low": lows,
                "close": closes,
                "tick_volume": volumes,
            },
            index=pd.DatetimeIndex(times, name="time"),
        )
        self._sim_prices[symbol] = float(closes[-1])
        return df

    # --- Trade Execution ---

    def open_position(
        self,
        symbol: str,
        order_type: OrderType,
        volume: float,
        stop_loss: float,
        take_profit: float,
        comment: str = "TradingAgents-BOS",
        magic: int = 888555,
    ) -> Optional[int]:
        """Execute market order on MT5 with Stop Loss and Take Profit."""
        sym_info = self.get_symbol_info(symbol)
        if not sym_info:
            logger.error(f"Cannot open position: symbol {symbol} not found.")
            return None

        price = sym_info.ask if order_type == OrderType.BUY else sym_info.bid

        if self.mock_mode or not MT5_AVAILABLE:
            ticket = self._sim_ticket_counter
            self._sim_ticket_counter += 1
            pos = Position(
                ticket=ticket,
                symbol=symbol,
                order_type=order_type,
                volume=volume,
                open_price=price,
                open_time=datetime.now(),
                stop_loss=stop_loss,
                take_profit=take_profit,
                current_price=price,
                profit=0.0,
                magic=magic,
                comment=comment,
            )
            self._sim_positions[ticket] = pos
            logger.info(
                f"🎯 [SIMULATOR] Opened {order_type.value} #{ticket} on {symbol} | "
                f"Vol: {volume} @ {price:.5f} | SL: {stop_loss:.5f} | TP: {take_profit:.5f}"
            )
            return ticket

        # Live MT5 execution
        mt5_action = mt5.ORDER_TYPE_BUY if order_type == OrderType.BUY else mt5.ORDER_TYPE_SELL
        request = {
            "action": mt5.TRADE_ACTION_DEAL,
            "symbol": symbol,
            "volume": volume,
            "type": mt5_action,
            "price": price,
            "sl": stop_loss,
            "tp": take_profit,
            "deviation": 20,
            "magic": magic,
            "comment": comment,
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_IOC,
        }

        result = mt5.order_send(request)
        if result.retcode != mt5.TRADE_RETCODE_DONE:
            logger.error(f"❌ MT5 Order failed (retcode={result.retcode}): {result.comment}")
            return None

        logger.info(f"✅ [LIVE MT5] Opened {order_type.value} #{result.order} on {symbol} @ {result.price}")
        return result.order

    def modify_position(self, ticket: int, stop_loss: float, take_profit: float) -> bool:
        """Update SL and TP for an open position."""
        if self.mock_mode or not MT5_AVAILABLE:
            if ticket in self._sim_positions:
                self._sim_positions[ticket].stop_loss = stop_loss
                self._sim_positions[ticket].take_profit = take_profit
                logger.info(f"🔧 [SIMULATOR] Modified #{ticket} SL: {stop_loss:.5f}, TP: {take_profit:.5f}")
                return True
            return False

        request = {
            "action": mt5.TRADE_ACTION_SLTP,
            "position": ticket,
            "sl": stop_loss,
            "tp": take_profit,
        }
        res = mt5.order_send(request)
        return res.retcode == mt5.TRADE_RETCODE_DONE

    def close_position(self, ticket: int) -> bool:
        """Close an active open position."""
        if self.mock_mode or not MT5_AVAILABLE:
            if ticket in self._sim_positions:
                pos = self._sim_positions.pop(ticket)
                self._sim_balance += pos.profit
                logger.info(f"🔒 [SIMULATOR] Closed #{ticket} on {pos.symbol} | P&L: ${pos.profit:.2f}")
                return True
            return False

        pos = mt5.positions_get(ticket=ticket)
        if not pos:
            return False
        p = pos[0]
        sym = p.symbol
        close_type = mt5.ORDER_TYPE_SELL if p.type == mt5.ORDER_TYPE_BUY else mt5.ORDER_TYPE_BUY
        sym_info = mt5.symbol_info_tick(sym)
        price = sym_info.bid if close_type == mt5.ORDER_TYPE_SELL else sym_info.ask

        request = {
            "action": mt5.TRADE_ACTION_DEAL,
            "position": ticket,
            "symbol": sym,
            "volume": p.volume,
            "type": close_type,
            "price": price,
            "deviation": 20,
            "magic": p.magic,
            "comment": "TradingAgents-Close",
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_IOC,
        }
        res = mt5.order_send(request)
        return res.retcode == mt5.TRADE_RETCODE_DONE

    def get_open_positions(self, symbol: Optional[str] = None) -> List[Position]:
        """Fetch list of all currently active positions."""
        if self.mock_mode or not MT5_AVAILABLE:
            positions = list(self._sim_positions.values())
            if symbol:
                positions = [p for p in positions if p.symbol == symbol]
            return positions

        kwargs = {"symbol": symbol} if symbol else {}
        mt5_positions = mt5.positions_get(**kwargs)
        if mt5_positions is None:
            return []

        result = []
        for p in mt5_positions:
            result.append(
                Position(
                    ticket=p.ticket,
                    symbol=p.symbol,
                    order_type=OrderType.BUY if p.type == 0 else OrderType.SELL,
                    volume=p.volume,
                    open_price=p.price_open,
                    open_time=datetime.fromtimestamp(p.time),
                    stop_loss=p.sl,
                    take_profit=p.tp,
                    current_price=p.price_current,
                    profit=p.profit,
                    magic=p.magic,
                    comment=p.comment,
                )
            )
        return result
