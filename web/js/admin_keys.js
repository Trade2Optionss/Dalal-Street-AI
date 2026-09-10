/**
 * TRADE2OPTIONS — Admin Key Generation & Client Control Center
 */

(function () {
  document.addEventListener("DOMContentLoaded", () => {
    initAdminKeyManager();
  });

  function initAdminKeyManager() {
    const adminNavTab = document.getElementById("adminKeysNavTab");
    const issueForm = document.getElementById("adminIssueKeyForm");
    const testForm = document.getElementById("adminTestKeyForm");
    const copyResultBtn = document.getElementById("adminCopyNewKeyBtn");

    if (adminNavTab) {
      adminNavTab.addEventListener("click", () => {
        loadAdminLicenses();
      });
    }

    if (issueForm) {
      issueForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const clientName = document.getElementById("adminClientName").value.trim();
        const email = document.getElementById("adminClientEmail").value.trim();
        const tier = document.getElementById("adminClientTier").value;
        const days = parseInt(document.getElementById("adminClientDays").value, 10) || 90;
        const hwid = document.getElementById("adminClientHwid").value.trim() || "ANY";
        const issueBtn = document.getElementById("adminSubmitIssueBtn");

        if (!clientName) {
          alert("Please enter a client name.");
          return;
        }

        issueBtn.disabled = true;
        issueBtn.innerHTML = `Generating Signed Token...`;

        try {
          const res = await fetch("/api/licenses/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              client_name: clientName,
              email: email,
              tier: tier,
              duration_days: days,
              hwid: hwid
            })
          });
          const data = await res.json();

          if (data.success && data.license) {
            showGeneratedKeyResult(data.license);
            loadAdminLicenses();
            issueForm.reset();
            document.getElementById("adminClientHwid").value = "ANY";
            document.getElementById("adminClientDays").value = "90";
          } else {
            alert("Error: " + (data.message || "Failed to generate key"));
          }
        } catch (err) {
          alert("Network error: " + err);
        } finally {
          issueBtn.disabled = false;
          issueBtn.innerHTML = `<i data-lucide="sparkles" style="width:16px;height:16px;"></i> Issue Cryptographic License Key`;
          if (window.lucide) lucide.createIcons();
        }
      });
    }

    if (testForm) {
      testForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const key = document.getElementById("adminTestKeyInput").value.trim();
        const resultEl = document.getElementById("adminTestResultBox");
        if (!key) return;

        try {
          const res = await fetch("/api/licenses/validate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ license_key: key })
          });
          const data = await res.json();
          resultEl.style.display = "block";
          if (data.valid) {
            resultEl.style.background = "rgba(16, 185, 129, 0.15)";
            resultEl.style.borderColor = "#10b981";
            resultEl.style.color = "#6ee7b7";
            resultEl.innerHTML = `
              <div style="font-weight:800; display:flex; align-items:center; gap:6px;">
                <i data-lucide="check-circle" style="width:16px;height:16px;"></i> VALID & ACTIVE
              </div>
              <div style="font-size:0.8rem; margin-top:4px;">
                Client: <strong>${data.client_name}</strong> | Tier: <strong>${data.tier}</strong> | Role: <strong>${data.role || 'USER'}</strong>
              </div>
            `;
          } else {
            resultEl.style.background = "rgba(239, 68, 68, 0.15)";
            resultEl.style.borderColor = "#ef4444";
            resultEl.style.color = "#fca5a5";
            resultEl.innerHTML = `
              <div style="font-weight:800; display:flex; align-items:center; gap:6px;">
                <i data-lucide="alert-circle" style="width:16px;height:16px;"></i> INVALID KEY
              </div>
              <div style="font-size:0.8rem; margin-top:4px;">${data.message || 'Verification failed.'}</div>
            `;
          }
          if (window.lucide) lucide.createIcons();
        } catch (err) {
          alert("Test error: " + err);
        }
      });
    }

    if (copyResultBtn) {
      copyResultBtn.addEventListener("click", () => {
        const keyText = document.getElementById("adminGeneratedKeyDisplay").textContent.trim();
        if (!keyText) return;
        navigator.clipboard.writeText(keyText).then(() => {
          copyResultBtn.innerHTML = `<i data-lucide="check" style="width:14px;height:14px;"></i> Copied!`;
          if (window.lucide) lucide.createIcons();
          setTimeout(() => {
            copyResultBtn.innerHTML = `<i data-lucide="copy" style="width:14px;height:14px;"></i> Copy Key`;
            if (window.lucide) lucide.createIcons();
          }, 2000);
        });
      });
    }

    // Load initial
    loadAdminLicenses();
  }

  function showGeneratedKeyResult(lic) {
    const box = document.getElementById("adminNewKeyBox");
    const display = document.getElementById("adminGeneratedKeyDisplay");
    const meta = document.getElementById("adminGeneratedKeyMeta");

    if (display) display.textContent = lic.key;
    if (meta) {
      meta.textContent = `${lic.client_name} • ${lic.tier} • Expires ${lic.expires_at.split('T')[0]}`;
    }
    if (box) box.classList.add("show");
    if (window.lucide) lucide.createIcons();
  }

  async function loadAdminLicenses() {
    const tbody = document.getElementById("adminLicensesTbody");
    const kpiTotal = document.getElementById("adminKpiTotal");
    const kpiActive = document.getElementById("adminKpiActive");
    if (!tbody) return;

    try {
      const res = await fetch("/api/licenses/list");
      if (!res.ok) return;
      const data = await res.json();
      const licenses = data.licenses || [];

      if (kpiTotal) kpiTotal.textContent = data.total || licenses.length;
      if (kpiActive) kpiActive.textContent = data.active || licenses.filter(l => l.status === 'ACTIVE').length;

      if (licenses.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:24px; color:#64748b;">No licenses issued yet. Use the form above to issue your first key.</td></tr>`;
        return;
      }

      tbody.innerHTML = licenses.map(l => {
        const isActive = l.status === "ACTIVE";
        const shortKey = l.key.length > 32 ? l.key.substring(0, 24) + '...' + l.key.slice(-8) : l.key;
        const expDate = l.expires_at ? l.expires_at.split('T')[0] : 'Never';
        return `
          <tr>
            <td>
              <div style="font-weight:700; color:#fff;">${escapeHtml(l.client_name)}</div>
              <div style="font-size:0.75rem; color:#94a3b8;">${escapeHtml(l.email || '')}</div>
            </td>
            <td>
              <div style="display:flex; align-items:center; gap:6px;">
                <code style="font-family:'JetBrains Mono',monospace; font-size:0.8rem; color:#fbbf24;">${escapeHtml(shortKey)}</code>
                <button onclick="window.copyAdminKey('${escapeHtml(l.key)}')" style="background:transparent; border:none; color:#94a3b8; cursor:pointer; padding:2px;" title="Copy Full Key">
                  <i data-lucide="copy" style="width:13px;height:13px;"></i>
                </button>
              </div>
            </td>
            <td><span style="color:#38bdf8; font-weight:600;">${escapeHtml(l.tier)}</span></td>
            <td><span style="font-family:'JetBrains Mono',monospace; font-size:0.8rem; color:#cbd5e1;">${expDate}</span></td>
            <td>
              <span class="lic-status-badge ${isActive ? 'active' : 'revoked'}">
                <i data-lucide="${isActive ? 'check-circle' : 'x-circle'}" style="width:12px;height:12px;"></i>
                ${l.status}
              </span>
            </td>
            <td>
              <button onclick="window.toggleAdminLicenseRevoke('${escapeHtml(l.key)}')" style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); color:#e2e8f0; border-radius:6px; padding:4px 8px; font-size:0.75rem; cursor:pointer;">
                ${isActive ? 'Revoke' : 'Reactivate'}
              </button>
            </td>
          </tr>
        `;
      }).join("");

      if (window.lucide) lucide.createIcons();
    } catch (e) {
      console.warn("Failed to load licenses list:", e);
    }
  }

  window.copyAdminKey = function (fullKey) {
    navigator.clipboard.writeText(fullKey).then(() => {
      alert("License Key copied to clipboard!");
    });
  };

  window.toggleAdminLicenseRevoke = async function (key) {
    if (!confirm(`Toggle status for key: ${key}?`)) return;
    try {
      const res = await fetch("/api/licenses/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ license_key: key })
      });
      if (res.ok) {
        loadAdminLicenses();
      }
    } catch (e) {
      alert("Error revoking: " + e);
    }
  };

  function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  window.AdminKeyManager = {
    loadAdminLicenses
  };
})();
