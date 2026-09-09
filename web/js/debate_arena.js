/**
 * TRADE2OPTIONS — Option B Animated Adversarial AI Debate Arena Engine
 * Powered by TradingView Live Scanner + Motion (WAAPI & Spring Physics)
 */

class DebateArena {
  constructor() {
    this.currentRound = 0;
    this.roundsData = [];
    this.finalVerdict = null;
    this.stockProfile = null;
    this.isPlaying = false;
    this.autoPlayTimer = null;
    this.ticker = "GROWW";
    this.searchDebounceTimer = null;
    this.currentGaugePct = 72;
    this.GAUGE_CIRCUMFERENCE = 2 * Math.PI * 68; // ~427.26

    this.initElements();
    this.bindEvents();

    // Initial load with default stock
    setTimeout(() => this.fetchAndStartDuel(), 300);
  }

  initElements() {
    // Search elements in Arena
    this.searchInput = document.getElementById("arenaStockSearch");
    this.dropdown = document.getElementById("arenaSuggestionsDropdown");
    this.popularChips = document.querySelectorAll(".arena-chip");

    // Controls
    this.btnStartDuel = document.getElementById("startDebateDuelBtn");
    this.btnPrevRound = document.getElementById("prevRoundBtn");
    this.btnNextRound = document.getElementById("nextRoundBtn");
    this.btnPlayPause = document.getElementById("playPauseDuelBtn");

    // Live Ticker Banner
    this.arenaLiveSym = document.getElementById("arenaLiveSym");
    this.arenaLiveExch = document.getElementById("arenaLiveExch");
    this.arenaLiveName = document.getElementById("arenaLiveName");
    this.arenaLiveSector = document.getElementById("arenaLiveSector");
    this.arenaLivePrice = document.getElementById("arenaLivePrice");
    this.arenaLiveChange = document.getElementById("arenaLiveChange");
    this.arenaLiveRsi = document.getElementById("arenaLiveRsi");
    this.arenaLivePe = document.getElementById("arenaLivePe");

    // Agent Cards
    this.cardBullAgent = document.getElementById("cardBullAgent");
    this.cardBearAgent = document.getElementById("cardBearAgent");
    this.bullScoreBadge = document.getElementById("bullScoreBadge");
    this.bearScoreBadge = document.getElementById("bearScoreBadge");
    this.bullThesisList = document.getElementById("bullThesisList");
    this.bearThesisList = document.getElementById("bearThesisList");
    this.bullSpeechText = document.getElementById("bullSpeechText");
    this.bearSpeechText = document.getElementById("bearSpeechText");

    // Consensus Dial & Tug Bar
    this.consensusGaugeCircle = document.getElementById("consensusGaugeCircle");
    this.arenaGaugePct = document.getElementById("arenaGaugePct");
    this.arenaGaugeLabel = document.getElementById("arenaGaugeLabel");
    this.bullPctText = document.getElementById("bullPctText");
    this.bearPctText = document.getElementById("bearPctText");
    this.tugBarFill = document.getElementById("tugBarFill");

    // Round Pills
    this.roundPills = [
      document.getElementById("pillRound1"),
      document.getElementById("pillRound2"),
      document.getElementById("pillRound3"),
      document.getElementById("pillVerdict")
    ];

    // Decision Panel & Blueprint
    this.decisionCard = document.getElementById("arenaDecisionCard");
    this.managerSummary = document.getElementById("arenaManagerSummary");
    this.actionBadge = document.getElementById("arenaActionBadge");
    this.bpBullScenario = document.getElementById("bpBullScenario");
    this.bpBearScenario = document.getElementById("bpBearScenario");
    this.bpCatalyst = document.getElementById("bpCatalyst");
    this.bpVolumeProfile = document.getElementById("bpVolumeProfile");
  }

