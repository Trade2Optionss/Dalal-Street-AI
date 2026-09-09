/**
 * Next-Gen Futuristic Financial Waves & Japanese Candlestick Chart Engine
 * Features:
 * - Multi-layered organic aurora wave ribbons with glassmorphism gradient meshes
 * - Ultra-crisp slender Japanese Candlesticks with authentic emerald/ruby glass bodies & hairline wicks
 * - Luminous double EMA spline beams with moving photon pulses
 * - Subtle perspective coordinate grid and floating neon market particles
 * - High-performance 60fps canvas rendering with smooth mouse parallax
 */

class TradingWaveCanvas {
  constructor() {
    this.canvas = document.getElementById("tradingWaveCanvas");
    if (!this.canvas) {
      this.canvas = document.createElement("canvas");
      this.canvas.id = "tradingWaveCanvas";
      this.canvas.className = "trading-wave-canvas";
      const bgContainer = document.querySelector(".uplinq-bg-container") || document.body;
      bgContainer.prepend(this.canvas);
    }
    this.ctx = this.canvas.getContext("2d");
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.time = 0;
    this.mouseX = this.width / 2;
    this.mouseY = this.height / 2;
    this.targetMouseX = this.width / 2;
    this.targetMouseY = this.height / 2;

    // Organic wave parameters
    this.candleCount = 36;
    this.candles = [];
    this.particles = [];
    this.particleCount = 45;
    this.photons = [];
    this.photonCount = 12;

    this.initCanvas();
    this.initCandles();
    this.initParticles();
    this.initPhotons();
    this.initEvents();
    this.animate();
  }

  initCanvas() {
    this.resize();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);

