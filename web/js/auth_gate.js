/**
 * TRADE2OPTIONS — License Key & HWID Client Authentication Controller
 */

(function () {
  const STORAGE_KEY = "t2o_license_session";
  let detectedHwid = "";

  document.addEventListener("DOMContentLoaded", () => {
    initAuthGate();
  });

  async function initAuthGate() {
    const gateWrapper = document.getElementById("t2oAuthGate");
    if (!gateWrapper) return;

    // 1. Fetch system Hardware ID
    fetchHWID();

    // 2. Check if already authenticated
    const savedSession = getSavedSession();
    if (savedSession && savedSession.license_key) {
      // Background verify
      const isValid = await verifyKey(savedSession.license_key, false);
      if (isValid) {
        unlockTerminal(savedSession, false);
        return;
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    // Otherwise keep gate visible
    gateWrapper.classList.remove("hidden");
    if (window.lucide) lucide.createIcons();

    // Attach listeners
    setupEventListeners();
  }

  function getSavedSession() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  async function fetchHWID() {
    try {
      const res = await fetch("/api/licenses/my-hwid");
      if (res.ok) {
        const data = await res.json();
        detectedHwid = data.hwid || "";
        const hwidEl = document.getElementById("authHwidVal");
        if (hwidEl) hwidEl.textContent = detectedHwid;
      }
    } catch (e) {
      console.warn("HWID detection notice:", e);
    }
  }

  function setupEventListeners() {
    const form = document.getElementById("authGateForm");
    const keyInput = document.getElementById("authLicenseKeyInput");
    const pasteBtn = document.getElementById("authPasteKeyBtn");
    const copyHwidBtn = document.getElementById("authCopyHwidBtn");
    const demoToggle = document.getElementById("authDemoToggle");
    const demoChips = document.getElementById("authDemoChips");

    if (keyInput) {
      keyInput.addEventListener("input", (e) => {
        if (!keyInput.value.startsWith("T2O-SIG") && !keyInput.value.includes(".")) {
          keyInput.value = keyInput.value.toUpperCase();
        }
        hideAlert();
      });
    }

    if (pasteBtn && keyInput) {
      pasteBtn.addEventListener("click", async () => {
        try {
          const text = await navigator.clipboard.readText();
          if (text) {
            const cleanText = text.trim();
            keyInput.value = (!cleanText.startsWith("T2O-SIG") && !cleanText.includes(".")) ? cleanText.toUpperCase() : cleanText;
            hideAlert();
          }
        } catch (err) {
          showAlert("Clipboard access denied. Please paste manually.", "error");
        }
      });
    }

    if (copyHwidBtn) {
      copyHwidBtn.addEventListener("click", () => {
        if (!detectedHwid) return;
        navigator.clipboard.writeText(detectedHwid).then(() => {
          const originalText = copyHwidBtn.innerHTML;
          copyHwidBtn.innerHTML = `<i data-lucide="check" style="width:14px;height:14px;"></i> Copied!`;
          if (window.lucide) lucide.createIcons();
          setTimeout(() => {
            copyHwidBtn.innerHTML = originalText;
            if (window.lucide) lucide.createIcons();
          }, 2000);
        });
      });
    }

    if (demoToggle && demoChips) {
      demoToggle.addEventListener("click", () => {
        demoChips.style.display = demoChips.style.display === "none" ? "flex" : "none";
      });

      document.querySelectorAll(".auth-chip").forEach((chip) => {
        chip.addEventListener("click", () => {
          const key = chip.getAttribute("data-key");
          if (key && keyInput) {
            keyInput.value = key;
            hideAlert();
          }
        });
      });
    }

    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        let key = keyInput ? keyInput.value.trim() : "";
        if (!key) {
          showAlert("Please enter your Trade2Options license key.", "error");
          return;
        }
        if (!key.startsWith("T2O-SIG") && !key.includes(".")) {
          key = key.toUpperCase();
        }
        await verifyKey(key, true);
      });
    }

    // Delegate logout button in dashboard
    document.addEventListener("click", (e) => {
      if (e.target && e.target.closest("#authLogoutBtn")) {
        lockTerminal();
      }
    });
  }

  async function verifyKey(licenseKey, isInteractive = true) {
    const submitBtn = document.getElementById("authSubmitBtn");
    const spinner = document.getElementById("authSpinner");
    const btnText = document.getElementById("authBtnText");

    if (isInteractive && submitBtn) {
      submitBtn.disabled = true;
      if (spinner) spinner.style.display = "inline-block";
      if (btnText) btnText.textContent = "Verifying Cryptographic Binding...";
    }

    try {
      const res = await fetch("/api/licenses/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          license_key: licenseKey,
          hwid: detectedHwid
        })
      });

      const data = await res.json();

      if (data.valid) {
        const isAdmin = Boolean(data.is_admin || data.role === "ADMIN");
        const sessionPayload = {
          license_key: licenseKey,
          client_name: data.client_name,
          tier: data.tier,
          role: data.role || (isAdmin ? "ADMIN" : "USER"),
          is_admin: isAdmin,
          expires_at: data.expires_at,
          modules: data.modules || [],
          hwid: detectedHwid,
          authenticated_at: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionPayload));

        if (isInteractive) {
          playUnlockSequence(sessionPayload);
        } else {
          unlockTerminal(sessionPayload, false);
        }
        return true;
      } else {
        if (isInteractive) {
          showAlert(data.message || "Invalid or unauthorized license key.", "error");
        }
        return false;
      }
    } catch (err) {
      if (isInteractive) {
        showAlert("Server connection failed. Make sure the server is active.", "error");
      }
      return false;
    } finally {
      if (isInteractive && submitBtn) {
        submitBtn.disabled = false;
        if (spinner) spinner.style.display = "none";
        if (btnText) btnText.textContent = "Authenticate & Enter Terminal";
      }
    }
  }

  function playUnlockSequence(session) {
    const formCard = document.getElementById("authFormCard");
    const unlockedCard = document.getElementById("authUnlockedCard");
    const progressFill = document.getElementById("authProgressFill");

    if (formCard) formCard.style.display = "none";
    if (unlockedCard) {
      unlockedCard.classList.add("show");
      document.getElementById("authClientName").textContent = session.client_name || "Authorized Trader";
      document.getElementById("authClientTier").textContent = session.is_admin ? "System Administrator (Key Manager)" : (session.tier || "Institutional Access");
    }

    if (window.lucide) lucide.createIcons();

    setTimeout(() => {
      if (progressFill) progressFill.style.width = "100%";
    }, 100);

    setTimeout(() => {
      unlockTerminal(session, true);
    }, 1400);
  }

  function unlockTerminal(session, animate = true) {
    const gateWrapper = document.getElementById("t2oAuthGate");
    if (gateWrapper) {
      if (animate) {
        gateWrapper.classList.add("hidden");
      } else {
        gateWrapper.style.display = "none";
      }
    }

    // Toggle Admin Navigation Tab visibility
    const adminNavTab = document.getElementById("adminKeysNavTab");
    const isAdmin = Boolean(session && (session.is_admin || session.role === "ADMIN"));
    if (adminNavTab) {
      if (isAdmin) {
        adminNavTab.style.display = "inline-flex";
      } else {
        adminNavTab.style.display = "none";
      }
    }

    // Inject active session pill in navbar
    renderNavSessionPill(session);
  }

  function lockTerminal() {
    localStorage.removeItem(STORAGE_KEY);
    const gateWrapper = document.getElementById("t2oAuthGate");
    const formCard = document.getElementById("authFormCard");
    const unlockedCard = document.getElementById("authUnlockedCard");
    const progressFill = document.getElementById("authProgressFill");

    if (formCard) formCard.style.display = "flex";
    if (unlockedCard) unlockedCard.classList.remove("show");
    if (progressFill) progressFill.style.width = "0%";

    const pill = document.getElementById("userSessionPill");
    if (pill) pill.remove();

    // Hide admin tab on lock
    const adminNavTab = document.getElementById("adminKeysNavTab");
    if (adminNavTab) {
      adminNavTab.style.display = "none";
    }

    // Reset view to launchpad
    const adminView = document.getElementById("view-admin-keys");
    if (adminView && adminView.classList.contains("active")) {
      adminView.classList.remove("active");
      const launchpad = document.getElementById("view-launchpad");
      if (launchpad) launchpad.classList.add("active");
    }

    if (gateWrapper) {
      gateWrapper.style.display = "flex";
      gateWrapper.classList.remove("hidden");
    }
    if (window.lucide) lucide.createIcons();
  }

  function renderNavSessionPill(session) {
    const headerActions = document.querySelector(".header-actions");
    if (!headerActions) return;

    let pill = document.getElementById("userSessionPill");
    if (!pill) {
      pill = document.createElement("div");
      pill.id = "userSessionPill";
      pill.className = "t2o-user-session-badge";
      headerActions.prepend(pill);
    }

    const isAdmin = Boolean(session && (session.is_admin || session.role === "ADMIN"));
    const shortTier = isAdmin ? "ADMIN" : (session.tier || "PRO").split(" ")[0].toUpperCase();
    const tierBadgeStyle = isAdmin 
      ? 'background:rgba(245,158,11,0.25); color:#fbbf24; border:1px solid #f59e0b; font-weight:900;'
      : '';

    pill.innerHTML = `
      <i data-lucide="${isAdmin ? 'shield-alert' : 'shield-check'}" style="width:16px;height:16px;color:${isAdmin ? '#f59e0b' : '#10b981'};"></i>
      <span style="font-weight:700;">${session.client_name || "Trader"}</span>
      <span class="user-tier" style="${tierBadgeStyle}">${shortTier}</span>
      <button class="btn-logout" id="authLogoutBtn" title="Lock & Disconnect License">
        <i data-lucide="log-out" style="width:14px;height:14px;"></i>
      </button>
    `;
    if (window.lucide) lucide.createIcons();
  }

  function showAlert(msg, type = "error") {
    const alertBox = document.getElementById("authAlert");
    if (!alertBox) return;
    alertBox.className = `auth-alert show ${type}`;
    alertBox.innerHTML = `
      <i data-lucide="${type === 'error' ? 'alert-circle' : 'check-circle'}" style="width:18px;height:18px;flex-shrink:0;"></i>
      <span>${msg}</span>
    `;
    if (window.lucide) lucide.createIcons();
  }

  function hideAlert() {
    const alertBox = document.getElementById("authAlert");
    if (alertBox) {
      alertBox.className = "auth-alert";
      alertBox.innerHTML = "";
    }
  }

  // Expose global controller
  window.T2OAuth = {
    verifyKey,
    lockTerminal,
    getSavedSession
  };
})();
