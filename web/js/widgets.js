/**
 * TRADE2OPTIONS — Interactive Indian Market Widgets & LMS Suite Logic
 * Universal Search & Live CMP Integration
 */

class WidgetsManager {
  constructor() {
    this.gradeSearchTimer = null;
    this.initElements();
    this.bindEvents();
    this.loadWidgetsData();
  }

  initElements() {
    this.macroList = document.getElementById("macroIndicatorsList");
    this.polyList = document.getElementById("polyMarketsList");

    this.sentScore = document.getElementById("widgetSentScore");
    this.sentLabel = document.getElementById("widgetSentLabel");
    this.stVal = document.getElementById("widgetSTVal");
    this.redditVal = document.getElementById("widgetRedditVal");
    this.newsVal = document.getElementById("widgetNewsVal");

    // LMS Grader elements
    this.gradeTicker = document.getElementById("gradeTicker");
    this.gradeDropdown = document.getElementById("gradeSuggestionsDropdown");
    this.gradeEntry = document.getElementById("gradeEntry");
    this.gradeStop = document.getElementById("gradeStop");
    this.gradeTarget = document.getElementById("gradeTarget");
    this.gradeThesis = document.getElementById("gradeThesis");
    this.btnSubmitGrade = document.getElementById("submitGradeTradeBtn");

    this.gradeCircle = document.getElementById("gradeDisplayCircle");
    this.gradeTitle = document.getElementById("gradeTitle");
    this.gradeRR = document.getElementById("gradeRR");
    this.committeeCritiques = document.getElementById("committeeCritiques");

    // Embed Modal elements
    this.embedModal = document.getElementById("embedModal");
    this.closeModalBtn = document.getElementById("closeEmbedModalBtn");
    this.embedCodeSnippet = document.getElementById("embedCodeSnippet");
    this.copyEmbedBtn = document.getElementById("copyEmbedCodeBtn");
  }

