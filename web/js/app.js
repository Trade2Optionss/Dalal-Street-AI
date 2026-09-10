/**
 * TRADE2OPTIONS — Core Application Controller & Router (Indian Market Edition)
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Navigation & Router Handling
  const navTabs = document.querySelectorAll(".nav-tab");
  const pageViews = document.querySelectorAll(".page-view");
  const portalCards = document.querySelectorAll(".portal-card");
  const backToHubBtns = document.querySelectorAll(".back-to-hub-btn");
  const brandLogo = document.getElementById("navBrand");

  function switchView(targetId) {
    pageViews.forEach(view => {
      const isMatch = view.id === targetId;
      view.classList.toggle("active", isMatch);
      view.style.display = isMatch ? "block" : "none";
      if (isMatch && window.Motion && typeof Motion.animate === "function") {
        Motion.animate(view, { opacity: [0, 1], y: [10, 0] }, { duration: 0.32, ease: "easeOut" });
      }
    });

    navTabs.forEach(tab => {
      tab.classList.toggle("active", tab.dataset.target === targetId);
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  window.switchTerminalView = switchView;

  navTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.target;
      if (target) {
        switchView(target);
      }
    });
  });

  portalCards.forEach(card => {
    card.addEventListener("click", () => {
      const target = card.dataset.launch;
      switchView(target);
    });
  });

  backToHubBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      switchView("view-launchpad");
    });
  });

  if (brandLogo) {
    brandLogo.addEventListener("click", () => {
      switchView("view-launchpad");
    });
  }

  const heroExploreBtn = document.getElementById("heroExploreAllBtn");
  if (heroExploreBtn) {
    heroExploreBtn.addEventListener("click", () => {
      const grid = document.getElementById("portalCardsGrid");
      if (grid) {
        grid.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  const heroGraphBtn = document.getElementById("heroOpenGraphBtn");
  if (heroGraphBtn) {
    heroGraphBtn.addEventListener("click", () => {
      const graphBtn = document.getElementById("openObsidianGraphBtn");
      if (graphBtn) {
        graphBtn.click();
      }
    });
  }

  // 2. Initialize Sub-Modules
  const arenaEngine = new DebateArena();
  const widgetsManager = new WidgetsManager();
  const comparisonHub = new StockComparisonHub();
  const resultsManager = new ResultsManager();

  // 3. Option A: AI Institutional Research Terminal Controller
  const stockSearchInput = document.getElementById("researchStockSearch");
  const searchDropdown = document.getElementById("searchSuggestionsDropdown");
  const runResearchBtn = document.getElementById("runResearchBtn");
  const popularChips = document.querySelectorAll("#popularChipsContainer .chip");
  const downloadPdfBtn = document.getElementById("downloadPdfBtn");

  const toggleNSE = document.getElementById("toggleNSE");
  const toggleBSE = document.getElementById("toggleBSE");
  let currentExchange = "NSE";

  if (toggleNSE && toggleBSE) {
    toggleNSE.addEventListener("click", () => {
      currentExchange = "NSE";
      toggleNSE.classList.add("active");
      toggleBSE.classList.remove("active");
      const currentVal = stockSearchInput ? stockSearchInput.value.trim().toUpperCase() : "RELIANCE";
      runInstitutionalAudit(currentVal);
    });

    toggleBSE.addEventListener("click", () => {
      currentExchange = "BSE";
      toggleBSE.classList.add("active");
      toggleNSE.classList.remove("active");
      const currentVal = stockSearchInput ? stockSearchInput.value.trim().toUpperCase() : "RELIANCE";
      runInstitutionalAudit(currentVal);
    });
  }

  // Autocomplete Live Search
  let searchDebounceTimer = null;

  if (stockSearchInput && searchDropdown) {
    stockSearchInput.addEventListener("input", (e) => {
      const query = e.target.value.trim();
      clearTimeout(searchDebounceTimer);

      if (query.length < 1) {
        searchDropdown.classList.remove("show");
        return;
      }

      searchDebounceTimer = setTimeout(async () => {
        try {
          const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}`);
          const data = await res.json();
          renderSearchSuggestions(data.results || []);
        } catch (err) {
          console.error("Search fetch error:", err);
        }
      }, 180);
    });

    stockSearchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        searchDropdown.classList.remove("show");
        const query = stockSearchInput.value.trim().toUpperCase();
        if (query) runInstitutionalAudit(query);
      }
    });

    // Close dropdown on outside click
    document.addEventListener("click", (e) => {
      if (!stockSearchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
        searchDropdown.classList.remove("show");
      }
    });
  }

  function renderSearchSuggestions(results) {
    if (!searchDropdown) return;
    if (results.length === 0) {
      searchDropdown.classList.remove("show");
      return;
    }

    searchDropdown.innerHTML = results.map(s => `
      <div class="suggestion-item" data-symbol="${s.symbol}" data-nse="${s.nse}" data-bse="${s.bse}">
        <div>
          <span class="sugg-sym">${s.symbol}</span>
          <span class="sugg-name">${s.name}</span>
          <div class="sugg-sector">${s.sector}</div>
        </div>
        <div style="text-align:right;">
          <span class="sugg-price">₹${s.price}</span>
          <div class="${s.change.includes('-') ? 'down' : 'up'}" style="font-size:0.75rem; font-weight:700;">${s.change}</div>
        </div>
      </div>
    `).join("");

    searchDropdown.classList.add("show");

    // Click handler for suggestion items
    searchDropdown.querySelectorAll(".suggestion-item").forEach(item => {
      item.addEventListener("click", () => {
        const symbol = item.dataset.symbol;
        if (stockSearchInput) stockSearchInput.value = symbol;
        searchDropdown.classList.remove("show");
        runInstitutionalAudit(symbol);
      });
    });
  }

  // Agent Pipeline Nodes
  const pipelineNodes = [
    document.getElementById("node-fundamentals"),
    document.getElementById("node-technicals"),
    document.getElementById("node-sentiment"),
    document.getElementById("node-news"),
    document.getElementById("node-debate"),
    document.getElementById("node-risk"),
    document.getElementById("node-portfolio")
  ];
  const pipelineStatusText = document.getElementById("pipelineStatusText");

  // Report Tabs inside Terminal
  const reportTabs = document.querySelectorAll(".report-tab");
  const reportContents = document.querySelectorAll(".report-content-body");

  reportTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      reportTabs.forEach(t => t.classList.remove("active"));
      reportContents.forEach(c => c.classList.remove("active"));

      tab.classList.add("active");
      const targetContent = document.getElementById(tab.dataset.tab);
      if (targetContent) targetContent.classList.add("active");
    });
  });

  popularChips.forEach(chip => {
    chip.addEventListener("click", () => {
      popularChips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      const sym = chip.dataset.symbol;
      if (stockSearchInput) {
        stockSearchInput.value = sym;
        runInstitutionalAudit(sym);
      }
    });
  });

  if (runResearchBtn) {
    runResearchBtn.addEventListener("click", () => {
      const ticker = stockSearchInput ? stockSearchInput.value.trim().toUpperCase() : "RELIANCE";
      runInstitutionalAudit(ticker);
    });
  }

  async function runInstitutionalAudit(ticker) {
    if (!ticker) return;

    try {
      runResearchBtn.disabled = true;
      runResearchBtn.innerHTML = '<i data-lucide="loader"></i> Orchestrating Agents...';
      if (window.lucide) lucide.createIcons();

      // Reset and animate pipeline nodes
      pipelineStatusText.textContent = `SYNTHESIZING ${currentExchange} DATA...`;
      pipelineStatusText.style.color = "#3b82f6";
      pipelineNodes.forEach(n => {
        if (n) {
          n.className = "agent-node";
          n.querySelector(".node-state").textContent = "Queued";
        }
      });

      // Sequential animation of agents
      for (let i = 0; i < pipelineNodes.length; i++) {
        const node = pipelineNodes[i];
        if (node) {
          node.classList.add("running");
          node.querySelector(".node-state").textContent = "Reasoning...";
          await new Promise(r => setTimeout(r, 180));
          node.classList.remove("running");
          node.classList.add("completed");
          node.querySelector(".node-state").textContent = "Synthesized";
        }
      }

      // Fetch API Data
      const res = await fetch("/api/research/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: ticker, exchange: currentExchange })
      });

      const data = await res.json();
      pipelineStatusText.textContent = "INSTITUTIONAL CONSENSUS REACHED";
      pipelineStatusText.style.color = "#10b981";

      renderResearchResults(data);

    } catch (e) {
      console.error("Research audit error:", e);
      pipelineStatusText.textContent = "ERROR";
      pipelineStatusText.style.color = "#ef4444";
    } finally {
      runResearchBtn.disabled = false;
      runResearchBtn.innerHTML = '<i data-lucide="play"></i> Run Indian Audit';
      if (window.lucide) lucide.createIcons();
    }
  }

  function renderResearchResults(data) {
    const prof = data.profile;
    const reps = data.agent_reports;
    const scores = data.scorecard;

    // Sidebar Ticker Card
    document.getElementById("resTicker").textContent = `${prof.symbol} (${data.exchange})`;
    document.getElementById("resName").textContent = prof.name;
    document.getElementById("resSector").textContent = prof.sector;
    document.getElementById("resPrice").textContent = `₹${prof.price}`;
    
    const changeEl = document.getElementById("resChange");
    changeEl.textContent = prof.change;
    changeEl.className = `dossier-change ${prof.change.includes('-') ? 'down' : 'up'}`;

    document.getElementById("resRating").textContent = prof.rating.toUpperCase();
    document.getElementById("resProgressBar").style.width = `${data.consensus_score * 10}%`;
    document.getElementById("resScoreSub").textContent = `Consensus Score: ${data.consensus_score} / 10.0`;

    // Scores
    document.getElementById("scoreFund").textContent = `${scores.fundamental_health} / 100`;
    document.getElementById("scoreTech").textContent = `${scores.technical_momentum} / 100`;
    document.getElementById("scoreSent").textContent = `${scores.sentiment_score} / 100`;
    document.getElementById("scoreMacro").textContent = `${scores.macro_alignment} / 100`;

    // Reports Tabs
    document.getElementById("repExecutiveMarkdown").innerHTML = `
      <p style="margin-bottom: 12px;"><strong>Financial & PAT Trajectory:</strong> ${reps.fundamentals.split('\n')[0]}</p>
      <p style="margin-bottom: 12px;"><strong>Delivery & Technical Setup:</strong> ${reps.technicals.split('\n')[0]}</p>
      <p style="margin-bottom: 12px;"><strong>FII/DII Sentiment:</strong> ${reps.sentiment.split('\n')[0]}</p>
      <p><strong>Research Manager Verdict:</strong> ${reps.research_manager}</p>
    `;

    document.getElementById("repFundText").innerHTML = reps.fundamentals.replace(/\n/g, '<br/>');
    document.getElementById("repTechText").innerHTML = reps.technicals.replace(/\n/g, '<br/>');
    document.getElementById("repSentText").innerHTML = reps.sentiment.replace(/\n/g, '<br/>');
    document.getElementById("repNewsText").innerHTML = reps.news.replace(/\n/g, '<br/>');

    document.getElementById("repBullThesis").innerHTML = reps.bull_thesis.replace(/\n/g, '<br/>');
    document.getElementById("repBearThesis").innerHTML = reps.bear_thesis.replace(/\n/g, '<br/>');
    document.getElementById("repManagerText").innerHTML = reps.research_manager;

    document.getElementById("repTraderPlan").innerHTML = reps.trader_plan.replace(/\n/g, '<br/>');
    document.getElementById("repRiskText").innerHTML = reps.risk_committee.replace(/\n/g, '<br/>');
    document.getElementById("repPMText").innerHTML = reps.portfolio_manager.replace(/\n/g, '<br/>');
  }

  // PDF Export Trigger
  if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener("click", () => {
      const ticker = stockSearchInput ? stockSearchInput.value.trim().toUpperCase() : "RELIANCE";
      window.open(`/api/research/pdf/${ticker}`, "_blank");
    });
  }

  // 4. Option B: Market Intelligence & 20-Stock Matrix Controller
  const generateNewsletterBtn = document.getElementById("generateNewsletterBtn");
  const themeInput = document.getElementById("newsletterThemeInput");
  const tableBody = document.getElementById("newsletterTableBody");
  const mdEditor = document.getElementById("newsletterMarkdown");
  const htmlPreview = document.getElementById("newsletterHtmlPreview");
  const copyMdBtn = document.getElementById("copyMarkdownBtn");
  const copyHtmlBtn = document.getElementById("copyHtmlBtn");

  async function generateMarketWrap() {
    try {
      generateNewsletterBtn.disabled = true;
      generateNewsletterBtn.innerHTML = '<i data-lucide="loader"></i> Compiling 20-Stock Matrix...';
      if (window.lucide) lucide.createIcons();

      const theme = themeInput ? themeInput.value : "Nifty 50 Breakout & FII Institutional Inflows";
      const res = await fetch("/api/newsletter/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ focus_theme: theme })
      });

      const data = await res.json();

      if (tableBody && data.asset_summaries) {
        tableBody.innerHTML = data.asset_summaries.map(a => `
          <tr>
            <td><strong>${a.ticker}</strong></td>
            <td>${a.name} <span style="color:#64748b; font-size:0.72rem;">(${a.sector})</span></td>
            <td style="font-family:var(--font-mono); font-weight:700;">₹${a.price}</td>
            <td class="${a.change.includes('-') ? 'down' : 'up'}" style="font-weight:700; font-family:var(--font-mono);">${a.change}</td>
            <td style="color:#10b981; font-weight:700;">${a.rating}</td>
            <td><span style="background:rgba(16,185,129,0.15); color:#34d399; padding:2px 8px; border-radius:4px; font-weight:700; font-family:var(--font-mono);">${a.sentiment}/100</span></td>
            <td><span class="${a.bias === 'Bull' ? 'bull-pill' : 'bear-pill'}" style="font-size:0.75rem;">${a.bias}</span></td>
          </tr>
        `).join("");
      }

      if (mdEditor) mdEditor.value = data.markdown;
      if (htmlPreview) htmlPreview.innerHTML = data.html;

    } catch (e) {
      console.error("Newsletter generation error:", e);
    } finally {
      generateNewsletterBtn.disabled = false;
      generateNewsletterBtn.innerHTML = '<i data-lucide="sparkles"></i> Generate Dalal Street Wrap';
      if (window.lucide) lucide.createIcons();
    }
  }

  if (generateNewsletterBtn) {
    generateNewsletterBtn.addEventListener("click", generateMarketWrap);
  }

  if (copyMdBtn) {
    copyMdBtn.addEventListener("click", () => {
      if (mdEditor) {
        navigator.clipboard.writeText(mdEditor.value);
        copyMdBtn.innerHTML = '<i data-lucide="check"></i> Copied!';
        if (window.lucide) lucide.createIcons();
        setTimeout(() => {
          copyMdBtn.innerHTML = '<i data-lucide="copy"></i> Copy Markdown';
          if (window.lucide) lucide.createIcons();
        }, 2000);
      }
    });
  }

  if (copyHtmlBtn) {
    copyHtmlBtn.addEventListener("click", () => {
      if (htmlPreview) {
        navigator.clipboard.writeText(htmlPreview.innerHTML);
        copyHtmlBtn.innerHTML = '<i data-lucide="check"></i> Copied HTML!';
        if (window.lucide) lucide.createIcons();
        setTimeout(() => {
          copyHtmlBtn.innerHTML = '<i data-lucide="file-code"></i> Copy HTML';
          if (window.lucide) lucide.createIcons();
        }, 2000);
      }
    });
  }

  // 6. Obsidian Multi-Agent Graph Architecture Modal Controller
  const openObsidianGraphBtn = document.getElementById("openObsidianGraphBtn");
  const obsidianGraphModal = document.getElementById("obsidianGraphModal");
  const closeObsidianGraphModalBtn = document.getElementById("closeObsidianGraphModalBtn");

  if (openObsidianGraphBtn && obsidianGraphModal) {
    openObsidianGraphBtn.addEventListener("click", () => {
      obsidianGraphModal.classList.add("active");
    });
  }

  if (closeObsidianGraphModalBtn && obsidianGraphModal) {
    closeObsidianGraphModalBtn.addEventListener("click", () => {
      obsidianGraphModal.classList.remove("active");
    });
  }

  if (obsidianGraphModal) {
    obsidianGraphModal.addEventListener("click", (e) => {
      if (e.target === obsidianGraphModal) {
        obsidianGraphModal.classList.remove("active");
      }
    });
  }

  // Trigger initial loads
  runInstitutionalAudit("RELIANCE");
  generateMarketWrap();
});

