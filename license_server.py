#!/usr/bin/env python3
"""
Trade2Options - Dalal Street AI
Dedicated License Key & HWID Authority Server
Runs independently on port 8060 (separate from the public trading dashboard on port 8050).
"""

import sys
import os
import json
import secrets
import hashlib
import platform
import uuid
import datetime as dt
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

WORKSPACE_ROOT = Path(__file__).resolve().parent
DATA_CACHE = WORKSPACE_ROOT / "data_cache"
DATA_CACHE.mkdir(exist_ok=True)
LICENSES_FILE = DATA_CACHE / "licenses.json"
WEB_DIR = WORKSPACE_ROOT / "web"

app = FastAPI(
    title="Trade2Options License & HWID Authority",
    description="Independent administrative server for managing cryptographic license keys and HWID node locks.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request / Response Schemas
class GenerateLicenseRequest(BaseModel):
    client_name: str
    email: str
    tier: str = "Trader Pro (Quarterly)"
    hwid: Optional[str] = None
    max_seats: int = 1
    duration_days: int = 90
    modules: Optional[List[str]] = None

class ValidateLicenseRequest(BaseModel):
    license_key: str
    hwid: Optional[str] = None

class RevokeLicenseRequest(BaseModel):
    license_key: str

def get_system_hwid() -> str:
    """Computes a deterministic machine Hardware ID (HWID/HUID) fingerprint."""
    mac = uuid.getnode()
    raw = f"{platform.node()}-{platform.machine()}-{mac}"
    h = hashlib.sha256(raw.encode()).hexdigest().upper()
    return f"HWID-{h[:4]}-{h[4:8]}-{h[8:12]}-{h[12:16]}"

def load_licenses_db() -> List[Dict[str, Any]]:
    if not LICENSES_FILE.exists():
        initial = [
            {
                "key": "T2O-ENT-6E9D-0D48-AC8F",
                "client_name": "Rohan Gupta",
                "email": "rohan@trade2options.com",
                "tier": "Enterprise Lifetime",
                "hwid": get_system_hwid(),
                "status": "ACTIVE",
                "created_at": "2026-09-07T15:17:19.668591",
                "expires_at": "2035-12-31T23:59:59",
                "max_seats": 1,
                "active_seats": 1,
                "modules": [
                    "NSE/BSE Indian Live Terminal",
                    "Multi-Agent AI Debate Arena",
                    "Discord Webhook Broadcast",
                    "MT5 TrendPullback EA Bot",
                    "Options Chain PCR Radar"
                ]
            },
            {
                "key": "T2O-PRO-8F29-A4C1-7290",
                "client_name": "Ankit Kumar",
                "email": "ankit.trader@gmail.com",
                "tier": "Enterprise Lifetime",
                "hwid": get_system_hwid(),
                "status": "ACTIVE",
                "created_at": "2026-09-01T09:15:00",
                "expires_at": "2030-12-31T23:59:59",
                "max_seats": 5,
                "active_seats": 1,
                "modules": [
                    "NSE/BSE Indian Live Terminal",
                    "Multi-Agent AI Debate Arena",
                    "Discord Webhook Broadcast",
                    "MT5 TrendPullback EA Bot",
                    "Options Chain PCR Radar"
                ]
            },
            {
                "key": "T2O-MST-41B9-72E0-9941",
                "client_name": "Vikram Malhotra",
                "email": "vikram.m@dalalstreet.in",
                "tier": "Mastery Annual",
                "hwid": "HWID-84F1-92A3-C012-77EA",
                "status": "ACTIVE",
                "created_at": "2026-08-15T11:30:00",
                "expires_at": "2027-08-15T23:59:59",
                "max_seats": 2,
                "active_seats": 1,
                "modules": [
                    "NSE/BSE Indian Live Terminal",
                    "Multi-Agent AI Debate Arena",
                    "Discord Webhook Broadcast"
                ]
            },
            {
                "key": "T2O-TRL-10A2-54D8-3318",
                "client_name": "Siddharth Verma",
                "email": "siddharth.v@outlook.com",
                "tier": "7-Day Free Trial",
                "hwid": "HWID-39D0-61F4-BA98-2104",
                "status": "ACTIVE",
                "created_at": "2026-09-05T14:00:00",
                "expires_at": "2026-09-12T23:59:59",
                "max_seats": 1,
                "active_seats": 1,
                "modules": [
                    "NSE/BSE Indian Live Terminal",
                    "Options Chain PCR Radar"
                ]
            }
        ]
        save_licenses_db(initial)
        return initial

    try:
        with open(LICENSES_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("licenses", [])
    except Exception as e:
        print(f"Error reading licenses DB: {e}")
        return []

def save_licenses_db(licenses: List[Dict[str, Any]]):
    try:
        with open(LICENSES_FILE, "w", encoding="utf-8") as f:
            json.dump({"licenses": licenses}, f, indent=2)
    except Exception as e:
        print(f"Error saving licenses DB: {e}")

# Static and Page Routes
@app.get("/")
async def root():
    """Serves the institutional License Key & HWID Management UI."""
    license_page = WEB_DIR / "licenses.html"
    if license_page.exists():
        return FileResponse(license_page)
    return JSONResponse({"status": "error", "message": "licenses.html not found"}, status_code=404)

@app.get("/licenses.html")
async def licenses_page():
    return await root()

@app.get("/health")
async def health_check():
    return {
        "status": "online",
        "service": "Trade2Options License Authority Server",
        "port": 8060,
        "hwid": get_system_hwid()
    }

# API Endpoints
@app.get("/api/licenses/my-hwid")
async def get_my_hwid():
    """Returns detected system Hardware ID (HWID / HUID) for 1-click machine binding."""
    hwid = get_system_hwid()
    return {
        "hwid": hwid,
        "platform": platform.platform(),
        "node": platform.node(),
        "machine": platform.machine(),
        "instructions": {
            "python": "python3 -c \"import uuid, hashlib, platform; mac=uuid.getnode(); h=hashlib.sha256(f'{platform.node()}-{platform.machine()}-{mac}'.encode()).hexdigest().upper(); print(f'HWID-{h[:4]}-{h[4:8]}-{h[8:12]}-{h[12:16]}')\"",
            "bash": "echo \"HWID-$(echo -n $(hostname)-$(uname -m) | shasum -a 256 | head -c 16 | tr '[:lower:]' '[:upper:]')\""
        }
    }

@app.get("/api/licenses/list")
async def list_licenses():
    """Returns all active, trial, and enterprise client license keys."""
    licenses = load_licenses_db()
    total_count = len(licenses)
    active_count = sum(1 for l in licenses if l.get("status") == "ACTIVE")
    now_iso = datetime.now().isoformat()
    return {
        "total": total_count,
        "active": active_count,
        "licenses": licenses,
        "server_hwid": get_system_hwid(),
        "timestamp": now_iso
    }

@app.post("/api/licenses/generate")
async def generate_license(req: GenerateLicenseRequest):
    """Generates and registers a new cryptographically formatted license key bound to HWID."""
    tier_prefix = "PRO"
    if "trial" in req.tier.lower():
        tier_prefix = "TRL"
    elif "mastery" in req.tier.lower() or "annual" in req.tier.lower():
        tier_prefix = "MST"
    elif "enterprise" in req.tier.lower() or "lifetime" in req.tier.lower():
        tier_prefix = "ENT"

    token = secrets.token_hex(6).upper()
    license_key = f"T2O-{tier_prefix}-{token[:4]}-{token[4:8]}-{token[8:12]}"

    now = datetime.now()
    if req.duration_days >= 3650:
        expires_at = datetime(2035, 12, 31, 23, 59, 59).isoformat()
    else:
        expires_at = (now + dt.timedelta(days=req.duration_days)).isoformat()

    default_modules = [
        "NSE/BSE Indian Live Terminal",
        "Multi-Agent AI Debate Arena",
        "Discord Webhook Broadcast"
    ]
    if tier_prefix in ["ENT", "MST"]:
        default_modules.extend(["MT5 TrendPullback EA Bot", "Options Chain PCR Radar"])

    new_lic = {
        "key": license_key,
        "client_name": req.client_name.strip(),
        "email": req.email.strip().lower(),
        "tier": req.tier,
        "hwid": (req.hwid.strip().upper() if req.hwid else get_system_hwid()),
        "status": "ACTIVE",
        "created_at": now.isoformat(),
        "expires_at": expires_at,
        "max_seats": req.max_seats,
        "active_seats": 1,
        "modules": req.modules or default_modules
    }

    licenses = load_licenses_db()
    licenses.insert(0, new_lic)
    save_licenses_db(licenses)

    return {
        "success": True,
        "license": new_lic,
        "message": f"License key {license_key} successfully generated and bound to HWID {new_lic['hwid']}."
    }

@app.post("/api/licenses/validate")
async def validate_license(req: ValidateLicenseRequest):
    """Validates license key and HWID / HUID binding for client authentication."""
    licenses = load_licenses_db()
    key_clean = req.license_key.strip().upper()

    match = next((l for l in licenses if l["key"].upper() == key_clean), None)
    if not match:
        return {
            "valid": False,
            "status": "NOT_FOUND",
            "message": "Invalid license key. Please check spelling or contact support."
        }

    if match.get("status") != "ACTIVE":
        return {
            "valid": False,
            "status": match.get("status", "REVOKED"),
            "message": f"License key is {match.get('status')}."
        }

    # Expiry Check
    try:
        exp = datetime.fromisoformat(match["expires_at"])
        if datetime.now() > exp:
            return {
                "valid": False,
                "status": "EXPIRED",
                "message": f"License expired on {exp.strftime('%d %b %Y')}."
            }
    except Exception:
        pass

    # HWID Hardware ID Verification
    if req.hwid:
        req_hwid_clean = req.hwid.strip().upper()
        lic_hwid = (match.get("hwid") or "").strip().upper()
        if lic_hwid and lic_hwid != req_hwid_clean and lic_hwid != "ANY":
            return {
                "valid": False,
                "status": "HWID_MISMATCH",
                "message": f"License is locked to Hardware ID {lic_hwid}. Contact admin to reset binding.",
                "bound_hwid": lic_hwid,
                "request_hwid": req_hwid_clean
            }

    return {
        "valid": True,
        "status": "ACTIVE",
        "client_name": match["client_name"],
        "tier": match["tier"],
        "expires_at": match["expires_at"],
        "modules": match.get("modules", []),
        "message": "License key verified and active."
    }

@app.post("/api/licenses/revoke")
async def revoke_license(req: RevokeLicenseRequest):
    """Toggles license status between ACTIVE and REVOKED."""
    licenses = load_licenses_db()
    key_clean = req.license_key.strip().upper()

    match = next((l for l in licenses if l["key"].upper() == key_clean), None)
    if not match:
        raise HTTPException(status_code=404, detail="License key not found")

    new_status = "REVOKED" if match.get("status") == "ACTIVE" else "ACTIVE"
    match["status"] = new_status
    save_licenses_db(licenses)

    return {
        "success": True,
        "license_key": key_clean,
        "new_status": new_status,
        "message": f"License {key_clean} status updated to {new_status}."
    }

if __name__ == "__main__":
    port = int(os.environ.get("LICENSE_PORT", 8060))
    print("=" * 70)
    print(f" TRADE2OPTIONS — LICENSE KEY & HWID AUTHORITY SERVER")
    print(f" Admin Dashboard:  http://127.0.0.1:{port}/")
    print(f" Public Terminal:  http://127.0.0.1:8050/")
    print(f" Current HWID:     {get_system_hwid()}")
    print("=" * 70)
    uvicorn.run("license_server:app", host="0.0.0.0", port=port, reload=True)
