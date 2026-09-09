/**
 * Obsidian Multi-Agent Interactive Graph & Knowledge Hub Engine
 * Simulates a high-performance 2D force-directed physics graph canvas
 * with particle beams, glowing multi-agent nodes, live dossiers, and Obsidian UI.
 */

class ObsidianAgentGraph {
  constructor() {
    this.modal = document.getElementById("obsidianGraphModal");
    this.canvas = document.getElementById("obsidianGraphCanvas");
    this.ctx = this.canvas ? this.canvas.getContext("2d") : null;
    this.container = document.getElementById("obsidianCanvasContainer");
    this.inspector = document.getElementById("obsidianNodeInspector");
    this.tooltip = document.getElementById("obsidianGraphTooltip");
    
    // Physics & Camera State
    this.width = 0;
    this.height = 0;
    this.camera = { x: 0, y: 0, zoom: 0.95, targetZoom: 0.95 };
    this.isDraggingNode = false;
    this.draggedNode = null;
    this.isPanning = false;
    this.panStart = { x: 0, y: 0 };
    this.hoveredNode = null;
    this.selectedNode = null;
    this.physicsRunning = true;
    this.particleSpeed = 1.0;
    this.filterGroup = "all";
    this.animFrameId = null;
    this.lastTime = performance.now();
    this.fps = 60;
    this.fpsCounter = 0;
    this.fpsTimer = performance.now();

    // Graph Data Nodes
    this.nodes = [
      {
        id: "nse_feed",
        group: "data",
        label: "NSE Live Tick Ingestion",
        sub: "100ms L2 Order Book & Depth",
        role: "Real-Time Exchange Telemetry Feed",
        model: "Websocket Kernel / ZeroMQ",
        pydantic: "MarketTickEventSchema",
        color: "#38bdf8",
        glow: "rgba(56, 189, 248, 0.4)",
        radius: 22,
        x: -420,
        y: -140,
        vx: 0,
        vy: 0,
        fixed: false,
        pulsePhase: 0,
        activity: 0.95,
        metrics: { latency: "42ms", inDeg: 0, outDeg: 3, throughput: "12.4k ticks/s" },
        dossier: `# NSE Live Tick Ingestion Agent

> [!NOTE]
> Connects directly to NSE/BSE low-latency tick streams, calculating microsecond delta VWAP, volume delta spikes, and depth skew.

\`\`\`python
class MarketTickEventSchema(BaseModel):
    symbol: str = "RELIANCE.NS"
    last_price: float = 2942.50
    bid_depth_ratio: float = 1.42
    vwap_deviation: float = 0.0034
    timestamp_ns: int = 1725798400000
\`\`\`
`
      },
      {
        id: "bse_feed",
        group: "data",
        label: "BSE Orderbook & Breadth",
        sub: "Advance/Decline & Sector Flow",
        role: "Exchange Market Breadth Feed",
        model: "Async Poller / Dalal Street API",
        pydantic: "BreadthMetricsSchema",
        color: "#38bdf8",
        glow: "rgba(56, 189, 248, 0.4)",
        radius: 20,
        x: -420,
        y: 140,
        vx: 0,
        vy: 0,
        fixed: false,
        pulsePhase: 1.2,
        activity: 0.88,
        metrics: { latency: "58ms", inDeg: 0, outDeg: 2, throughput: "4.8k ticks/s" },
        dossier: `# BSE Orderbook & Breadth Sentinel

> [!NOTE]
> Ingests sector-wide market breadth, advance/decline ratios across 500+ listed equities, and volatility skew indices.
`
      },
      {
        id: "macro_feed",
        group: "data",
        label: "RBI & FRED Macro Sentinel",
        sub: "Repo Rate, Inflation & Yields",
        role: "Macroeconomic Context Agent",
        model: "FRED REST API / RBI Circulars",
        pydantic: "MacroContextSchema",
        color: "#38bdf8",
        glow: "rgba(56, 189, 248, 0.4)",
        radius: 20,
        x: -420,
        y: 0,
        vx: 0,
        vy: 0,
        fixed: false,
        pulsePhase: 2.5,
        activity: 0.75,
        metrics: { latency: "180ms", inDeg: 0, outDeg: 3, throughput: "Hourly Sync" },
        dossier: `# RBI & FRED Macro Sentinel

> [!IMPORTANT]
> Tracks monetary policy decisions, 10Y Indian G-Sec sovereign yields, Brent Crude movements, and INR/USD currency drift.
`
      },
      {
        id: "fund_analyst",
        group: "specialist",
        label: "Fundamental Valuation Agent",
        sub: "ROCE, FCF Yield, P/E & D/E",
        role: "Financial Statement & DCF Specialist",
        model: "DeepSeek-R1 / Financial-70B",
        pydantic: "FundamentalAnalysisResult",
        color: "#10b981",
        glow: "rgba(16, 185, 129, 0.45)",
        radius: 26,
        x: -200,
        y: -220,
        vx: 0,
        vy: 0,
        fixed: false,
        pulsePhase: 0.5,
        activity: 0.98,
        metrics: { latency: "142ms", inDeg: 2, outDeg: 2, weight: 0.32 },
        dossier: `# Fundamental Valuation Analyst

> [!TIP]
> Evaluates ROCE (Return on Capital Employed > 15%), 5-Year Free Cash Flow compounding, Debt-to-Equity (< 0.8x), and Graham Fair Value discount.

\`\`\`python
class FundamentalAnalysisResult(BaseModel):
    ticker: str
    intrinsic_value: float = 3380.0
    margin_of_safety_pct: float = 14.8
    roce_3yr_avg: float = 19.4
    financial_health_score: float = 9.2 # / 10
\`\`\`
`
      },
      {
        id: "tech_analyst",
        group: "specialist",
        label: "Technical Momentum Agent",
        sub: "RSI, MACD, 200 EMA & ATR",
        role: "Multi-Timeframe Price Action Specialist",
        model: "TA-Lib Engine + GPT-4o",
        pydantic: "TechnicalSignalSchema",
        color: "#10b981",
        glow: "rgba(16, 185, 129, 0.45)",
        radius: 26,
        x: -200,
        y: -80,
        vx: 0,
        vy: 0,
        fixed: false,
        pulsePhase: 1.8,
        activity: 0.96,
        metrics: { latency: "88ms", inDeg: 2, outDeg: 2, weight: 0.28 },
        dossier: `# Technical Momentum Analyst

> [!NOTE]
> Synthesizes 8 technical indicators: SuperTrend breakout, 20/50/200 EMA Golden Crosses, Volume Weighted MACD, and Bollinger Band Squeezes.
`
      },
      {
        id: "sent_analyst",
        group: "specialist",
        label: "Sentiment & News Analyst",
        sub: "SEC Filings, Twitter & Reddit WSB",
        role: "NLP Crowd Sentiment Specialist",
        model: "FinBERT-Indian-Markets",
        pydantic: "SentimentReportSchema",
        color: "#10b981",
        glow: "rgba(16, 185, 129, 0.45)",
        radius: 24,
        x: -200,
        y: 80,
        vx: 0,
        vy: 0,
        fixed: false,
        pulsePhase: 3.1,
        activity: 0.82,
        metrics: { latency: "210ms", inDeg: 2, outDeg: 2, weight: 0.18 },
        dossier: `# Sentiment & Social Sentiment Analyst

> [!NOTE]
> Scrapes and parses Exchange disclosures, earnings call transcripts, news sentiment polarity (-1.0 to +1.0), and retail crowd momentum.
`
      },
      {
        id: "inst_analyst",
        group: "specialist",
        label: "FII / DII Flow Sentinel",
        sub: "Block Deals & Bulk Buy Accumulation",
        role: "Institutional Smart Money Tracker",
        model: "NSE F&O Participant Model",
        pydantic: "InstitutionalFlowSchema",
        color: "#10b981",
        glow: "rgba(16, 185, 129, 0.45)",
        radius: 24,
        x: -200,
        y: 220,
        vx: 0,
        vy: 0,
        fixed: false,
        pulsePhase: 4.0,
        activity: 0.91,
        metrics: { latency: "115ms", inDeg: 2, outDeg: 2, weight: 0.22 },
        dossier: `# FII / DII Institutional Flow Sentinel

> [!TIP]
> Detects institutional accumulation via delivery volume spikes, open interest put-call ratios, and foreign portfolio investor net equity flows.
`
      },
      {
        id: "bull_researcher",
        group: "debate",
        label: "Bull Duelist (Aegis-7)",
        sub: "Aggressive Upside Defense Thesis",
        role: "Adversarial Bull Advocate",
        model: "DeepSeek-R1 (High Conviction)",
        pydantic: "BullThesisSchema",
        color: "#22c55e",
        glow: "rgba(34, 197, 94, 0.5)",
        radius: 28,
        x: 60,
        y: -150,
        vx: 0,
        vy: 0,
        fixed: false,
        pulsePhase: 0.8,
        activity: 1.0,
        metrics: { latency: "340ms", inDeg: 4, outDeg: 1, conviction: "88%" },
        dossier: `# Bull Duelist (Aegis-7)

> [!IMPORTANT]
> Adversarial agent tasked with formulating maximum upside defense, multi-year operating leverage cases, and bullish catalysts.

- **Objective**: Argue for alpha capture with aggressive price targets.
- **Key Thesis**: ROCE expansion, volume breakout confirmation, and institutional net buying support.
`
      },
      {
        id: "bear_researcher",
        group: "debate",
        label: "Bear Duelist (Nyx-4)",
        sub: "Skeptical Stress-Test Valuation",
        role: "Adversarial Bear Advocate",
        model: "Claude-3.5-Sonnet (Skeptic)",
        pydantic: "BearThesisSchema",
        color: "#f43f5e",
        glow: "rgba(244, 63, 94, 0.5)",
        radius: 28,
        x: 60,
        y: 150,
        vx: 0,
        vy: 0,
        fixed: false,
        pulsePhase: 2.1,
        activity: 1.0,
        metrics: { latency: "320ms", inDeg: 4, outDeg: 1, conviction: "34%" },
        dossier: `# Bear Duelist (Nyx-4)

> [!WARNING]
> Rigorous skeptic tasked with puncturing bullish assumptions, stress-testing margin compression, raw material inflation, and peak multiple risks.

- **Objective**: Protect downside and prevent false breakout traps.
- **Counter-Thesis**: Multiple expansion already priced in; sector valuation near 90th percentile historical band.
`
      },
      {
        id: "research_mgr",
        group: "debate",
        label: "Research Adjudicator Manager",
        sub: "Debate Synthesis into Pydantic State",
        role: "Arbiter of Bull vs Bear Clash",
        model: "LangGraph StateGraph Manager",
        pydantic: "ResearchPlanState",
        color: "#fbbf24",
        glow: "rgba(251, 191, 36, 0.5)",
        radius: 30,
        x: 110,
        y: 0,
        vx: 0,
        vy: 0,
        fixed: false,
        pulsePhase: 1.4,
        activity: 0.99,
        metrics: { latency: "190ms", inDeg: 2, outDeg: 1, synthesisScore: "9.4/10" },
        dossier: `# Research Adjudicator Manager

> [!NOTE]
> Synthesizes the adversarial Bull and Bear cross-examination into a structured \`ResearchPlan\` Pydantic blueprint before order formulation.
`
      },
      {
        id: "trader_agent",
        group: "order",
        label: "Trader Order Formulator",
        sub: "Entry CMP, Stop-Loss, TP1/2 & Sizing",
        role: "Execution Setup Architect",
        model: "Quantitative Sizing Engine",
        pydantic: "ProposedTradeOrder",
        color: "#60a5fa",
        glow: "rgba(96, 165, 250, 0.45)",
        radius: 26,
        x: 290,
        y: 0,
        vx: 0,
        vy: 0,
        fixed: false,
        pulsePhase: 2.8,
        activity: 0.94,
        metrics: { latency: "95ms", inDeg: 1, outDeg: 3, riskReward: "1 : 3.8" },
        dossier: `# Trader Order Formulator

> [!TIP]
> Converts adjudicated research thesis into actionable order brackets (Action: BUY, Entry: CMP ₹2,942, Stop-Loss: ₹2,880, TP1: ₹3,120, TP2: ₹3,280, Sizing: 4.8%).
`
      },
      {
        id: "risk_agg",
        group: "risk",
        label: "Aggressive Risk Arbiter",
        sub: "Capitalizing on High-Alpha Momentum",
        role: "Alpha Maximization Persona",
        model: "Tri-Persona Risk Engine",
        pydantic: "RiskVoteSchema",
        color: "#c084fc",
        glow: "rgba(192, 132, 252, 0.45)",
        radius: 22,
        x: 450,
        y: -130,
        vx: 0,
        vy: 0,
        fixed: false,
        pulsePhase: 0.3,
        activity: 0.88,
        metrics: { latency: "75ms", inDeg: 1, outDeg: 1, vote: "APPROVE (100%)" },
        dossier: `# Aggressive Risk Arbiter

> Advocates maximizing upside capture when technical trend and ROCE align strongly.
`
      },
      {
        id: "risk_neu",
        group: "risk",
        label: "Neutral Risk Arbiter",
        sub: "Benchmark & Sector VaR Alignment",
        role: "Benchmark Balancing Persona",
        model: "Tri-Persona Risk Engine",
        pydantic: "RiskVoteSchema",
        color: "#c084fc",
        glow: "rgba(192, 132, 252, 0.45)",
        radius: 22,
        x: 450,
        y: 0,
        vx: 0,
        vy: 0,
        fixed: false,
        pulsePhase: 1.6,
        activity: 0.90,
        metrics: { latency: "78ms", inDeg: 1, outDeg: 1, vote: "APPROVE (85%)" },
        dossier: `# Neutral Risk Arbiter

> Ensures trade sizing matches portfolio benchmark tracking error constraints and NIFTY 50 beta limits.
`
      },
      {
        id: "risk_con",
        group: "risk",
        label: "Conservative Shield Arbiter",
        sub: "Capital Preservation & Strict 1.5% VaR",
        role: "Max-Drawdown Guard Persona",
        model: "Tri-Persona Risk Engine",
        pydantic: "RiskVoteSchema",
        color: "#c084fc",
        glow: "rgba(192, 132, 252, 0.45)",
        radius: 22,
        x: 450,
        y: 130,
        vx: 0,
        vy: 0,
        fixed: false,
        pulsePhase: 3.2,
        activity: 0.92,
        metrics: { latency: "82ms", inDeg: 1, outDeg: 1, vote: "APPROVE (75%)" },
        dossier: `# Conservative Shield Arbiter

> Enforces strict max loss per position (< 1.5% of total portfolio equity) and liquidity slippage buffer.
`
      },
      {
        id: "pm_agent",
        group: "execution",
        label: "Portfolio Manager & Exec PM",
        sub: "Final Binding Trade Decision",
        role: "Master Portfolio Decision Maker",
        model: "Executive LangGraph Node",
        pydantic: "PortfolioDecisionSchema",
        color: "#f59e0b",
        glow: "rgba(245, 158, 11, 0.5)",
        radius: 28,
        x: 630,
        y: -60,
        vx: 0,
        vy: 0,
        fixed: false,
        pulsePhase: 0.7,
        activity: 1.0,
        metrics: { latency: "62ms", inDeg: 3, outDeg: 1, status: "READY_TO_EXECUTE" },
        dossier: `# Portfolio Manager (Executive PM)

> [!IMPORTANT]
> Issues the binding \`PortfolioDecision\` authorizing MT5 exchange dispatch, generating the Obsidian Markdown run report, and logging state to disk.
`
      },
      {
        id: "memory_log",
        group: "execution",
        label: "TradingMemoryLog",
        sub: "Post-Trade Return Reflection & RAG",
        role: "Episodic Cross-Ticker Memory",
        model: "Vector Store / SQLite Memory",
        pydantic: "EpisodicReflectionRecord",
        color: "#34d399",
        glow: "rgba(52, 211, 153, 0.45)",
        radius: 24,
        x: 630,
        y: 80,
        vx: 0,
        vy: 0,
        fixed: false,
        pulsePhase: 2.2,
        activity: 0.95,
        metrics: { latency: "45ms", inDeg: 1, outDeg: 2, totalStored: "1,420 trades" },
        dossier: `# TradingMemoryLog (Episodic Reflection)

> [!NOTE]
> Feeds historical win/loss lessons, slippage statistics, and sector regime shifts back to Analyst specialists and Duel researchers.
`
      }
    ];

    // Synapses / Connections
    this.links = [
      { source: "nse_feed", target: "fund_analyst", color: "#38bdf8" },
      { source: "nse_feed", target: "tech_analyst", color: "#38bdf8" },
      { source: "nse_feed", target: "inst_analyst", color: "#38bdf8" },
      { source: "bse_feed", target: "tech_analyst", color: "#38bdf8" },
      { source: "bse_feed", target: "sent_analyst", color: "#38bdf8" },
      { source: "macro_feed", target: "fund_analyst", color: "#38bdf8" },
      { source: "macro_feed", target: "sent_analyst", color: "#38bdf8" },
      { source: "macro_feed", target: "inst_analyst", color: "#38bdf8" },

      { source: "fund_analyst", target: "bull_researcher", color: "#10b981" },
      { source: "fund_analyst", target: "bear_researcher", color: "#10b981" },
      { source: "tech_analyst", target: "bull_researcher", color: "#10b981" },
      { source: "tech_analyst", target: "bear_researcher", color: "#10b981" },
      { source: "sent_analyst", target: "bull_researcher", color: "#10b981" },
      { source: "sent_analyst", target: "bear_researcher", color: "#10b981" },
      { source: "inst_analyst", target: "bull_researcher", color: "#10b981" },
      { source: "inst_analyst", target: "bear_researcher", color: "#10b981" },

      { source: "bull_researcher", target: "research_mgr", color: "#22c55e" },
      { source: "bear_researcher", target: "research_mgr", color: "#f43f5e" },
      { source: "research_mgr", target: "trader_agent", color: "#fbbf24" },

      { source: "trader_agent", target: "risk_agg", color: "#60a5fa" },
      { source: "trader_agent", target: "risk_neu", color: "#60a5fa" },
      { source: "trader_agent", target: "risk_con", color: "#60a5fa" },

      { source: "risk_agg", target: "pm_agent", color: "#c084fc" },
      { source: "risk_neu", target: "pm_agent", color: "#c084fc" },
      { source: "risk_con", target: "pm_agent", color: "#c084fc" },

      { source: "pm_agent", target: "memory_log", color: "#f59e0b" },
      { source: "memory_log", target: "fund_analyst", color: "#34d399", dashed: true },
      { source: "memory_log", target: "bull_researcher", color: "#34d399", dashed: true }
    ];

    // Dynamic Particles Stream
    this.particles = [];
    this.initParticles();

    this.initEvents();
  }