  bindEvents() {
    // Search input typing with debounce autocomplete
    if (this.searchInput) {
      this.searchInput.addEventListener("input", (e) => {
        clearTimeout(this.searchDebounceTimer);
        const query = e.target.value.trim();
        if (query.length === 0) {
          if (this.dropdown) this.dropdown.classList.remove("show");
          return;
        }
        this.searchDebounceTimer = setTimeout(() => this.fetchSearchSuggestions(query), 200);
      });

      this.searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (this.dropdown) this.dropdown.classList.remove("show");
          this.ticker = this.searchInput.value.trim().toUpperCase() || "GROWW";
          this.fetchAndStartDuel();
        }
      });
    }

    // Quick Select Chips
    this.popularChips.forEach(chip => {
      chip.addEventListener("click", () => {
        this.popularChips.forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        const sym = chip.dataset.symbol;
        if (this.searchInput) this.searchInput.value = sym;
        this.ticker = sym;
        this.fetchAndStartDuel();
      });
    });

    // Close dropdown on outside click
    document.addEventListener("click", (e) => {
      if (this.dropdown && !e.target.closest("#arenaSearchWrapper")) {
        this.dropdown.classList.remove("show");
      }
    });

    if (this.btnStartDuel) {
      this.btnStartDuel.addEventListener("click", () => {
        if (this.searchInput && this.searchInput.value.trim()) {
          this.ticker = this.searchInput.value.trim().toUpperCase();
        }
        this.fetchAndStartDuel();
      });
    }

    if (this.btnNextRound) {
      this.btnNextRound.addEventListener("click", () => this.nextRound());
    }

    if (this.btnPrevRound) {
      this.btnPrevRound.addEventListener("click", () => this.prevRound());
    }

    if (this.btnPlayPause) {
      this.btnPlayPause.addEventListener("click", () => this.toggleAutoPlay());
    }

    // Direct Round Pill Navigation
    this.roundPills.forEach((pill, idx) => {
      if (pill) {
        pill.addEventListener("click", () => {
          if (idx === 3) {
            this.renderVerdict();
          } else {
            this.currentRound = idx;
            this.renderRound(idx);
          }
        });
      }
    });
  }

  async fetchSearchSuggestions(query) {
    if (!this.dropdown) return;
    try {
      const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      const results = data.results || [];

      if (results.length === 0) {
        this.dropdown.innerHTML = `<div style="padding:12px; color:#94a3b8; font-size:0.8rem;">No Indian stock found for "${query}"</div>`;
        this.dropdown.classList.add("show");
        return;
      }

      this.dropdown.innerHTML = results.map(s => {
        const isDown = (s.change || "").includes("-");
        return `
          <div class="suggestion-item" data-sym="${s.symbol}">
            <div>
              <span class="sugg-sym">${s.symbol}</span>
              <span class="sugg-name">${s.name && s.name.length > 25 ? s.name.substring(0, 22) + '...' : (s.name || s.symbol)}</span>
              <div class="sugg-sector">${s.sector || 'Indian Equities'}</div>
            </div>
            <div style="text-align: right;">
              <div class="sugg-price">₹${s.price || 0.0}</div>
              <div style="font-size:0.7rem; font-weight:700; color:${isDown ? '#ef4444' : '#10b981'}">${s.change || '+0.00%'}</div>
            </div>
          </div>
        `;
      }).join("");

      this.dropdown.classList.add("show");

      this.dropdown.querySelectorAll(".suggestion-item").forEach(item => {
        item.addEventListener("click", () => {
          const sym = item.dataset.sym;
          if (this.searchInput) this.searchInput.value = sym;
          this.ticker = sym;
          this.dropdown.classList.remove("show");
          this.fetchAndStartDuel();
        });
      });

    } catch (e) {
      console.warn("Search suggestion error in arena:", e);
    }
  }

  async fetchAndStartDuel() {
    try {
      if (this.btnStartDuel) {
        this.btnStartDuel.disabled = true;
        this.btnStartDuel.innerHTML = '<i data-lucide="loader"></i> Simulating Debate...';
        if (window.lucide) lucide.createIcons();
      }

      const res = await fetch("/api/debate/duel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: this.ticker, rounds: 3 })
      });

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);

      const data = await res.json();
      this.roundsData = data.rounds || [];
      this.finalVerdict = data.final_verdict || {};
      this.stockProfile = data.profile || {};

      this.updateTickerBanner(this.stockProfile);
      this.currentRound = 0;
      this.renderRound(0);

      // Trigger Motion entrance animation if Motion is available
      this.animateEntrance();

    } catch (err) {
      console.error("Debate duel fetch error:", err);
    } finally {
      if (this.btnStartDuel) {
        this.btnStartDuel.disabled = false;
        this.btnStartDuel.innerHTML = '<i data-lucide="swords"></i> Simulate Debate Duel';
        if (window.lucide) lucide.createIcons();
      }
    }
  }

  updateTickerBanner(profile) {
    if (!profile) return;
    const sym = profile.symbol || this.ticker;
    const isDown = (profile.change || "").includes("-");

    if (this.arenaLiveSym) this.arenaLiveSym.textContent = sym;
    if (this.arenaLiveExch) this.arenaLiveExch.textContent = (profile.ticker || "NSE").split(":")[0];
    if (this.arenaLiveName) this.arenaLiveName.textContent = profile.name || `${sym} Limited`;
    if (this.arenaLiveSector) this.arenaLiveSector.textContent = profile.sector || "Indian Equities";
    
    if (this.arenaLivePrice) {
      this.arenaLivePrice.textContent = `₹${(profile.price || 0.0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
      this.arenaLivePrice.className = `m-val ${isDown ? 'red' : 'green'}`;
    }
    if (this.arenaLiveChange) {
      this.arenaLiveChange.textContent = profile.change || "+0.00%";
      this.arenaLiveChange.className = `m-val ${isDown ? 'red' : 'green'}`;
    }
    if (this.arenaLiveRsi) this.arenaLiveRsi.textContent = profile.rsi ? profile.rsi.toFixed(1) : "52.0";
    if (this.arenaLivePe) this.arenaLivePe.textContent = profile.pe ? profile.pe.toFixed(1) : "22.5";
  }

  renderRound(index) {
    if (!this.roundsData || this.roundsData.length === 0) return;

    if (index >= this.roundsData.length) {
      this.renderVerdict();
      return;
    }

    const round = this.roundsData[index];

    // Update Round Pills
    this.roundPills.forEach((p, i) => {
      if (p) p.classList.toggle("active", i === index);
    });

    // Bull Card Updates
    if (this.bullScoreBadge) this.bullScoreBadge.textContent = `${round.bull_score} / 10`;
    if (this.bullThesisList && round.bull_points) {
      this.bullThesisList.innerHTML = round.bull_points.map(pt => `<li>${pt}</li>`).join("");
    }
    this.animateSpeech(this.bullSpeechText, round.bull_statement);

    // Bear Card Updates
    if (this.bearScoreBadge) this.bearScoreBadge.textContent = `${round.bear_score} / 10`;
    if (this.bearThesisList && round.bear_points) {
      this.bearThesisList.innerHTML = round.bear_points.map(pt => `<li>${pt}</li>`).join("");
    }
    this.animateSpeech(this.bearSpeechText, round.bear_statement);

    // Consensus Gauge & Tug Bar Updates
    const conv = round.conviction_meter || 70;
    this.animateConsensusDial(conv);

    if (this.tugBarFill) this.tugBarFill.style.width = `${conv}%`;
    if (this.bullPctText) this.bullPctText.textContent = `${conv}% BULL`;
    if (this.bearPctText) this.bearPctText.textContent = `${100 - conv}% BEAR`;

    // Populate Blueprint preview even during rounds
    this.updateBlueprintData();
  }

  animateSpeech(el, text) {
    if (!el) return;
    if (window.Motion && typeof Motion.animate === "function") {
      Motion.animate(el, { opacity: [0.3, 1], y: [6, 0] }, { duration: 0.35, ease: "easeOut" });
    } else {
      el.style.opacity = "0.3";
      el.style.transform = "translateY(6px)";
      setTimeout(() => {
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
      }, 100);
    }
    el.textContent = text;
  }

  animateConsensusDial(targetPct) {
    const startPct = this.currentGaugePct || 50;
    this.currentGaugePct = targetPct;

    // Calculate SVG stroke-dashoffset
    // Total circumference = ~427.26
    const targetOffset = this.GAUGE_CIRCUMFERENCE * (1 - (targetPct / 100));

    if (this.consensusGaugeCircle) {
      this.consensusGaugeCircle.style.strokeDashoffset = targetOffset;
      // Change color based on score
      if (targetPct >= 65) {
        this.consensusGaugeCircle.style.stroke = "#10b981"; // Emerald
      } else if (targetPct <= 45) {
        this.consensusGaugeCircle.style.stroke = "#ef4444"; // Ruby
      } else {
        this.consensusGaugeCircle.style.stroke = "#f59e0b"; // Amber
      }
    }

    // Number count-up animation
    const duration = 600;
    const startTime = performance.now();
    const animateCount = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // cubic ease out
      const currentVal = Math.round(startPct + (targetPct - startPct) * easeProgress);

      if (this.arenaGaugePct) {
        this.arenaGaugePct.textContent = `${currentVal}%`;
      }

      if (progress < 1) {
        requestAnimationFrame(animateCount);
      } else {
        if (this.arenaGaugePct) this.arenaGaugePct.textContent = `${targetPct}%`;
      }
    };
    requestAnimationFrame(animateCount);

    if (this.arenaGaugeLabel) {
      if (targetPct >= 75) {
        this.arenaGaugeLabel.textContent = "STRONG BUY";
        this.arenaGaugeLabel.style.color = "#10b981";
      } else if (targetPct >= 60) {
        this.arenaGaugeLabel.textContent = "BULLISH";
        this.arenaGaugeLabel.style.color = "#10b981";
      } else if (targetPct <= 40) {
        this.arenaGaugeLabel.textContent = "BEARISH / SHORT";
        this.arenaGaugeLabel.style.color = "#ef4444";
      } else {
        this.arenaGaugeLabel.textContent = "NEUTRAL / HOLD";
        this.arenaGaugeLabel.style.color = "#f59e0b";
      }
    }
  }

  updateBlueprintData() {
    if (!this.finalVerdict) return;
    const bp = this.finalVerdict.blueprint || {};

    if (this.managerSummary && this.finalVerdict.manager_summary) {
      this.managerSummary.textContent = this.finalVerdict.manager_summary;
    }
    if (this.actionBadge) {
      this.actionBadge.textContent = this.finalVerdict.action_badge || "ACCUMULATE ON PULLBACKS";
      if ((this.finalVerdict.action_badge || "").includes("AVOID") || (this.finalVerdict.action_badge || "").includes("SHORT")) {
        this.actionBadge.style.background = "linear-gradient(135deg, #ef4444, #b91c1c)";
      } else {
        this.actionBadge.style.background = "linear-gradient(135deg, #10b981, #059669)";
      }
    }

    if (this.bpBullScenario) {
      this.bpBullScenario.textContent = bp.bull_scenario || "Sustained institutional volume accumulation and sector margin resilience.";
    }
    if (this.bpBearScenario) {
      this.bpBearScenario.textContent = bp.bear_scenario || "Valuation multiple compression or breakdown in delivery volume below 20-day median.";
    }
    if (this.bpCatalyst) {
      this.bpCatalyst.textContent = bp.catalyst || "Institutional flow absorption supported by domestic liquidity.";
    }
    if (this.bpVolumeProfile) {
      this.bpVolumeProfile.textContent = bp.volume_profile || `RSI ${bp.rsi || 50} • Normal Institutional Flow`;
    }

    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  }

  renderVerdict() {
    this.currentRound = this.roundsData.length;

    // Highlight Verdict Pill
    this.roundPills.forEach((p, i) => {
      if (p) p.classList.toggle("active", i === 3);
    });

    if (!this.finalVerdict) return;

    const conv = this.finalVerdict.final_conviction || 78;
    this.animateConsensusDial(conv);

    if (this.bullSpeechText) {
      this.bullSpeechText.textContent = `Verdict Conviction: ${this.finalVerdict.score_breakdown ? this.finalVerdict.score_breakdown.bull_total : 27.5} points awarded for growth and institutional volume.`;
    }
    if (this.bearSpeechText) {
      this.bearSpeechText.textContent = `Downside Conviction: ${this.finalVerdict.score_breakdown ? this.finalVerdict.score_breakdown.bear_total : 24.0} points noted for supply resistance and strict risk protection.`;
    }

    this.updateBlueprintData();

    // Pulse animation on decision card
    if (window.Motion && typeof Motion.animate === "function" && this.decisionCard) {
      Motion.animate(this.decisionCard, { scale: [0.98, 1], opacity: [0.8, 1] }, { duration: 0.4, ease: "easeOut" });
    }

    if (this.isPlaying) {
      this.stopAutoPlay();
    }
  }

  animateEntrance() {
    if (window.Motion && typeof Motion.animate === "function") {
      if (this.cardBullAgent) {
        Motion.animate(this.cardBullAgent, { opacity: [0, 1], x: [-20, 0] }, { duration: 0.5, ease: "easeOut" });
      }
      if (this.cardBearAgent) {
        Motion.animate(this.cardBearAgent, { opacity: [0, 1], x: [20, 0] }, { duration: 0.5, ease: "easeOut" });
      }
      if (this.decisionCard) {
        Motion.animate(this.decisionCard, { opacity: [0, 1], y: [15, 0] }, { duration: 0.55, ease: "easeOut", delay: 0.15 });
      }
    }
  }

  nextRound() {
    if (this.currentRound < this.roundsData.length) {
      this.currentRound++;
      this.renderRound(this.currentRound);
    }
  }

  prevRound() {
    if (this.currentRound > 0) {
      this.currentRound--;
      this.renderRound(this.currentRound);
    }
  }

  toggleAutoPlay() {
    if (this.isPlaying) {
      this.stopAutoPlay();
    } else {
      this.startAutoPlay();
    }
  }

  startAutoPlay() {
    this.isPlaying = true;
    if (this.btnPlayPause) {
      this.btnPlayPause.innerHTML = '<i data-lucide="pause"></i> Pause';
      if (window.lucide) lucide.createIcons();
    }

    if (this.currentRound >= this.roundsData.length) {
      this.currentRound = 0;
      this.renderRound(0);
    }

    this.autoPlayTimer = setInterval(() => {
      if (this.currentRound < this.roundsData.length) {
        this.nextRound();
      } else {
        this.stopAutoPlay();
      }
    }, 4500);
  }

  stopAutoPlay() {
    this.isPlaying = false;
    clearInterval(this.autoPlayTimer);
    if (this.btnPlayPause) {
      this.btnPlayPause.innerHTML = '<i data-lucide="play"></i> Auto Play';
      if (window.lucide) lucide.createIcons();
    }
  }
}

window.DebateArena = DebateArena;
