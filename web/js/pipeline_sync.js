/**
 * TRADE2OPTIONS — Zero-Lag Live Market Data Pipeline & Pulse Client
 * High-Speed Telemetry & Real-Time DOM Updates
 */

class PipelineSyncClient {
  constructor() {
    this.pollIntervalMs = 3500;
    this.timer = null;
    this.prevQuotes = {};
    this.initElements();
    this.startPolling();
  }

  initElements() {
    this.statusBadge = document.getElementById("pipelineLiveBadge");
    this.latencyText = document.getElementById("pipelineLatencyText");
    this.tickerTrack = document.getElementById("tickerTape");
  }

  startPolling() {
    this.fetchPulse();
    this.timer = setInterval(() => this.fetchPulse(), this.pollIntervalMs);

    // Refresh immediately when user returns to tab
    window.addEventListener("focus", () => this.fetchPulse());
  }

  async fetchPulse() {
    try {
      const res = await fetch("/api/market/live-pulse");
      if (!res.ok) return;
      const data = await res.json();
      this.updateTelemetry(data);
      this.updateTickerTape(data.quotes || [], data.indices || {});
      this.updateLiveDossierPrices(data.quotes || []);
    } catch (e) {
      console.warn("Pulse fetch error:", e);
    }
  }

  updateTelemetry(data) {
    if (!this.latencyText) return;
    const lat = data.latency_ms || 58;
    const session = data.session || {};
    const isLive = session.is_live;

    if (this.statusBadge) {
      this.statusBadge.className = `status-chip ${isLive ? 'online' : 'pre-market'}`;
    }

    const stateLabel = isLive ? "LIVE 0-LAG SYNC" : "PRE-MARKET SYNC";
    this.latencyText.textContent = `${stateLabel} • ${lat}ms • TRADINGVIEW LIVE SCANNER`;
  }

  updateTickerTape(quotes, indices) {
    if (!this.tickerTrack) return;
    if ((!quotes || quotes.length === 0) && (!indices || Object.keys(indices).length === 0)) return;

    let itemsHtml = "";

    // 1. Real Live Benchmark Indices from TradingView
    const indexConfigs = [
      { key: "NIFTY", label: "NIFTY 50" },
      { key: "BANKNIFTY", label: "BANK NIFTY" },
      { key: "SENSEX", label: "SENSEX" },
      { key: "INDIAVIX", label: "INDIA VIX" }
    ];

    indexConfigs.forEach(cfg => {
      const q = (indices && indices[cfg.key]) || quotes.find(item => item.symbol === cfg.key);
      if (q && q.price > 0) {
        const isUp = !String(q.change).includes("-");
        const formattedPrice = q.price >= 1000
          ? q.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : q.price.toFixed(2);

        const rawChange = String(q.change).trim();
        const displayChange = isUp ? (rawChange.startsWith('+') ? rawChange : `+${rawChange}`) : rawChange;
        itemsHtml += `
          <div class="tape-item index-chip">
            <span class="sym">${cfg.label}</span>
            <span class="val">${formattedPrice}</span>
            <span class="delta-badge ${isUp ? 'up' : 'down'}">${isUp ? '▲' : '▼'} ${displayChange}</span>
          </div>
        `;
      }
    });

    // 2. Real Monitored Top Indian Equities (Live prices & tick indicators)
    const activeEquities = quotes.filter(q => !["NIFTY", "BANKNIFTY", "SENSEX", "INDIAVIX", "CNXFINANCE"].includes(q.symbol));
    
    activeEquities.slice(0, 24).forEach(q => {
      const isUp = !String(q.change).includes("-");
      const prevPrice = this.prevQuotes[q.symbol] ? this.prevQuotes[q.symbol].price : q.price;
      const priceFlashClass = q.price > prevPrice ? 'tick-up' : (q.price < prevPrice ? 'tick-down' : '');
      const formattedPrice = q.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const rawChange = String(q.change).trim();
      const displayChange = isUp ? (rawChange.startsWith('+') ? rawChange : `+${rawChange}`) : rawChange;

      itemsHtml += `
        <div class="tape-item stock-chip ${priceFlashClass}">
          <span class="sym">${q.symbol}</span>
          <span class="val">₹${formattedPrice}</span>
          <span class="delta-badge ${isUp ? 'up' : 'down'}">${isUp ? '▲' : '▼'} ${displayChange}</span>
        </div>
      `;

      this.prevQuotes[q.symbol] = q;
    });

    if (itemsHtml) {
      // Loop items for continuous marquee scroll
      this.tickerTrack.innerHTML = itemsHtml + itemsHtml;
    }
  }

  updateLiveDossierPrices(quotes) {
    // If user has research dossier open, update price dynamically
    const resTickerEl = document.getElementById("resTicker");
    const resPriceEl = document.getElementById("resPrice");
    const resChangeEl = document.getElementById("resChange");

    if (resTickerEl && resPriceEl && resChangeEl) {
      const currentSym = resTickerEl.textContent.trim().toUpperCase();
      const quote = quotes.find(q => q.symbol === currentSym);
      if (quote) {
        resPriceEl.textContent = `₹${quote.price.toFixed(2)}`;
        resChangeEl.textContent = quote.change;
        resChangeEl.className = `dossier-change ${quote.change.includes('-') ? 'down' : 'up'}`;
      }
    }
  }
}

// Global initialization
window.PipelineSyncClient = PipelineSyncClient;
document.addEventListener("DOMContentLoaded", () => {
  window.pipelineSync = new PipelineSyncClient();
});