  initParticles() {
    this.particles = [];
    this.links.forEach((link, idx) => {
      // 2 particles per link traveling at different offsets
      this.particles.push({
        linkIndex: idx,
        progress: Math.random(),
        speed: 0.003 + Math.random() * 0.004,
        size: 2.2 + Math.random() * 1.5,
        color: link.color || "#38bdf8"
      });
      this.particles.push({
        linkIndex: idx,
        progress: Math.random(),
        speed: 0.004 + Math.random() * 0.003,
        size: 2.0,
        color: link.color || "#38bdf8"
      });
    });
  }

  initEvents() {
    // Open trigger
    const openBtn = document.getElementById("openObsidianGraphBtn");
    if (openBtn) {
      openBtn.addEventListener("click", () => this.open());
    }

    // Close triggers
    const closeBtn = document.getElementById("closeObsidianGraphModalBtn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.close());
    }
    const closeWindowBtn = document.getElementById("obsidianCloseWindowBtn");
    if (closeWindowBtn) {
      closeWindowBtn.addEventListener("click", () => this.close());
    }

    if (this.modal) {
      this.modal.addEventListener("click", (e) => {
        if (e.target === this.modal) this.close();
      });
    }

    window.addEventListener("keydown", (e) => {
      if (this.modal && this.modal.classList.contains("active")) {
        if (e.key === "Escape") this.close();
        if (e.key === " " && !e.target.matches("input, textarea")) {
          e.preventDefault();
          this.togglePhysics();
        }
        if (e.key.toLowerCase() === "r") {
          this.resetCamera();
        }
      }
    });

    if (!this.canvas) return;

    // Mouse Interaction
    this.canvas.addEventListener("mousedown", (e) => this.onMouseDown(e));
    window.addEventListener("mousemove", (e) => this.onMouseMove(e));
    window.addEventListener("mouseup", (e) => this.onMouseUp(e));
    this.canvas.addEventListener("wheel", (e) => this.onWheel(e), { passive: false });

    // Window Resize
    window.addEventListener("resize", () => {
      if (this.modal && this.modal.classList.contains("active")) {
        this.resize();
      }
    });

    // Toolbar Buttons
    const zoomInBtn = document.getElementById("obsidianZoomInBtn");
    const zoomOutBtn = document.getElementById("obsidianZoomOutBtn");
    const resetCamBtn = document.getElementById("obsidianResetCamBtn");
    const physicsToggleBtn = document.getElementById("obsidianPhysicsToggleBtn");
    const filterSelect = document.getElementById("obsidianGroupFilter");
    const speedSlider = document.getElementById("obsidianParticleSpeed");

    if (zoomInBtn) zoomInBtn.addEventListener("click", () => this.zoom(1.2));
    if (zoomOutBtn) zoomOutBtn.addEventListener("click", () => this.zoom(0.8));
    if (resetCamBtn) resetCamBtn.addEventListener("click", () => this.resetCamera());
    if (physicsToggleBtn) physicsToggleBtn.addEventListener("click", () => this.togglePhysics());
    if (filterSelect) {
      filterSelect.addEventListener("change", (e) => {
        this.filterGroup = e.target.value;
      });
    }
    if (speedSlider) {
      speedSlider.addEventListener("input", (e) => {
        this.particleSpeed = parseFloat(e.target.value);
      });
    }

    // Vault Sidebar item clicks
    const vaultItems = document.querySelectorAll(".vault-file-item");
    vaultItems.forEach((item) => {
      item.addEventListener("click", () => {
        vaultItems.forEach(i => i.classList.remove("active"));
        item.classList.add("active");
        const targetNodeId = item.getAttribute("data-node-id");
        if (targetNodeId) {
          const node = this.nodes.find(n => n.id === targetNodeId);
          if (node) this.selectNode(node, true);
        }
      });
    });
  }

