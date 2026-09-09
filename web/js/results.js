/**
 * TRADE2OPTIONS — Our Results & Track Record, Tomorrow's Edge & Discord Dispatcher
 * Market-Hours-Aware Ledger Engine
 */

class ResultsManager {
  constructor() {
    this.ledgerData = [];
    this.todaySetups = [];
    this.pastRecords = [];
    this.summaryData = null;
    this.currentFilter = "all";
    this.initElements();
    this.bindEvents();
    this.loadResultsLedger();
    this.loadTomorrowEdge();
  }

  initElements() {
    // KPI Cards
    this.kpiWinRate = document.getElementById("kpiWinRate");
    this.kpiWinCount = document.getElementById("kpiWinCount");
    this.kpiTotalPoints = document.getElementById("kpiTotalPoints");
    this.kpiTopBull = document.getElementById("kpiTopBull");
    this.kpiTopBear = document.getElementById("kpiTopBear");
    this.resultsDateBadge = document.getElementById("resultsDateBadge");
    this.marketStatusNotice = document.getElementById("marketStatusNotice");

    // Filter Buttons
    this.filterBtns = document.querySelectorAll(".ledger-filter-btn");
    this.ledgerTableBody = document.getElementById("resultsLedgerBody");

    // Tomorrow's Edge Elements
    this.tomorrowDateBadge = document.getElementById("tomorrowDateBadge");
    this.macroCuesContainer = document.getElementById("tomorrowMacroCues");
    this.bigMoneyGrid = document.getElementById("tomorrowBigMoneyGrid");
    this.watchlistGrid = document.getElementById("tomorrowWatchlistGrid");

    // Discord Broadcast Elements
    this.btnBroadcastEod = document.getElementById("btnBroadcastEodDiscord");
    this.btnBroadcastTomorrow = document.getElementById("btnBroadcastTomorrowDiscord");
    this.btnBroadcastSignal = document.getElementById("btnBroadcastSignalDiscord");
    this.btnPingDiscord = document.getElementById("btnPingDiscord");
    this.discordToast = document.getElementById("discordToast");
  }

