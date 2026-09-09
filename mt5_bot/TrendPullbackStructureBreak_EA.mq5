//+------------------------------------------------------------------+
//|                               TrendPullbackStructureBreak_EA.mq5 |
//|                             Powered by TradingAgents Architecture|
//|                                  https://github.com/TauricResearch|
//+------------------------------------------------------------------+
#property copyright "TradingAgents Framework"
#property link      "https://github.com/TauricResearch/TradingAgents"
#property version   "2.00"
#property description "Active Daily Session Scalping (M5/M15) Expert Advisor"

#include <Trade\Trade.mqh>
#include <Trade\SymbolInfo.mqh>
#include <Trade\AccountInfo.mqh>
#include <Trade\PositionInfo.mqh>

//--- Input Parameters ---
input group "=== Active Scalping Strategy Parameters ==="
input ENUM_TIMEFRAMES InpTimeframeTrend = PERIOD_M15;    // Higher Timeframe Trend Alignment
input ENUM_TIMEFRAMES InpTimeframeEntry = PERIOD_M5;     // Scalp Entry Timeframe
input int             InpEmaFast        = 9;              // Fast Scalp EMA Ribbon
input int             InpEmaSlow        = 21;             // Slow Scalp EMA Ribbon
input int             InpEmaTrend       = 50;             // Dynamic Trend Baseline EMA
input int             InpSwingLookback  = 3;              // Responsive Micro-Fractal Lookback
input int             InpAtrPeriod      = 14;             // ATR Volatility Period
input double          InpAtrMultiplierSL= 1.0;            // Scalp ATR Buffer for Stop Loss
input double          InpRiskRewardRatio= 1.6;            // Scalp Risk/Reward Target (1 : 1.6)

input group "=== Session Timing Filter (Killzones) ==="
input bool            InpEnableSessionFilter = true;      // Enable London & NY Killzones
input int             InpLondonStartHour     = 7;         // 07:00 UTC London Open
input int             InpLondonEndHour       = 11;        // 11:00 UTC
input int             InpNYStartHour         = 12;        // 12:30 UTC New York Open
input int             InpNYEndHour           = 17;        // 17:00 UTC NY / London Overlap

input group "=== Risk & Trade Management ==="
input double          InpRiskPercent    = 1.0;            // Risk Percent of Equity per Scalp
input double          InpMaxSpreadPoints= 25.0;           // Max Allowable Spread in Points
input bool            InpEnableBreakEven= false;          // Enable Break-Even Shift (Disabled for Scalps)
input double          InpBreakEvenRR    = 2.0;            // Move SL to Break-Even at (x Risk)
input ulong           InpMagicNumber    = 777333;         // Scalper Magic Number
input string          InpTradeComment   = "TradingAgents-Scalp";

//--- Global Objects & Handles ---
CTrade         m_trade;
CSymbolInfo    m_symbol;
CAccountInfo   m_account;
CPositionInfo  m_position;

int handle_m15_ema_fast, handle_m15_ema_slow, handle_m15_ema_trend;
int handle_m5_ema_fast, handle_m5_ema_slow, handle_m5_atr;
datetime last_bar_time = 0;

int OnInit()
{
   m_trade.SetExpertMagicNumber(InpMagicNumber);
   m_trade.SetMarginMode();
   m_trade.SetTypeFillingBySymbol(_Symbol);

   if(!m_symbol.Name(_Symbol)) return INIT_FAILED;

   handle_m15_ema_fast  = iMA(_Symbol, InpTimeframeTrend, InpEmaFast,  0, MODE_EMA, PRICE_CLOSE);
   handle_m15_ema_slow  = iMA(_Symbol, InpTimeframeTrend, InpEmaSlow,  0, MODE_EMA, PRICE_CLOSE);
   handle_m15_ema_trend = iMA(_Symbol, InpTimeframeTrend, InpEmaTrend, 0, MODE_EMA, PRICE_CLOSE);

   handle_m5_ema_fast   = iMA(_Symbol, InpTimeframeEntry, InpEmaFast,  0, MODE_EMA, PRICE_CLOSE);
   handle_m5_ema_slow   = iMA(_Symbol, InpTimeframeEntry, InpEmaSlow,  0, MODE_EMA, PRICE_CLOSE);
   handle_m5_atr        = iATR(_Symbol, InpTimeframeEntry, InpAtrPeriod);

   if(handle_m15_ema_fast == INVALID_HANDLE || handle_m5_ema_fast == INVALID_HANDLE || handle_m5_atr == INVALID_HANDLE)
      return INIT_FAILED;

   Print("⚡ TradingAgents Active Session Scalping EA Initialized on ", _Symbol);
   return INIT_SUCCEEDED;
}

void OnDeinit(const int reason)
{
   IndicatorRelease(handle_m15_ema_fast);
   IndicatorRelease(handle_m15_ema_slow);
   IndicatorRelease(handle_m15_ema_trend);
   IndicatorRelease(handle_m5_ema_fast);
   IndicatorRelease(handle_m5_ema_slow);
   IndicatorRelease(handle_m5_atr);
}

bool IsActiveSession()
{
   if(!InpEnableSessionFilter) return true;
   MqlDateTime dt;
   TimeGMT(dt);
   bool in_london = (dt.hour >= InpLondonStartHour && dt.hour < InpLondonEndHour);
   bool in_ny = (dt.hour == 12 && dt.min >= 30) || (dt.hour >= 13 && dt.hour < InpNYEndHour);
   return in_london || in_ny;
}