  bindEvents() {
    // Autocomplete on Grade Ticker
    if (this.gradeTicker) {
      this.gradeTicker.addEventListener("input", (e) => {
        clearTimeout(this.gradeSearchTimer);
        const q = e.target.value.trim();
        if (!q) {
          if (this.gradeDropdown) this.gradeDropdown.classList.remove("show");
          return;
        }
        this.gradeSearchTimer = setTimeout(() => this.fetchGradeSuggestions(q), 200);
      });

      this.gradeTicker.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (this.gradeDropdown) this.gradeDropdown.classList.remove("show");
          this.gradeTrade();
        }
      });
    }

    document.addEventListener("click", (e) => {
      if (this.gradeDropdown && !e.target.closest("#gradeTickerWrap")) {
        this.gradeDropdown.classList.remove("show");
      }
    });

    if (this.btnSubmitGrade) {
      this.btnSubmitGrade.addEventListener("click", () => this.gradeTrade());
    }

    document.querySelectorAll(".embed-code-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const widgetType = e.currentTarget.dataset.widget;
        this.openEmbedModal(widgetType);
      });
    });

    if (this.closeModalBtn) {
      this.closeModalBtn.addEventListener("click", () => {
        this.embedModal.classList.remove("active");
      });
    }

    if (this.copyEmbedBtn) {
      this.copyEmbedBtn.addEventListener("click", () => {
        if (this.embedCodeSnippet) {
          navigator.clipboard.writeText(this.embedCodeSnippet.value);
          this.copyEmbedBtn.innerHTML = '<i data-lucide="check"></i> Copied to Clipboard!';
          if (window.lucide) lucide.createIcons();
          setTimeout(() => {
            this.copyEmbedBtn.innerHTML = '<i data-lucide="clipboard-check"></i> Copy Embed Code';
            if (window.lucide) lucide.createIcons();
          }, 2000);
        }
      });
    }
  }

  async fetchGradeSuggestions(query) {
    if (!this.gradeDropdown) return;
    try {
      const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      const results = data.results || [];

      if (results.length === 0) {
        this.gradeDropdown.innerHTML = `<div style="padding:10px; color:#94a3b8; font-size:0.75rem;">No stock found</div>`;
        this.gradeDropdown.classList.add("show");
        return;
      }

      this.gradeDropdown.innerHTML = results.map(s => `
        <div class="suggestion-item" data-sym="${s.symbol}" data-price="${s.price || 100}">
          <div>
            <span class="sugg-sym">${s.symbol}</span>
            <span class="sugg-name">${s.name && s.name.length > 20 ? s.name.substring(0, 18) + '...' : (s.name || s.symbol)}</span>
          </div>
          <div style="text-align: right;">
            <div class="sugg-price">₹${s.price || 0.0}</div>
          </div>
        </div>
      `).join("");

      this.gradeDropdown.classList.add("show");

      this.gradeDropdown.querySelectorAll(".suggestion-item").forEach(item => {
        item.addEventListener("click", () => {
          const sym = item.dataset.sym;
          const p = parseFloat(item.dataset.price) || 100;
          if (this.gradeTicker) this.gradeTicker.value = sym;
          if (this.gradeEntry) this.gradeEntry.value = p.toFixed(2);
          if (this.gradeStop) this.gradeStop.value = (p * 0.96).toFixed(2);
          if (this.gradeTarget) this.gradeTarget.value = (p * 1.08).toFixed(2);
          this.gradeDropdown.classList.remove("show");
        });
      });

    } catch (e) {
      console.warn("Grade search suggestion error:", e);
    }
  }

  async loadWidgetsData() {
    // 1. Load Live Sentiment Radar Data
    try {
      const res = await fetch("/api/widgets/sentiment?ticker=RELIANCE");
      const data = await res.json();
      if (this.sentScore) this.sentScore.textContent = data.overall_score || 86;
      if (this.sentLabel) this.sentLabel.textContent = (data.sentiment_label || "BULLISH").toUpperCase();
      if (this.stVal && data.sources) {
        this.stVal.textContent = `${data.sources.dalal_street_retail.bullish_percentage}% Bullish (${data.sources.dalal_street_retail.volume})`;
      }
      if (this.redditVal && data.sources) {
        this.redditVal.textContent = `ROCE: ${data.sources.institutional_fii_dii.roce} • ${data.sources.institutional_fii_dii.flow_status}`;
      }
      if (this.newsVal && data.sources) {
        this.newsVal.textContent = `${data.sources.brokerage_consensus.buy_percentage}% Buy / Accumulate`;
      }
    } catch (e) {
      console.warn("Sentiment widget fetch err:", e);
    }

    // 2. Load Indian Macro & FII/DII Indicators
    try {
      const res = await fetch("/api/widgets/macro");
      const data = await res.json();
      if (this.macroList && data.indicators) {
        this.macroList.innerHTML = data.indicators.map(ind => `
          <div class="macro-item">
            <span>${ind.name}</span>
            <span class="val" style="color:#06b6d4;">${ind.value}</span>
          </div>
        `).join("");
      }
    } catch (e) {
      console.warn("Macro widget fetch err:", e);
    }

    // 3. Load Nifty/BankNifty Option Chain PCR
    try {
      const res = await fetch("/api/widgets/pcr");
      const data = await res.json();
      if (this.polyList && data.indices) {
        this.polyList.innerHTML = data.indices.map(idx => `
          <div class="poly-item">
            <div>
              <strong>${idx.name}</strong> <span style="color:#94a3b8; font-size:0.75rem;">(Spot: ${idx.spot})</span>
            </div>
            <div style="text-align:right;">
              <span class="prob" style="color:${(idx.change || '').includes('-') ? '#ef4444' : '#10b981'}; font-weight:700;">PCR ${idx.pcr} (${idx.change || '+0.00%'})</span>
              <div style="font-size:0.68rem; color:#64748b;">Max Pain: ${idx.max_pain}</div>
            </div>
          </div>
        `).join("");
      }
    } catch (e) {
      console.warn("PCR widget fetch err:", e);
    }
  }

  async gradeTrade() {
    const payload = {
      ticker: this.gradeTicker ? this.gradeTicker.value.toUpperCase() : "TATAMOTORS.NS",
      direction: "LONG",
      entry_price: parseFloat(this.gradeEntry.value) || 985.0,
      stop_loss: parseFloat(this.gradeStop.value) || 950.0,
      take_profit: parseFloat(this.gradeTarget.value) || 1080.0,
      timeframe: "Swing (3-7 Days)",
      thesis: this.gradeThesis.value
    };

    try {
      this.btnSubmitGrade.disabled = true;
      this.btnSubmitGrade.innerHTML = '<i data-lucide="loader"></i> Evaluating Thesis...';
      if (window.lucide) lucide.createIcons();

      const res = await fetch("/api/widgets/grade-trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      
      this.gradeCircle.textContent = data.grade;
      this.gradeTitle.textContent = `Setup Grade: ${data.grade === 'A' ? 'Institutional Quality' : (data.grade === 'B' ? 'Good Setup' : 'High Risk Setup')}`;
      this.gradeRR.textContent = `Risk-to-Reward: ${data.rr_ratio} (${data.risk_dollars} Risk)`;

      if (this.committeeCritiques && data.committee_feedback) {
        this.committeeCritiques.innerHTML = data.committee_feedback.map(fb => `
          <div style="background: rgba(0,0,0,0.25); padding: 8px 12px; border-radius: 6px; margin-bottom: 6px;">
            <div style="font-weight: 700; color: #60a5fa; font-size: 0.78rem;">${fb.agent}</div>
            <div style="font-size: 0.8rem; color: #cbd5e1; margin-top: 2px;">${fb.comment}</div>
          </div>
        `).join("");
      }

    } catch (e) {
      console.error("Trade grading error:", e);
    } finally {
      this.btnSubmitGrade.disabled = false;
      this.btnSubmitGrade.innerHTML = '<i data-lucide="check-circle-2"></i> Submit Trade Setup to Committee';
      if (window.lucide) lucide.createIcons();
    }
  }

  openEmbedModal(widgetType) {
    const origin = window.location.origin;
    const embedSnippets = {
      sentiment: `<iframe src="${origin}/#view-arena" width="100%" height="450" frameborder="0" style="border-radius:12px; border:1px solid #1e293b;" title="TRADE2OPTIONS Indian Sentiment Radar"></iframe>`,
      macro: `<iframe src="${origin}/#view-arena" width="100%" height="450" frameborder="0" style="border-radius:12px; border:1px solid #1e293b;" title="TRADE2OPTIONS India Macro & FII/DII Pulse"></iframe>`,
      pcr: `<iframe src="${origin}/#view-arena" width="100%" height="450" frameborder="0" style="border-radius:12px; border:1px solid #1e293b;" title="TRADE2OPTIONS Nifty Option Chain PCR"></iframe>`,
      grader: `<iframe src="${origin}/#view-arena" width="100%" height="520" frameborder="0" style="border-radius:12px; border:1px solid #1e293b;" title="TRADE2OPTIONS Indian Trade Grader"></iframe>`
    };

    if (this.embedCodeSnippet) {
      this.embedCodeSnippet.value = embedSnippets[widgetType] || embedSnippets.sentiment;
    }

    if (this.embedModal) {
      this.embedModal.classList.add("active");
    }
  }
}

window.WidgetsManager = WidgetsManager;
