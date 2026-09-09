/**
 * TRADE2OPTIONS — Daily Bull vs. Bear Sentiment Radar & Universal Head-to-Head Stock Comparison
 */

class StockComparisonHub {
  constructor() {
    this.stockA = "HDFCBANK";
    this.stockB = "ICICIBANK";
    this.searchTimerA = null;
    this.searchTimerB = null;

    this.initElements();
    this.bindEvents();
    this.loadSentimentComparison();
  }

  initElements() {
    // Breadth elements
    this.breadthBias = document.getElementById("compMarketBias");
    this.advCount = document.getElementById("compAdvCount");
    this.decCount = document.getElementById("compDecCount");
    this.fiiFlow = document.getElementById("compFiiFlow");
    this.diiFlow = document.getElementById("compDiiFlow");
    this.niftyPcr = document.getElementById("compNiftyPcr");
    this.indiaVix = document.getElementById("compIndiaVix");

    // Bull / Bear Grid containers
    this.bullGrid = document.getElementById("bullStocksGrid");
    this.bearGrid = document.getElementById("bearStocksGrid");

    // Universal Head-to-head search inputs
    this.inputStockA = document.getElementById("compareSearchA");
    this.dropdownA = document.getElementById("compareDropdownA");
    this.inputStockB = document.getElementById("compareSearchB");
    this.dropdownB = document.getElementById("compareDropdownB");
    
    this.presetPills = document.querySelectorAll(".battle-preset-pill");
    this.btnRunCompare = document.getElementById("runCompareBtn");
    this.compareResultsCard = document.getElementById("compareResultsCard");
  }