    // Dynamic candle density based on screen resolution
    this.candleCount = Math.max(24, Math.min(42, Math.floor(this.width / 44)));
    this.initCandles();
  }

  initCandles() {
    this.candles = [];
    for (let i = 0; i < this.candleCount; i++) {
      const progress = i / (this.candleCount - 1);
      this.candles.push({
        index: i,
        progress: progress,
        seed: Math.random() * Math.PI * 2,
        volRatio: 0.3 + Math.random() * 0.7
      });
    }
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.4 + 0.15,
        vy: (Math.random() - 0.5) * 0.25,
        size: 0.8 + Math.random() * 1.8,
        alpha: 0.1 + Math.random() * 0.4,
        color: Math.random() > 0.5 ? "#2dd4bf" : (Math.random() > 0.5 ? "#38bdf8" : "#818cf8")
      });
    }
  }

  initPhotons() {
    this.photons = [];
    for (let i = 0; i < this.photonCount; i++) {
      this.photons.push({
        progress: Math.random(),
        speed: 0.0015 + Math.random() * 0.0025,
        size: 2 + Math.random() * 2,
        color: Math.random() > 0.4 ? "#38bdf8" : "#2dd4bf"
      });
    }
  }

  initEvents() {
    window.addEventListener("resize", () => {
      this.resize();
    });

    window.addEventListener("mousemove", (e) => {
      this.targetMouseX = e.clientX;
      this.targetMouseY = e.clientY;
    });
  }

  // Multi-frequency smooth spline wave formula (positioned gracefully below hero text)
  getWaveY(x, t, offsetMultiplier = 1.0, phaseShift = 0) {
    const normX = x / this.width;
    
    // Smooth harmonic flow with balanced amplitude
    const wave1 = Math.sin(normX * 2.6 - t * 0.3 + phaseShift) * 32;
    const wave2 = Math.cos(normX * 4.4 + t * 0.2 + phaseShift * 1.2) * 18;
    const wave3 = Math.sin(normX * 1.2 - t * 0.15) * 40;

    // Gentle upward trajectory towards the right side
    const trendSlope = (normX - 0.5) * 70;

    // Positioned safely in the lower half (below hero heading and subtitle)
    const centerY = this.height * 0.72 + (this.mouseY - this.height / 2) * 0.03;
    return centerY - (wave1 + wave2 + wave3) * offsetMultiplier - trendSlope;
  }

  drawGrid() {
    const ctx = this.ctx;
    ctx.save();

    const stepX = 160;
    const stepY = 100;

    ctx.strokeStyle = "rgba(56, 189, 248, 0.035)";
    ctx.lineWidth = 1;

    // Subtle coordinate lines
    for (let x = 0; x < this.width; x += stepX) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }

    for (let y = 0; y < this.height; y += stepY) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawAuroraWaveRibbons(t) {
    const ctx = this.ctx;
    const steps = 80;
    const stepWidth = this.width / steps;

    // 1. Deep Oceanic Background Glow Ribbon
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, this.getWaveY(0, t, 1.15, 0.4));

    for (let i = 1; i <= steps; i++) {
      const x = i * stepWidth;
      const y = this.getWaveY(x, t, 1.15, 0.4);
      const prevX = (i - 1) * stepWidth;
      const prevY = this.getWaveY(prevX, t, 1.15, 0.4);
      const midX = (prevX + x) / 2;
      const midY = (prevY + y) / 2;
      ctx.quadraticCurveTo(prevX, prevY, midX, midY);
    }

    ctx.lineTo(this.width, this.height);
    ctx.lineTo(0, this.height);
    ctx.closePath();

    const bgGrad = ctx.createLinearGradient(0, this.height * 0.2, 0, this.height);
    bgGrad.addColorStop(0, "rgba(14, 165, 233, 0.06)");
    bgGrad.addColorStop(0.4, "rgba(20, 184, 166, 0.03)");
    bgGrad.addColorStop(1, "rgba(2, 6, 23, 0)");
    ctx.fillStyle = bgGrad;
    ctx.fill();
    ctx.restore();

    // 2. Secondary Cyan/Teal Fluid Ribbon
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, this.getWaveY(0, t, 0.9, -0.3));

    for (let i = 1; i <= steps; i++) {
      const x = i * stepWidth;
      const y = this.getWaveY(x, t, 0.9, -0.3);
      const prevX = (i - 1) * stepWidth;
      const prevY = this.getWaveY(prevX, t, 0.9, -0.3);
      const midX = (prevX + x) / 2;
      const midY = (prevY + y) / 2;
      ctx.quadraticCurveTo(prevX, prevY, midX, midY);
    }

    ctx.lineTo(this.width, this.height);
    ctx.lineTo(0, this.height);
    ctx.closePath();

    const ribbonGrad = ctx.createLinearGradient(0, this.height * 0.35, 0, this.height);
    ribbonGrad.addColorStop(0, "rgba(45, 212, 191, 0.05)");
    ribbonGrad.addColorStop(0.5, "rgba(56, 189, 248, 0.02)");
    ribbonGrad.addColorStop(1, "rgba(2, 6, 23, 0)");
    ctx.fillStyle = ribbonGrad;
    ctx.fill();
    ctx.restore();
  }

  drawVolumeHistogram(candleData, t) {
    const ctx = this.ctx;
    ctx.save();

    const spacing = this.width / this.candleCount;
    const barWidth = Math.max(4, spacing * 0.45);

    for (let i = 0; i < candleData.length; i++) {
      const c = candleData[i];
      const normX = i / candleData.length;
      
      const volHeight = (20 + Math.sin(i * 0.9 + t * 0.7) * 14 + c.bodyHeight * 1.2) * (normX > 0.7 ? 1.6 : 1.0);
      const y = this.height - volHeight - 24;

      const grad = ctx.createLinearGradient(c.x, y, c.x, this.height);
      if (c.isBull) {
        grad.addColorStop(0, "rgba(45, 212, 191, 0.18)");
        grad.addColorStop(1, "rgba(15, 23, 42, 0)");
      } else {
        grad.addColorStop(0, "rgba(244, 63, 94, 0.14)");
        grad.addColorStop(1, "rgba(15, 23, 42, 0)");
      }

      ctx.fillStyle = grad;
      ctx.fillRect(c.x - barWidth / 2, y, barWidth, volHeight);
    }

    ctx.restore();
  }

  calculateCandleData(t) {
    const data = [];
    const spacing = this.width / this.candleCount;

    for (let i = 0; i < this.candleCount; i++) {
      const x = (i + 0.5) * spacing;
      const centerY = this.getWaveY(x, t);
      const normX = i / this.candleCount;

      // Realistic market cycle pattern
      const isBull = (i % 6 !== 1 && i % 8 !== 3) || (normX > 0.68);
      
      // Dynamic candle spread
      const spreadVar = Math.sin(i * 1.8 + t * 1.4);
      const spread = 12 + Math.abs(spreadVar) * 20 + (normX > 0.7 ? 16 : 0);

      let openY, closeY, highY, lowY;

      if (isBull) {
        openY = centerY + spread * 0.45;
        closeY = centerY - spread * 0.45;
        highY = closeY - (6 + Math.abs(Math.sin(i * 2.5 + t)) * 12);
        lowY = openY + (6 + Math.abs(Math.cos(i * 2.1 + t)) * 10);
      } else {
        openY = centerY - spread * 0.42;
        closeY = centerY + spread * 0.42;
        highY = openY - (7 + Math.abs(Math.sin(i * 2.2 + t)) * 10);
        lowY = closeY + (7 + Math.abs(Math.cos(i * 1.8 + t)) * 12);
      }

      data.push({
        x,
        centerY,
        openY,
        closeY,
        highY,
        lowY,
        isBull,
        topBodyY: Math.min(openY, closeY),
        bottomBodyY: Math.max(openY, closeY),
        bodyHeight: Math.max(3, Math.abs(closeY - openY))
      });
    }

    return data;
  }

  drawRefinedCandlesticks(candleData) {
    const ctx = this.ctx;
    const spacing = this.width / this.candleCount;
    // Elegant, slender candle width
    const candleWidth = Math.max(5, spacing * 0.42);

    for (let i = 0; i < candleData.length; i++) {
      const c = candleData[i];
      ctx.save();

      if (c.isBull) {
        // --- 🟢 REFINED EMERALD / TEAL BULLISH CANDLESTICK ---
        // Hairline Wick
        ctx.strokeStyle = "rgba(45, 212, 191, 0.85)";
        ctx.lineWidth = 1.0;
        ctx.shadowColor = "rgba(45, 212, 191, 0.6)";
        ctx.shadowBlur = 6;

        ctx.beginPath();
        ctx.moveTo(c.x, c.highY);
        ctx.lineTo(c.x, c.lowY);
        ctx.stroke();

        // Sleek Translucent Glassmorphic Body
        const bodyGrad = ctx.createLinearGradient(c.x, c.topBodyY, c.x, c.bottomBodyY);
        bodyGrad.addColorStop(0, "rgba(56, 189, 248, 0.85)"); // Ice cyan highlight
        bodyGrad.addColorStop(1, "rgba(16, 185, 129, 0.75)"); // Deep emerald

        ctx.fillStyle = bodyGrad;
        ctx.strokeStyle = "rgba(94, 234, 212, 0.95)";
        ctx.lineWidth = 1.0;
        ctx.shadowColor = "rgba(45, 212, 191, 0.75)";
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.roundRect(c.x - candleWidth / 2, c.topBodyY, candleWidth, c.bodyHeight, 1.5);
        ctx.fill();
        ctx.stroke();

      } else {
        // --- 🔴 REFINED ROSE / CRIMSON BEARISH CANDLESTICK ---
        // Hairline Wick
        ctx.strokeStyle = "rgba(244, 63, 94, 0.8)";
        ctx.lineWidth = 1.0;
        ctx.shadowColor = "rgba(244, 63, 94, 0.5)";
        ctx.shadowBlur = 5;

        ctx.beginPath();
        ctx.moveTo(c.x, c.highY);
        ctx.lineTo(c.x, c.lowY);
        ctx.stroke();

        // Sleek Ruby Glass Body
        const bearGrad = ctx.createLinearGradient(c.x, c.topBodyY, c.x, c.bottomBodyY);
        bearGrad.addColorStop(0, "rgba(244, 63, 94, 0.75)");
        bearGrad.addColorStop(1, "rgba(190, 18, 60, 0.65)");

        ctx.fillStyle = bearGrad;
        ctx.strokeStyle = "rgba(251, 113, 133, 0.9)";
        ctx.lineWidth = 1.0;
        ctx.shadowColor = "rgba(244, 63, 94, 0.6)";
        ctx.shadowBlur = 8;

        ctx.beginPath();
        ctx.roundRect(c.x - candleWidth / 2, c.topBodyY, candleWidth, c.bodyHeight, 1.5);
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  drawMovingAverageSpline(candleData) {
    const ctx = this.ctx;
    if (candleData.length < 2) return;

    // 1. Primary Luminous EMA Spline Wave
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(candleData[0].x, candleData[0].centerY);

    for (let i = 1; i < candleData.length; i++) {
      const prev = candleData[i - 1];
      const curr = candleData[i];
      const midX = (prev.x + curr.x) / 2;
      const midY = (prev.centerY + curr.centerY) / 2;
      ctx.quadraticCurveTo(prev.x, prev.centerY, midX, midY);
    }

    // Glowing Neon Spline Gradient
    const splineGrad = ctx.createLinearGradient(0, 0, this.width, 0);
    splineGrad.addColorStop(0, "rgba(56, 189, 248, 0.6)");
    splineGrad.addColorStop(0.5, "rgba(45, 212, 191, 0.95)");
    splineGrad.addColorStop(1, "rgba(248, 250, 252, 1.0)");

    ctx.strokeStyle = splineGrad;
    ctx.lineWidth = 2.0;
    ctx.shadowColor = "#38bdf8";
    ctx.shadowBlur = 14;
    ctx.stroke();
    ctx.restore();

    // 2. Secondary Faster Dotted Ribbon
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(candleData[0].x, candleData[0].centerY - 6);

    for (let i = 1; i < candleData.length; i++) {
      const prev = candleData[i - 1];
      const curr = candleData[i];
      const midX = (prev.x + curr.x) / 2;
      const midY = (prev.centerY + curr.centerY) / 2 - 6;
      ctx.quadraticCurveTo(prev.x, prev.centerY - 6, midX, midY);
    }

    ctx.strokeStyle = "rgba(129, 140, 248, 0.35)";
    ctx.lineWidth = 1.0;
    ctx.setLineDash([3, 4]);
    ctx.stroke();
    ctx.restore();
  }

  drawMovingPhotons(t) {
    const ctx = this.ctx;
    ctx.save();

    for (let i = 0; i < this.photons.length; i++) {
      const p = this.photons[i];
      p.progress += p.speed;
      if (p.progress > 1.0) p.progress = 0;

      const px = p.progress * this.width;
      const py = this.getWaveY(px, t);

      // Glowing photon light head
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 12;
      ctx.fill();

      // Translucent halo
      ctx.beginPath();
      ctx.arc(px, py, p.size * 2, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = 0.4;
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    ctx.restore();
  }

  drawParticles() {
    const ctx = this.ctx;
    ctx.save();

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < 0) p.y = this.height;
      if (p.y > this.height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.fill();
    }

    ctx.restore();
  }

  animate() {
    this.time += 0.012;

    // Smooth mouse lerp
    this.mouseX += (this.targetMouseX - this.mouseX) * 0.035;
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.035;

    this.ctx.clearRect(0, 0, this.width, this.height);

    // Calculate Candle Positions
    const candleData = this.calculateCandleData(this.time);

    // 1. Subtle Financial Grid
    this.drawGrid();

    // 2. Multi-Layered Aurora Fluid Wave Meshes
    this.drawAuroraWaveRibbons(this.time);

    // 3. Translucent Volume Profile Histogram
    this.drawVolumeHistogram(candleData, this.time);

    // 4. Luminous Double EMA Splines
    this.drawMovingAverageSpline(candleData);

    // 5. Refined Emerald / Ruby Glass Candlesticks with Hairline Wicks
    this.drawRefinedCandlesticks(candleData);

    // 6. Moving Photons along the Wave
    this.drawMovingPhotons(this.time);

    // 7. Ambient Financial Particle Field
    this.drawParticles();

    requestAnimationFrame(() => this.animate());
  }
}

// Auto-initialize on load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.tradingWaveBackground = new TradingWaveCanvas();
  });
} else {
  window.tradingWaveBackground = new TradingWaveCanvas();
}