  open() {
    if (!this.modal) return;
    this.modal.classList.add("active");
    document.body.style.overflow = "hidden";
    
    // Resize canvas to container
    setTimeout(() => {
      this.resize();
      this.resetCamera();
      // Select first high-profile node by default
      const defaultNode = this.nodes.find(n => n.id === "bull_researcher") || this.nodes[0];
      this.selectNode(defaultNode, false);
      
      // Start loop if not already running
      if (!this.animFrameId) {
        this.lastTime = performance.now();
        this.renderLoop();
      }
    }, 50);
  }

  close() {
    if (!this.modal) return;
    this.modal.classList.remove("active");
    document.body.style.overflow = "";
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  resize() {
    if (!this.canvas || !this.container) return;
    const rect = this.container.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    
    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);
  }

  resetCamera() {
    this.camera.x = this.width / 2;
    this.camera.y = this.height / 2;
    // Auto-fit zoom based on container size
    if (this.width < 800) {
      this.camera.zoom = 0.65;
    } else if (this.width < 1200) {
      this.camera.zoom = 0.85;
    } else {
      this.camera.zoom = 0.95;
    }
    this.camera.targetZoom = this.camera.zoom;
  }

  zoom(factor) {
    this.camera.zoom = Math.max(0.3, Math.min(2.5, this.camera.zoom * factor));
  }

