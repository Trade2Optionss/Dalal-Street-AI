"""Risk Management & Dynamic Position Sizing Engine for MT5."""

import logging
from dataclasses import dataclass
from typing import Optional

logger = logging.getLogger(__name__)


@dataclass
class SizingResult:
    lot_size: float
    risk_amount_cash: float
    is_valid: bool
    rejection_reason: Optional[str] = None


class RiskEngine:
    """Calculates position sizing, enforces spread filters and drawdown circuit breakers."""

    def __init__(
        self,
        risk_percent_per_trade: float = 1.0,
        max_daily_drawdown_percent: float = 4.0,
        max_spread_points: int = 30,
        min_lot: float = 0.01,
        max_lot: float = 20.0,
        lot_step: float = 0.01,
    ):
        self.risk_percent = risk_percent_per_trade
        self.max_daily_drawdown = max_daily_drawdown_percent
        self.max_spread_points = max_spread_points
        self.min_lot = min_lot
        self.max_lot = max_lot
        self.lot_step = lot_step
        self.start_of_day_balance: Optional[float] = None

    def initialize_day(self, current_balance: float):
        """Set initial daily balance for drawdown monitoring."""
        if self.start_of_day_balance is None:
            self.start_of_day_balance = current_balance

    def check_daily_drawdown(self, current_equity: float) -> bool:
        """Return False if daily loss limit is breached."""
        if self.start_of_day_balance is None or self.start_of_day_balance <= 0:
            return True

        drawdown_pct = (
            (self.start_of_day_balance - current_equity) / self.start_of_day_balance
        ) * 100.0

        if drawdown_pct >= self.max_daily_drawdown:
            logger.warning(
                f"🚨 Daily drawdown limit breached! Current DD: {drawdown_pct:.2f}% "
                f"(Max: {self.max_daily_drawdown}%). Halting new trades."
            )
            return False
        return True

    def check_spread(self, spread_points: float) -> bool:
        """Verify that current spread is within allowable threshold."""
        if spread_points > self.max_spread_points:
            logger.warning(
                f"⚠️ Spread too wide: {spread_points:.1f} points (Max: {self.max_spread_points})"
            )
            return False
        return True

    def calculate_lot_size(
        self,
        symbol: str,
        account_equity: float,
        entry_price: float,
        stop_loss: float,
        point_size: float = 0.00001,
        tick_value: float = 1.0,
        contract_size: float = 100000.0,
    ) -> SizingResult:
        """Calculate exact lot size based on account risk percentage and SL distance."""
        if account_equity <= 0:
            return SizingResult(0.0, 0.0, False, "Account equity is zero or negative.")

        # Check circuit breaker
        if not self.check_daily_drawdown(account_equity):
            return SizingResult(
                0.0, 0.0, False, "Daily drawdown circuit breaker active."
            )

        sl_distance = abs(entry_price - stop_loss)
        if sl_distance <= 0:
            return SizingResult(0.0, 0.0, False, "Stop loss equals entry price.")

        # Maximum cash willing to risk
        cash_risk = account_equity * (self.risk_percent / 100.0)

        # Asset-specific calculation
        sym_upper = symbol.upper()
        if "XAU" in sym_upper or "GOLD" in sym_upper:
            # 1 Standard Lot of Gold = 100 Troy Ounces ($1 move = $100)
            lot = cash_risk / (sl_distance * 100.0)
        elif "BTC" in sym_upper or "ETH" in sym_upper or "CRYPTO" in sym_upper:
            # Crypto: 1 lot = 1 coin
            lot = cash_risk / sl_distance
        elif any(eq in sym_upper for eq in ["NVDA", "AAPL", "MSFT", "SPY", "QQQ"]):
            # Equities / ETFs
            lot = cash_risk / sl_distance
        else:
            # Forex Standard Pairs (e.g. EURUSD, GBPUSD)
            # SL distance in points
            sl_points = sl_distance / point_size
            if sl_points <= 0:
                return SizingResult(0.0, 0.0, False, "Invalid SL points.")
            lot = cash_risk / (sl_points * tick_value)

        # Clamp to broker constraints & round to lot_step
        steps = round(lot / self.lot_step)
        final_lot = steps * self.lot_step

        if final_lot < self.min_lot:
            final_lot = self.min_lot
        elif final_lot > self.max_lot:
            final_lot = self.max_lot

        final_lot = round(final_lot, 2)

        return SizingResult(
            lot_size=final_lot,
            risk_amount_cash=round(cash_risk, 2),
            is_valid=True,
            rejection_reason=None,
        )