double CalculateLotSize(double entry_price, double stop_loss)
{
   double equity = m_account.Equity();
   double risk_cash = equity * (InpRiskPercent / 100.0);
   double sl_dist = MathAbs(entry_price - stop_loss);
   if(sl_dist <= 0.0) return 0.0;

   double tick_value = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
   double min_lot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   double max_lot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
   double lot_step = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);

   double sl_points = sl_dist / _Point;
   double lot = risk_cash / (sl_points * tick_value);

   lot = MathFloor(lot / lot_step) * lot_step;
   if(lot < min_lot) lot = min_lot;
   if(lot > max_lot) lot = max_lot;

   return NormalizeDouble(lot, 2);
}

bool IsNewBar()
{
   datetime current_time = iTime(_Symbol, InpTimeframeEntry, 0);
   if(current_time != last_bar_time)
   {
      last_bar_time = current_time;
      return true;
   }
   return false;
}

void OnTick()
{
   m_symbol.RefreshRates();

   // Break-Even Management (if enabled)
   if(InpEnableBreakEven)
   {
      for(int i = PositionsTotal() - 1; i >= 0; i--)
      {
         if(m_position.SelectByIndex(i) && m_position.Magic() == InpMagicNumber && m_position.Symbol() == _Symbol)
         {
            double open_price = m_position.PriceOpen();
            double sl = m_position.StopLoss();
            double tp = m_position.TakeProfit();
            double current_price = m_position.PriceCurrent();
            double risk = MathAbs(open_price - sl);

            if(m_position.PositionType() == POSITION_TYPE_BUY)
            {
               if((current_price - open_price) >= (InpBreakEvenRR * risk) && sl < open_price)
                  m_trade.PositionModify(m_position.Ticket(), open_price + (2 * _Point), tp);
            }
            else if(m_position.PositionType() == POSITION_TYPE_SELL)
            {
               if((open_price - current_price) >= (InpBreakEvenRR * risk) && sl > open_price)
                  m_trade.PositionModify(m_position.Ticket(), open_price - (2 * _Point), tp);
            }
         }
      }
   }

   if(!IsNewBar()) return;
   if(!IsActiveSession()) return; // Trade only high volume sessions

   double spread = (double)m_symbol.Spread();
   if(spread > InpMaxSpreadPoints) return;

   // 1. M15 Trend Filter
   double m15_fast[], m15_slow[], m15_trend[];
   ArraySetAsSeries(m15_fast, true);
   ArraySetAsSeries(m15_slow, true);
   ArraySetAsSeries(m15_trend, true);

   CopyBuffer(handle_m15_ema_fast,  0, 1, 2, m15_fast);
   CopyBuffer(handle_m15_ema_slow,  0, 1, 2, m15_slow);
   CopyBuffer(handle_m15_ema_trend, 0, 1, 2, m15_trend);

   bool m15_bullish = (m15_fast[0] > m15_slow[0] && m15_slow[0] > m15_trend[0]);
   bool m15_bearish = (m15_fast[0] < m15_slow[0] && m15_slow[0] < m15_trend[0]);

   if(!m15_bullish && !m15_bearish) return;

   // 2. M5 Scalp Retracement & Trigger
   MqlRates rates_m5[];
   ArraySetAsSeries(rates_m5, true);
   int copied = CopyRates(_Symbol, InpTimeframeEntry, 1, 40, rates_m5);
   if(copied < 30) return;

   double m5_fast[], m5_slow[], m5_atr[];
   ArraySetAsSeries(m5_fast, true);
   ArraySetAsSeries(m5_slow, true);
   ArraySetAsSeries(m5_atr, true);

   CopyBuffer(handle_m5_ema_fast, 0, 1, 3, m5_fast);
   CopyBuffer(handle_m5_ema_slow, 0, 1, 3, m5_slow);
   CopyBuffer(handle_m5_atr,      0, 1, 3, m5_atr);

   double atr = m5_atr[0];
   double current_close = rates_m5[0].close;
   double current_open  = rates_m5[0].open;
   double current_low   = rates_m5[0].low;
   double current_high  = rates_m5[0].high;

   // Check Active Positions
   if(PositionsTotal() > 0) return;

   // Long Scalp Entry
   if(m15_bullish)
   {
      bool in_ema_zone = (current_low <= m5_fast[0] && current_close >= m5_slow[0] * 0.999);
      bool bullish_rejection = (current_close > current_open);

      if(in_ema_zone && bullish_rejection)
      {
         double entry = m_symbol.Ask();
         double sl = m5_slow[0] - (InpAtrMultiplierSL * atr);
         double risk = entry - sl;
         if(risk > 0)
         {
            double tp = entry + (InpRiskRewardRatio * risk);
            double lot = CalculateLotSize(entry, sl);
            if(lot > 0.0)
            {
               m_trade.Buy(lot, _Symbol, entry, sl, tp, InpTradeComment);
               Print("⚡ [SCALPER] Opened BUY: ", lot, " lots @ ", entry, " | SL: ", sl, " | TP: ", tp);
            }
         }
      }
   }
   // Short Scalp Entry
   else if(m15_bearish)
   {
      bool in_ema_zone = (current_high >= m5_fast[0] && current_close <= m5_slow[0] * 1.001);
      bool bearish_rejection = (current_close < current_open);

      if(in_ema_zone && bearish_rejection)
      {
         double entry = m_symbol.Bid();
         double sl = m5_slow[0] + (InpAtrMultiplierSL * atr);
         double risk = sl - entry;
         if(risk > 0)
         {
            double tp = entry - (InpRiskRewardRatio * risk);
            double lot = CalculateLotSize(entry, sl);
            if(lot > 0.0)
            {
               m_trade.Sell(lot, _Symbol, entry, sl, tp, InpTradeComment);
               Print("⚡ [SCALPER] Opened SELL: ", lot, " lots @ ", entry, " | SL: ", sl, " | TP: ", tp);
            }
         }
      }
   }
}
//+------------------------------------------------------------------+