  togglePhysics() {
    this.physicsRunning = !this.physicsRunning;
    const btn = document.getElementById("obsidianPhysicsToggleBtn");
    if (btn) {
      btn.innerHTML = this.physicsRunning 
        ? '<i data-lucide="pause"></i><span>Freeze</span>'
        : '<i data-lucide="play"></i><span>Unfreeze</span>';
      if (window.lucide) lucide.createIcons();
    }
  }

  // --- Coordinate Transforms ---
  worldToScreen(wx, wy) {
    return {
      x: (wx * this.camera.zoom) + this.camera.x,
      y: (wy * this.camera.zoom) + this.camera.y
    };
  }

  screenToWorld(sx, sy) {
    return {
      x: (sx - this.camera.x) / this.camera.zoom,
      y: (sy - this.camera.y) / this.camera.zoom
    };
  }

  getNodeAt(sx, sy) {
    const world = this.screenToWorld(sx, sy);
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const node = this.nodes[i];
      const dx = world.x - node.x;
      const dy = world.y - node.y;
      const hitRadius = (node.radius + 6);
      if (dx * dx + dy * dy <= hitRadius * hitRadius) {
        return node;
      }
    }
    return null;
  }

  // --- Mouse / Touch Handlers ---
  onMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    
    const hitNode = this.getNodeAt(sx, sy);
    if (hitNode) {
      this.isDraggingNode = true;
      this.draggedNode = hitNode;
      hitNode.fixed = true;
      this.selectNode(hitNode, false);
    } else {
      this.isPanning = true;
      this.panStart = { x: e.clientX - this.camera.x, y: e.clientY - this.camera.y };
      this.canvas.style.cursor = "grabbing";
    }
  }

  onMouseMove(e) {
    if (!this.modal || !this.modal.classList.contains("active")) return;
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    if (this.isDraggingNode && this.draggedNode) {
      const world = this.screenToWorld(sx, sy);
      this.draggedNode.x = world.x;
      this.draggedNode.y = world.y;
      this.draggedNode.vx = 0;
      this.draggedNode.vy = 0;
    } else if (this.isPanning) {
      this.camera.x = e.clientX - this.panStart.x;
      this.camera.y = e.clientY - this.panStart.y;
    } else {
      // Hover detection
      if (sx >= 0 && sx <= this.width && sy >= 0 && sy <= this.height) {
        const hitNode = this.getNodeAt(sx, sy);
        if (hitNode !== this.hoveredNode) {
          this.hoveredNode = hitNode;
          this.canvas.style.cursor = hitNode ? "pointer" : "default";
          this.updateTooltip(hitNode, sx, sy);
        } else if (hitNode) {
          this.updateTooltip(hitNode, sx, sy);
        } else {
          this.hideTooltip();
        }
      } else {
        this.hideTooltip();
      }
    }
  }

  onMouseUp(e) {
    if (this.isDraggingNode && this.draggedNode) {
      this.draggedNode.fixed = false;
      this.isDraggingNode = false;
      this.draggedNode = null;
    }
    if (this.isPanning) {
      this.isPanning = false;
      this.canvas.style.cursor = "default";
    }
  }

  onWheel(e) {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    const newZoom = Math.max(0.3, Math.min(2.5, this.camera.zoom * zoomFactor));

    // Zoom towards mouse position
    this.camera.x = mouseX - (mouseX - this.camera.x) * (newZoom / this.camera.zoom);
    this.camera.y = mouseY - (mouseY - this.camera.y) * (newZoom / this.camera.zoom);
    this.camera.zoom = newZoom;
  }

  updateTooltip(node, sx, sy) {
    if (!this.tooltip || !node) return;
    this.tooltip.innerHTML = `
      <div class="tt-header" style="border-left: 3px solid ${node.color}">
        <strong>${node.label}</strong>
        <span class="tt-badge" style="background: ${node.glow}; color: ${node.color}">${node.group.toUpperCase()}</span>
      </div>
      <div class="tt-body">
        <div>${node.sub}</div>
        <div class="tt-model">🧠 Model: <span>${node.model}</span></div>
      </div>
    `;
    this.tooltip.style.display = "block";
    
    // Position tooltip
    let left = sx + 15;
    let top = sy + 15;
    if (left + 220 > this.width) left = sx - 230;
    if (top + 100 > this.height) top = sy - 100;
    
    this.tooltip.style.transform = `translate(${left}px, ${top}px)`;
  }

  hideTooltip() {
    if (this.tooltip) this.tooltip.style.display = "none";
  }

  selectNode(node, animateCenter = false) {
    this.selectedNode = node;
    this.renderInspector(node);

    // Sync vault sidebar active item
    const items = document.querySelectorAll(".vault-file-item");
    items.forEach(i => {
      if (i.getAttribute("data-node-id") === node.id) {
        i.classList.add("active");
        i.scrollIntoView({ behavior: "smooth", block: "nearest" });
      } else {
        i.classList.remove("active");
      }
    });

    if (animateCenter) {
      this.camera.x = this.width / 2 - node.x * this.camera.zoom;
      this.camera.y = this.height / 2 - node.y * this.camera.zoom;
    }
  }

  renderInspector(node) {
    if (!this.inspector || !node) return;

    this.inspector.innerHTML = `
      <div class="inspector-header">
        <div class="inspector-icon" style="background: ${node.glow}; border: 1px solid ${node.color}; color: ${node.color};">
          <i data-lucide="file-text"></i>
        </div>
        <div class="inspector-titles">
          <h4>${node.label}</h4>
          <span class="inspector-path">obsidian/01_Agents/${node.id}.md</span>
        </div>
      </div>

      <div class="inspector-yaml-block">
        <div class="yaml-row"><span class="y-key">stage:</span> <span class="y-val">"${node.group.toUpperCase()}"</span></div>
        <div class="yaml-row"><span class="y-key">role:</span> <span class="y-val">"${node.role}"</span></div>
        <div class="yaml-row"><span class="y-key">model:</span> <span class="y-val">"${node.model}"</span></div>
        <div class="yaml-row"><span class="y-key">pydantic_schema:</span> <span class="y-val">"${node.pydantic}"</span></div>
        <div class="yaml-row"><span class="y-key">synapse_activity:</span> <span class="y-val" style="color: #38bdf8;">${Math.round(node.activity * 100)}%</span></div>
      </div>

      <div class="inspector-stats-grid">
        <div class="stat-pill">
          <span class="lbl">LATENCY</span>
          <span class="val">${node.metrics.latency || "75ms"}</span>
        </div>
        <div class="stat-pill">
          <span class="lbl">IN / OUT</span>
          <span class="val">${node.metrics.inDeg || 0} / ${node.metrics.outDeg || 0}</span>
        </div>
        <div class="stat-pill">
          <span class="lbl">STATUS</span>
          <span class="val online">SYNAPSE OK</span>
        </div>
      </div>

      <div class="inspector-markdown-body">
        ${this.formatMarkdown(node.dossier)}
      </div>

      <div class="inspector-actions">
        <button class="obsidian-app-btn primary" id="openNativeObsidianBtn" onclick="window.obsidianGraphApp.openInNativeObsidian('${node.id}')">
          <i data-lucide="external-link"></i> Open Note in Obsidian App
        </button>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  }

  async openInNativeObsidian(nodeId) {
    const btn = document.getElementById("openNativeObsidianBtn");
    if (btn) {
      btn.innerHTML = '<i data-lucide="loader" class="pulse"></i> Opening in Obsidian App...';
      if (window.lucide) lucide.createIcons();
    }

    try {
      const res = await fetch(`/api/open_obsidian?node=${encodeURIComponent(nodeId)}`);
      const data = await res.json();
      if (data && data.success) {
        if (btn) {
          btn.innerHTML = '<i data-lucide="check-circle-2"></i> Opened in Obsidian Desktop!';
          btn.style.background = "linear-gradient(135deg, rgba(34, 197, 94, 0.4), rgba(16, 185, 129, 0.3))";
          btn.style.borderColor = "rgba(34, 197, 94, 0.6)";
          if (window.lucide) lucide.createIcons();
          setTimeout(() => {
            if (btn) {
              btn.innerHTML = '<i data-lucide="external-link"></i> Open Note in Obsidian App';
              btn.style.background = "";
              btn.style.borderColor = "";
              if (window.lucide) lucide.createIcons();
            }
          }, 3000);
        }
      } else if (data && data.obsidian_uri) {
        window.location.href = data.obsidian_uri;
      }
    } catch (err) {
      console.warn("Direct API call error, falling back to protocol URI:", err);
      window.location.href = `obsidian://open?path=${encodeURIComponent(nodeId)}`;
    }
  }

  formatMarkdown(md) {
    if (!md) return "";
    return md
      .replace(/^# (.*$)/gim, '<h3 class="md-h1">$1</h3>')
      .replace(/^## (.*$)/gim, '<h4 class="md-h2">$1</h4>')
      .replace(/^> \[!NOTE\]\n> (.*$)/gim, '<div class="md-callout note"><div class="callout-title">ℹ️ NOTE</div><p>$1</p></div>')
      .replace(/^> \[!TIP\]\n> (.*$)/gim, '<div class="md-callout tip"><div class="callout-title">💡 TIP</div><p>$1</p></div>')
      .replace(/^> \[!IMPORTANT\]\n> (.*$)/gim, '<div class="md-callout important"><div class="callout-title">⚡ IMPORTANT</div><p>$1</p></div>')
      .replace(/^> \[!WARNING\]\n> (.*$)/gim, '<div class="md-callout warning"><div class="callout-title">⚠️ WARNING</div><p>$1</p></div>')
      .replace(/```python([\s\S]*?)```/gim, '<pre class="md-code-block"><code class="language-python">$1</code></pre>')
      .replace(/^- (.*$)/gim, '<li class="md-li">$1</li>');
  }

  // --- Force Physics Simulation ---
  updatePhysics(dt) {
    if (!this.physicsRunning) return;

    const repulsionK = 18000;
    const springK = 0.0035;
    const centerK = 0.0008;
    const damping = 0.88;

    // Repulsion between all node pairs
    for (let i = 0; i < this.nodes.length; i++) {
      const n1 = this.nodes[i];
      for (let j = i + 1; j < this.nodes.length; j++) {
        const n2 = this.nodes[j];
        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        let distSq = dx * dx + dy * dy;
        if (distSq < 1) distSq = 1;
        const dist = Math.sqrt(distSq);

        const force = repulsionK / (distSq + 200);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        if (!n1.fixed) {
          n1.vx -= fx;
          n1.vy -= fy;
        }
        if (!n2.fixed) {
          n2.vx += fx;
          n2.vy += fy;
        }
      }
    }

    // Spring Hooke tension along links
    this.links.forEach((link) => {
      const src = this.nodes.find(n => n.id === link.source);
      const tgt = this.nodes.find(n => n.id === link.target);
      if (!src || !tgt) return;

      const dx = tgt.x - src.x;
      const dy = tgt.y - src.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const restLength = link.dashed ? 320 : 180;
      const force = (dist - restLength) * springK;

      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      if (!src.fixed) {
        src.vx += fx;
        src.vy += fy;
      }
      if (!tgt.fixed) {
        tgt.vx -= fx;
        tgt.vy -= fy;
      }
    });

    // Center Gravitational Well + Integration
    this.nodes.forEach((n) => {
      if (!n.fixed) {
        // Gravitational pull toward center
        n.vx -= n.x * centerK;
        n.vy -= n.y * centerK;

        // Apply velocity & damping
        n.x += n.vx;
        n.y += n.vy;
        n.vx *= damping;
        n.vy *= damping;
      }

      // Update pulse phase
      n.pulsePhase += 0.04;
    });

    // Update Particles
    this.particles.forEach((p) => {
      p.progress += p.speed * this.particleSpeed;
      if (p.progress >= 1.0) {
        p.progress = 0;
      }
    });
  }

  // --- Main Render Loop ---
  renderLoop() {
    const now = performance.now();
    const dt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // FPS calculation
    this.fpsCounter++;
    if (now - this.fpsTimer >= 1000) {
      this.fps = this.fpsCounter;
      this.fpsCounter = 0;
      this.fpsTimer = now;
      const fpsElem = document.getElementById("obsidianFpsDisplay");
      if (fpsElem) fpsElem.textContent = `${this.fps} FPS`;
    }

    this.updatePhysics(dt);
    this.render();

    this.animFrameId = requestAnimationFrame(() => this.renderLoop());
  }

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const width = this.width;
    const height = this.height;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Obsidian Dark Canvas Background & Dot Matrix Grid
    this.drawBackgroundGrid(ctx, width, height);

    // 2. Draw Synapses / Links
    this.drawLinks(ctx);

    // 3. Draw Moving Particle Beams
    this.drawParticles(ctx);

    // 4. Draw Glowing Agent Nodes
    this.drawNodes(ctx);
  }

  drawBackgroundGrid(ctx, width, height) {
    ctx.save();
    
    // Deep dark obsidian gradient
    const bgGrad = ctx.createRadialGradient(
      this.camera.x, this.camera.y, 100 * this.camera.zoom,
      this.camera.x, this.camera.y, Math.max(width, height)
    );
    bgGrad.addColorStop(0, "#0e1320");
    bgGrad.addColorStop(1, "#07090e");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Obsidian Coordinate Grid Dots
    const gridSize = 40 * this.camera.zoom;
    if (gridSize > 12) {
      const offsetX = this.camera.x % gridSize;
      const offsetY = this.camera.y % gridSize;

      ctx.fillStyle = "rgba(255, 255, 255, 0.045)";
      for (let x = offsetX; x < width; x += gridSize) {
        for (let y = offsetY; y < height; y += gridSize) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    ctx.restore();
  }

  drawLinks(ctx) {
    ctx.save();

    this.links.forEach((link) => {
      const src = this.nodes.find(n => n.id === link.source);
      const tgt = this.nodes.find(n => n.id === link.target);
      if (!src || !tgt) return;

      const isFiltered = this.filterGroup !== "all" && 
        src.group !== this.filterGroup && tgt.group !== this.filterGroup;
      
      const isConnectedToHover = this.hoveredNode && 
        (src.id === this.hoveredNode.id || tgt.id === this.hoveredNode.id);
      
      const isConnectedToSelect = this.selectedNode && 
        (src.id === this.selectedNode.id || tgt.id === this.selectedNode.id);

      const p1 = this.worldToScreen(src.x, src.y);
      const p2 = this.worldToScreen(tgt.x, tgt.y);

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);

      // Curved or straight synapse
      if (link.dashed) {
        // Feedback curve
        const midX = (p1.x + p2.x) / 2 - 40 * this.camera.zoom;
        const midY = (p1.y + p2.y) / 2 + 60 * this.camera.zoom;
        ctx.setLineDash([5, 5]);
        ctx.quadraticCurveTo(midX, midY, p2.x, p2.y);
      } else {
        ctx.setLineDash([]);
        ctx.lineTo(p2.x, p2.y);
      }

      if (isFiltered) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        ctx.lineWidth = 1;
      } else if (isConnectedToHover || isConnectedToSelect) {
        ctx.strokeStyle = link.color || "rgba(56, 189, 248, 0.9)";
        ctx.lineWidth = 2.5 * this.camera.zoom;
        ctx.shadowColor = link.color;
        ctx.shadowBlur = 10;
      } else {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
        ctx.lineWidth = 1.2 * this.camera.zoom;
        ctx.shadowBlur = 0;
      }

      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;
    });

    ctx.restore();
  }

  drawParticles(ctx) {
    ctx.save();

    this.particles.forEach((p) => {
      const link = this.links[p.linkIndex];
      if (!link) return;

      const src = this.nodes.find(n => n.id === link.source);
      const tgt = this.nodes.find(n => n.id === link.target);
      if (!src || !tgt) return;

      const isFiltered = this.filterGroup !== "all" && 
        src.group !== this.filterGroup && tgt.group !== this.filterGroup;
      if (isFiltered) return;

      const p1 = this.worldToScreen(src.x, src.y);
      const p2 = this.worldToScreen(tgt.x, tgt.y);

      let px, py;
      if (link.dashed) {
        const midX = (p1.x + p2.x) / 2 - 40 * this.camera.zoom;
        const midY = (p1.y + p2.y) / 2 + 60 * this.camera.zoom;
        const t = p.progress;
        px = (1 - t) * (1 - t) * p1.x + 2 * (1 - t) * t * midX + t * t * p2.x;
        py = (1 - t) * (1 - t) * p1.y + 2 * (1 - t) * t * midY + t * t * p2.y;
      } else {
        px = p1.x + (p2.x - p1.x) * p.progress;
        py = p1.y + (p2.y - p1.y) * p.progress;
      }

      const particleRadius = Math.max(1.5, p.size * this.camera.zoom);

      // Glowing photon head
      ctx.beginPath();
      ctx.arc(px, py, particleRadius, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 12 * this.camera.zoom;
      ctx.fill();

      // Colored halo
      ctx.beginPath();
      ctx.arc(px, py, particleRadius * 1.8, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = 0.5;
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });

    ctx.restore();
  }

  drawNodes(ctx) {
    ctx.save();

    this.nodes.forEach((node) => {
      const isFiltered = this.filterGroup !== "all" && node.group !== this.filterGroup;
      const isHovered = this.hoveredNode && this.hoveredNode.id === node.id;
      const isSelected = this.selectedNode && this.selectedNode.id === node.id;

      const pos = this.worldToScreen(node.x, node.y);
      const r = Math.max(12, node.radius * this.camera.zoom);

      // 1. Animated Halo / Pulsing Orbit Rings
      if (!isFiltered) {
        const pulse = Math.sin(node.pulsePhase) * 0.5 + 0.5;
        const haloR = r + (6 + pulse * 8) * this.camera.zoom;

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, haloR, 0, Math.PI * 2);
        ctx.strokeStyle = node.glow;
        ctx.lineWidth = (isSelected || isHovered ? 2.5 : 1.2) * this.camera.zoom;
        ctx.stroke();
      }

      // 2. Outer Glow
      if (isSelected || isHovered) {
        ctx.shadowColor = node.color;
        ctx.shadowBlur = 24 * this.camera.zoom;
      } else if (!isFiltered) {
        ctx.shadowColor = node.color;
        ctx.shadowBlur = 10 * this.camera.zoom;
      } else {
        ctx.shadowBlur = 0;
      }

      // 3. Node Circle Body
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);

      const nodeGrad = ctx.createRadialGradient(
        pos.x - r * 0.3, pos.y - r * 0.3, r * 0.1,
        pos.x, pos.y, r
      );
      if (isFiltered) {
        nodeGrad.addColorStop(0, "#1f293d");
        nodeGrad.addColorStop(1, "#0f172a");
      } else {
        nodeGrad.addColorStop(0, node.color);
        nodeGrad.addColorStop(0.5, "#131b2e");
        nodeGrad.addColorStop(1, "#0a0e1a");
      }
      ctx.fillStyle = nodeGrad;
      ctx.fill();

      // Border
      ctx.lineWidth = (isSelected ? 3.0 : (isHovered ? 2.2 : 1.5)) * this.camera.zoom;
      ctx.strokeStyle = isFiltered ? "rgba(255,255,255,0.1)" : (isSelected ? "#ffffff" : node.color);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 4. Center Core Dot
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, Math.max(3, r * 0.28), 0, Math.PI * 2);
      ctx.fillStyle = isFiltered ? "#64748b" : (isSelected ? "#ffffff" : node.color);
      ctx.fill();

      // 5. Typography / Labels (Obsidian Aesthetic)
      if (this.camera.zoom > 0.45) {
        const fontSize = Math.max(9, Math.round(11 * this.camera.zoom));
        ctx.font = `600 ${fontSize}px "Outfit", "Inter", -apple-system, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";

        const labelY = pos.y + r + 6 * this.camera.zoom;

        // Label Background Pill
        const labelText = node.label;
        const textWidth = ctx.measureText(labelText).width;
        const padding = 6 * this.camera.zoom;

        ctx.fillStyle = isSelected 
          ? "rgba(15, 23, 42, 0.95)" 
          : (isHovered ? "rgba(15, 23, 42, 0.85)" : "rgba(10, 14, 26, 0.75)");
        ctx.strokeStyle = isSelected 
          ? node.color 
          : (isHovered ? "rgba(255,255,255,0.25)" : "rgba(255, 255, 255, 0.08)");
        ctx.lineWidth = 1;

        const pillX = pos.x - textWidth / 2 - padding;
        const pillY = labelY - 2;
        const pillW = textWidth + padding * 2;
        const pillH = fontSize + 6 * this.camera.zoom;
        const radius = 4 * this.camera.zoom;

        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, radius);
        ctx.fill();
        ctx.stroke();

        // Label Text
        ctx.fillStyle = isFiltered 
          ? "#64748b" 
          : (isSelected ? "#ffffff" : (isHovered ? "#f8fafc" : "#e2e8f0"));
        ctx.fillText(labelText, pos.x, labelY + 1);

        // Subtitle if zoomed in
        if (this.camera.zoom > 0.85 && !isFiltered) {
          const subFontSize = Math.max(8, Math.round(9 * this.camera.zoom));
          ctx.font = `400 ${subFontSize}px "Outfit", sans-serif`;
          ctx.fillStyle = "#94a3b8";
          ctx.fillText(node.sub, pos.x, labelY + fontSize + 8 * this.camera.zoom);
        }
      }
    });

    ctx.restore();
  }
}

// Instantiate on DOM load
window.addEventListener("DOMContentLoaded", () => {
  window.obsidianGraphApp = new ObsidianAgentGraph();
});