  bindEvents() {
    this.filterBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        this.filterBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.currentFilter = btn.dataset.filter;
        this.renderLedgerTable();
      });
    });

    if (this.btnBroadcastEod) {
      this.btnBroadcastEod.addEventListener("click", () => this.broadcastEodDiscord());
    }

    if (this.btnBroadcastTomorrow) {
      this.btnBroadcastTomorrow.addEventListener("click", () => this.broadcastTomorrowDiscord());
    }

    if (this.btnBroadcastSignal) {
      this.btnBroadcastSignal.addEventListener("click", () => this.broadcastSignalDiscord());
    }

    if (this.btnPingDiscord) {
      this.btnPingDiscord.addEventListener("click", () => this.pingDiscord());
    }
  }

  async loadResultsLedger() {
    try {
      const res = await fetch("/api/results/ledger");
      const data = await res.json();
      
      const s = data.summary;
      this.summaryData = s;

      if (this.kpiWinRate) this.kpiWinRate.textContent = s.past_win_rate;
      if (this.kpiWinCount) this.kpiWinCount.textContent = s.past_win_count;
      if (this.kpiTotalPoints) this.kpiTotalPoints.textContent = s.total_past_alpha;
      if (this.kpiTopBull) this.kpiTopBull.textContent = s.top_bull_win;
      if (this.kpiTopBear) this.kpiTopBear.textContent = s.top_bear_win;
      
      if (this.resultsDateBadge) {
        this.resultsDateBadge.textContent = s.session_status_badge;
      }

      this.todaySetups = data.today_setups || [];
      this.pastRecords = data.past_records || [];
      this.ledgerData = data.all_entries || [];

      this.renderLedgerTable();

    } catch (e) {
      console.error("Results ledger fetch error:", e);
    }
  }

  renderLedgerTable() {
    if (!this.ledgerTableBody) return;

    let itemsToRender = [];
    let isTodayOnly = false;
    let isPastOnly = false;

    if (this.currentFilter === "today") {
      itemsToRender = this.todaySetups;
      isTodayOnly = true;
    } else if (this.currentFilter === "past") {
      itemsToRender = this.pastRecords;
      isPastOnly = true;
    } else if (this.currentFilter === "wins") {
      itemsToRender = this.pastRecords.filter(e => e.status_code === "win");
    } else {
      itemsToRender = this.ledgerData;
    }

    this.ledgerTableBody.innerHTML = itemsToRender.map(row => {
      const isPending = row.status_code === "pending";
      const isWin = row.status_code === "win";
      const isShort = row.signal.includes("SELL") || row.signal.includes("FADE");

      return `
        <tr class="ledger-row ${isPending ? 'row-pending' : (isWin ? 'row-win' : '')}">
          <td>
            <div class="ledger-date">${row.date}</div>
            <span class="ledger-session-tag ${isPending ? 'tag-pending' : 'tag-closed'}">${row.session_type}</span>
          </td>
          <td>
            <div class="ledger-stock-wrap">
              <strong class="ledger-sym">${row.symbol}</strong>
              <span class="ledger-name">${row.name}</span>
            </div>
            <div class="ledger-sector">${row.sector}</div>
          </td>
          <td>
            <span class="signal-tag ${isShort ? 'signal-sell' : 'signal-buy'}">
              ${row.signal}
            </span>
          </td>
          <td class="num-cell">₹${row.trigger_price.toFixed(2)}</td>
          <td class="num-cell highlight-cell">₹${row.live_price.toFixed(2)}</td>
          <td class="num-cell ${isPending ? 'dim' : (isWin ? 'green' : 'red')}">
            ${isPending ? '<span style="color:#94a3b8; font-size:0.75rem;">₹0.00 (Awaiting Open)</span>' : `<strong>${row.move_inr >= 0 ? '+₹' : '-₹'}${Math.abs(row.move_inr).toFixed(2)}</strong><div class="pct-pill ${isWin ? 'up' : 'down'}">${row.move_pct}</div>`}
          </td>
          <td>
            <span class="outcome-badge ${isPending ? 'outcome-pending-bell' : (isWin ? 'outcome-win' : 'outcome-pending')}">
              ${row.status}
            </span>
          </td>
          <td class="catalyst-col">
            <span class="catalyst-text">${row.catalyst}</span>
          </td>
        </tr>
      `;
    }).join("");
  }

  async loadTomorrowEdge() {
    try {
      const res = await fetch("/api/results/tomorrow-edge");
      const data = await res.json();

      if (this.tomorrowDateBadge) {
        this.tomorrowDateBadge.textContent = `TARGET SESSION: ${data.date_for.toUpperCase()}`;
      }

      if (this.macroCuesContainer && data.macro_cues) {
        this.macroCuesContainer.innerHTML = data.macro_cues.map(c => `
          <div class="macro-cue-item">
            <div class="cue-header">
              <span class="cue-title">${c.title}</span>
              <span class="cue-impact ${c.impact.toLowerCase()}">${c.impact}</span>
            </div>
            <p class="cue-desc">${c.desc}</p>
          </div>
        `).join("");
      }

      if (this.bigMoneyGrid && data.big_money_inflows) {
        this.bigMoneyGrid.innerHTML = data.big_money_inflows.map(b => `
          <div class="big-money-card">
            <div class="bm-header">
              <div>
                <span class="bm-sym">${b.symbol}</span>
                <span class="bm-sector">(${b.sector})</span>
              </div>
              <span class="bm-bias">${b.bias}</span>
            </div>
            <p class="bm-details">${b.flow_details}</p>
            <div class="bm-targets-row scenario-row" style="display:flex; flex-direction:column; gap:4px; font-size:0.75rem;">
              <div><span style="color:#94a3b8;">Growth Scenario:</span> <strong class="green">${b.scenario || 'Institutional Inflow'}</strong></div>
              <div><span style="color:#94a3b8;">Invalidation Trigger:</span> <strong class="red">${b.invalidation || 'Volume Breakdown'}</strong></div>
            </div>
          </div>
        `).join("");
      }

      if (this.watchlistGrid && data.tomorrow_watchlist) {
        this.watchlistGrid.innerHTML = data.tomorrow_watchlist.map(w => `
          <div class="watchlist-card">
            <div class="wl-top">
              <span class="wl-stock">${w.stock}</span>
              <span class="wl-action">${w.action}</span>
            </div>
            <div class="wl-trigger">Condition: ${w.trigger_condition}</div>
            <div class="wl-levels scenario-row" style="display:flex; flex-direction:column; gap:4px; font-size:0.75rem;">
              <div><span style="color:#94a3b8;">Scenario:</span> <strong class="green">${w.scenario || 'Continuation Setup'}</strong></div>
              <div><span style="color:#94a3b8;">Invalidation:</span> <strong class="red">${w.invalidation || 'Supply Surge'}</strong></div>
            </div>
          </div>
        `).join("");
      }

      if (window.lucide) lucide.createIcons();

    } catch (e) {
      console.error("Tomorrow edge fetch error:", e);
    }
  }

  async broadcastEodDiscord() {
    try {
      this.btnBroadcastEod.disabled = true;
      this.btnBroadcastEod.innerHTML = '<i data-lucide="loader"></i> Dispatching Ledger...';
      if (window.lucide) lucide.createIcons();

      const res = await fetch("/api/discord/broadcast-eod", { method: "POST" });
      const data = await res.json();
      this.showToast("✅ Verified Historical Performance Ledger broadcasted to Discord!");

    } catch (e) {
      this.showToast("❌ Discord broadcast error", true);
    } finally {
      this.btnBroadcastEod.disabled = false;
      this.btnBroadcastEod.innerHTML = '<i data-lucide="send"></i> Broadcast Performance Ledger to Discord';
      if (window.lucide) lucide.createIcons();
    }
  }

  async broadcastTomorrowDiscord() {
    try {
      this.btnBroadcastTomorrow.disabled = true;
      this.btnBroadcastTomorrow.innerHTML = '<i data-lucide="loader"></i> Sending Catalysts...';
      if (window.lucide) lucide.createIcons();

      const res = await fetch("/api/discord/broadcast-tomorrow", { method: "POST" });
      const data = await res.json();
      this.showToast("✅ Pre-Market 09:15 AM Watchlist sent to Discord!");

    } catch (e) {
      this.showToast("❌ Discord broadcast error", true);
    } finally {
      this.btnBroadcastTomorrow.disabled = false;
      this.btnBroadcastTomorrow.innerHTML = '<i data-lucide="sparkles"></i> Broadcast Pre-Market Watchlist';
      if (window.lucide) lucide.createIcons();
    }
  }

  async broadcastSignalDiscord() {
    try {
      this.btnBroadcastSignal.disabled = true;
      this.btnBroadcastSignal.innerHTML = '<i data-lucide="loader"></i> Broadcasting...';
      if (window.lucide) lucide.createIcons();

      const res = await fetch("/api/discord/broadcast-signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: "TCS", signal_type: "STRONG BUY" })
      });
      const data = await res.json();
      this.showToast(`🚨 Pre-Market Setup for ${data.symbol} (₹${data.live_price}) sent to Discord!`);

    } catch (e) {
      this.showToast("❌ Signal broadcast error", true);
    } finally {
      this.btnBroadcastSignal.disabled = false;
      this.btnBroadcastSignal.innerHTML = '<i data-lucide="bell-ring"></i> Broadcast Signal Alert (TCS)';
      if (window.lucide) lucide.createIcons();
    }
  }

  async pingDiscord() {
    try {
      this.btnPingDiscord.disabled = true;
      this.btnPingDiscord.innerHTML = '<i data-lucide="loader"></i> Pinging...';
      if (window.lucide) lucide.createIcons();

      const res = await fetch("/api/discord/broadcast-signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: "GROWW", signal_type: "STRONG SELL", custom_message: "🧪 Discord Webhook Connection Verified & Active!" })
      });
      this.showToast("📡 Ping test received on Discord channel!");

    } catch (e) {
      this.showToast("❌ Ping failed", true);
    } finally {
      this.btnPingDiscord.disabled = false;
      this.btnPingDiscord.innerHTML = '<i data-lucide="radio"></i> Ping Webhook Test';
      if (window.lucide) lucide.createIcons();
    }
  }

  showToast(message, isError = false) {
    if (!this.discordToast) return;
    this.discordToast.textContent = message;
    this.discordToast.className = `discord-toast ${isError ? 'toast-error' : 'toast-success'} show`;
    setTimeout(() => {
      this.discordToast.classList.remove("show");
    }, 3800);
  }
}

window.ResultsManager = ResultsManager;