  bindEvents() {
    // Search A Input with Autocomplete
    if (this.inputStockA) {
      this.inputStockA.addEventListener("input", (e) => {
        clearTimeout(this.searchTimerA);
        const q = e.target.value.trim();
        if (!q) {
          if (this.dropdownA) this.dropdownA.classList.remove("show");
          return;
        }
        this.searchTimerA = setTimeout(() => this.fetchStockSuggestions(q, this.dropdownA, (sym) => {
          this.stockA = sym;
          this.inputStockA.value = sym;
          this.dropdownA.classList.remove("show");
          this.runHeadToHeadComparison();
        }), 200);
      });

      this.inputStockA.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.stockA = this.inputStockA.value.trim().toUpperCase() || "HDFCBANK";
          if (this.dropdownA) this.dropdownA.classList.remove("show");
          this.runHeadToHeadComparison();
        }
      });
    }

    // Search B Input with Autocomplete
    if (this.inputStockB) {
      this.inputStockB.addEventListener("input", (e) => {
        clearTimeout(this.searchTimerB);
        const q = e.target.value.trim();
        if (!q) {
          if (this.dropdownB) this.dropdownB.classList.remove("show");
          return;
        }
        this.searchTimerB = setTimeout(() => this.fetchStockSuggestions(q, this.dropdownB, (sym) => {
          this.stockB = sym;
          this.inputStockB.value = sym;
          this.dropdownB.classList.remove("show");
          this.runHeadToHeadComparison();
        }), 200);
      });

      this.inputStockB.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.stockB = this.inputStockB.value.trim().toUpperCase() || "ICICIBANK";
          if (this.dropdownB) this.dropdownB.classList.remove("show");
          this.runHeadToHeadComparison();
        }
      });
    }

    // Preset Duel Pills
    this.presetPills.forEach(pill => {
      pill.addEventListener("click", () => {
        this.presetPills.forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        const a = pill.dataset.stockA;
        const b = pill.dataset.stockB;
        this.stockA = a;
        this.stockB = b;
        if (this.inputStockA) this.inputStockA.value = a;
        if (this.inputStockB) this.inputStockB.value = b;
        this.runHeadToHeadComparison();
      });
    });

    // Close dropdowns on outside click
    document.addEventListener("click", (e) => {
      if (this.dropdownA && !e.target.closest("#compareWrapA")) {
        this.dropdownA.classList.remove("show");
      }
      if (this.dropdownB && !e.target.closest("#compareWrapB")) {
        this.dropdownB.classList.remove("show");
      }
    });

    if (this.btnRunCompare) {
      this.btnRunCompare.addEventListener("click", () => {
        if (this.inputStockA && this.inputStockA.value.trim()) {
          this.stockA = this.inputStockA.value.trim().toUpperCase();
        }
        if (this.inputStockB && this.inputStockB.value.trim()) {
          this.stockB = this.inputStockB.value.trim().toUpperCase();
        }
        this.runHeadToHeadComparison();
      });
    }
  }

  async fetchStockSuggestions(query, dropdownEl, onSelect) {
    if (!dropdownEl) return;
    try {
      const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      const results = data.results || [];

      if (results.length === 0) {
        dropdownEl.innerHTML = `<div style="padding:10px; color:#94a3b8; font-size:0.78rem;">No stock found for "${query}"</div>`;
        dropdownEl.classList.add("show");
        return;
      }

      dropdownEl.innerHTML = results.map(s => `
        <div class="suggestion-item" data-sym="${s.symbol}">
          <div>
            <span class="sugg-sym">${s.symbol}</span>
            <span class="sugg-name">${s.name && s.name.length > 20 ? s.name.substring(0, 18) + '...' : (s.name || s.symbol)}</span>
            <div class="sugg-sector">${s.sector || 'Indian Equities'}</div>
          </div>
          <div style="text-align: right;">
            <div class="sugg-price">₹${s.price || 0.0}</div>
            <div style="font-size:0.7rem; font-weight:700; color:${(s.change||'').includes('-') ? '#ef4444' : '#10b981'}">${s.change || '+0.00%'}</div>
          </div>
        </div>
      `).join("");

      dropdownEl.classList.add("show");

      dropdownEl.querySelectorAll(".suggestion-item").forEach(item => {
        item.addEventListener("click", () => {
          onSelect(item.dataset.sym);
        });
      });

    } catch (e) {
      console.warn("Stock search suggestion error:", e);
    }
  }

  async loadSentimentComparison() {
    try {
      const res = await fetch("/api/market/sentiment-comparison");
      const data = await res.json();

      // Render Breadth Banner
      const b = data.breadth;
      if (this.breadthBias) this.breadthBias.textContent = b.market_bias;
      if (this.advCount) this.advCount.textContent = `${b.advance_count} Advances`;
      if (this.decCount) this.decCount.textContent = `${b.decline_count} Declines`;
      if (this.fiiFlow) this.fiiFlow.textContent = b.fii_net_flow;
      if (this.diiFlow) this.diiFlow.textContent = b.dii_net_flow;
      if (this.niftyPcr) this.niftyPcr.textContent = b.nifty_pcr;
      if (this.indiaVix) this.indiaVix.textContent = b.india_vix;

      // Render Bull-Side Stocks
      if (this.bullGrid && data.bull_side_stocks) {
        this.bullGrid.innerHTML = data.bull_side_stocks.map(s => `
          <div class="sentiment-stock-card bull-card" data-sym="${s.symbol}">
            <div class="card-top-row">
              <div>
                <span class="stock-sym">${s.symbol}</span>
                <span class="stock-sub-name">${s.name && s.name.length > 22 ? s.name.substring(0, 20) + '...' : (s.name || s.symbol)}</span>
              </div>
              <div class="stock-price-col">
                <span class="stock-price">₹${s.price}</span>
                <span class="stock-chg up">${s.change}</span>
              </div>
            </div>
            <div class="card-mid-metrics">
              <span>RSI: <strong>${s.rsi}</strong></span>
              <span>ROCE: <strong>${s.roce}</strong></span>
              <span>P/E: <strong>${s.pe}</strong></span>
            </div>
            <div class="card-sentiment-badge">
              <span class="bull-pill"><i data-lucide="trending-up"></i> ${s.sentiment}/100 Conviction</span>
              <span class="rating-lbl">${s.rating}</span>
            </div>
          </div>
        `).join("");
      }

      // Render Bear-Side Stocks
      if (this.bearGrid && data.bear_side_stocks) {
        this.bearGrid.innerHTML = data.bear_side_stocks.map(s => `
          <div class="sentiment-stock-card bear-card" data-sym="${s.symbol}">
            <div class="card-top-row">
              <div>
                <span class="stock-sym">${s.symbol}</span>
                <span class="stock-sub-name">${s.name && s.name.length > 22 ? s.name.substring(0, 20) + '...' : (s.name || s.symbol)}</span>
              </div>
              <div class="stock-price-col">
                <span class="stock-price">₹${s.price}</span>
                <span class="stock-chg down">${s.change}</span>
              </div>
            </div>
            <div class="card-mid-metrics">
              <span>RSI: <strong>${s.rsi}</strong></span>
              <span>ROCE: <strong>${s.roce}</strong></span>
              <span>P/E: <strong>${s.pe}</strong></span>
            </div>
            <div class="card-sentiment-badge">
              <span class="bear-pill"><i data-lucide="trending-down"></i> ${s.sentiment}/100 Drag</span>
              <span class="rating-lbl red">${s.rating}</span>
            </div>
          </div>
        `).join("");
      }

      // Auto-run initial comparison
      this.runHeadToHeadComparison();

      if (window.lucide) lucide.createIcons();

    } catch (e) {
      console.error("Error loading sentiment comparison:", e);
    }
  }

  async runHeadToHeadComparison() {
    const stockA = this.stockA || "HDFCBANK";
    const stockB = this.stockB || "ICICIBANK";

    try {
      this.btnRunCompare.disabled = true;
      this.btnRunCompare.innerHTML = '<i data-lucide="loader"></i> Comparing Agents...';
      if (window.lucide) lucide.createIcons();

      const res = await fetch("/api/market/compare-stocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker_a: stockA, ticker_b: stockB })
      });

      const data = await res.json();
      this.renderCompareBattle(data);

    } catch (e) {
      console.error("Head-to-head comparison error:", e);
    } finally {
      this.btnRunCompare.disabled = false;
      this.btnRunCompare.innerHTML = '<i data-lucide="swords"></i> Run Head-to-Head Comparison';
      if (window.lucide) lucide.createIcons();
    }
  }

  renderCompareBattle(data) {
    const a = data.stock_a;
    const b = data.stock_b;

    if (!this.compareResultsCard) return;

    this.compareResultsCard.innerHTML = `
      <div class="battle-header">
        <div class="battle-winner-banner">
          <i data-lucide="crown"></i> WINNING SELECTION TODAY: <span class="winner-name">${data.winner}</span> (Score: ${data.winner === a.symbol ? data.score_a : data.score_b} pts)
        </div>
        <p class="battle-summary-text">${data.verdict_summary}</p>
      </div>

      <div class="battle-grid">
        <!-- Stock A Column -->
        <div class="battle-column ${data.winner === a.symbol ? 'is-winner' : ''}">
          <div class="battle-stock-top">
            <h3>${a.symbol}</h3>
            <span class="battle-stock-name">${a.name}</span>
            <div class="battle-price">₹${a.price} <span class="${a.change.includes('-') ? 'down' : 'up'}">${a.change}</span></div>
          </div>
          
          <div class="battle-metrics-table">
            <div class="b-row"><span>Multi-Agent Rating</span> <strong>${a.rating}</strong></div>
            <div class="b-row"><span>Sentiment Conviction</span> <strong class="green">${a.sentiment} / 100</strong></div>
            <div class="b-row"><span>Return on Capital (ROCE)</span> <strong>${a.roce}</strong></div>
            <div class="b-row"><span>14-Day Daily RSI</span> <strong>${a.rsi}</strong></div>
            <div class="b-row"><span>Valuation Multiple (P/E)</span> <strong>${a.pe}</strong></div>
            <div class="b-row"><span>Daily Market Bias</span> <span class="${a.bias === 'Bull' ? 'bull-tag' : 'bear-tag'}">${a.bias}</span></div>
          </div>
        </div>

        <!-- VS Divider -->
        <div class="battle-vs-badge">
          VS
        </div>

        <!-- Stock B Column -->
        <div class="battle-column ${data.winner === b.symbol ? 'is-winner' : ''}">
          <div class="battle-stock-top">
            <h3>${b.symbol}</h3>
            <span class="battle-stock-name">${b.name}</span>
            <div class="battle-price">₹${b.price} <span class="${b.change.includes('-') ? 'down' : 'up'}">${b.change}</span></div>
          </div>
          
          <div class="battle-metrics-table">
            <div class="b-row"><span>Multi-Agent Rating</span> <strong>${b.rating}</strong></div>
            <div class="b-row"><span>Sentiment Conviction</span> <strong class="green">${b.sentiment} / 100</strong></div>
            <div class="b-row"><span>Return on Capital (ROCE)</span> <strong>${b.roce}</strong></div>
            <div class="b-row"><span>14-Day Daily RSI</span> <strong>${b.rsi}</strong></div>
            <div class="b-row"><span>Valuation Multiple (P/E)</span> <strong>${b.pe}</strong></div>
            <div class="b-row"><span>Daily Market Bias</span> <span class="${b.bias === 'Bull' ? 'bull-tag' : 'bear-tag'}">${b.bias}</span></div>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  }
}

window.StockComparisonHub = StockComparisonHub;
