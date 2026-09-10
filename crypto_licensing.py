"""
Trade2Options - Dalal Street AI
Cryptographic License Key Engine (HMAC-SHA256 Signed Tokens)
Production-Ready Zero-Database Offline/Online License Verification
"""

import os
import json
import base64
import hmac
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, Tuple

# Master Secret Key: Set this in Render / Production environment variables
# as LICENSE_SECRET_KEY for enterprise security.
LICENSE_SECRET_KEY = os.getenv(
    "LICENSE_SECRET_KEY", 
    "T2O_DALAL_STREET_ENTERPRISE_SECRET_KEY_PROD_2026_98F7A1"
)

DEFAULT_MODULES_BY_TIER = {
    "Enterprise Lifetime": [
        "NSE/BSE Indian Live Terminal",
        "Multi-Agent AI Debate Arena",
        "Discord Webhook Broadcast",
        "MT5 TrendPullback EA Bot",
        "Options Chain PCR Radar",
        "Institutional Order Book Radar"
    ],
    "Mastery Annual": [
        "NSE/BSE Indian Live Terminal",
        "Multi-Agent AI Debate Arena",
        "Discord Webhook Broadcast",
        "MT5 TrendPullback EA Bot"
    ],
    "Trader Pro (Quarterly)": [
        "NSE/BSE Indian Live Terminal",
        "Multi-Agent AI Debate Arena",
        "Discord Webhook Broadcast"
    ],
    "7-Day Free Trial": [
        "NSE/BSE Indian Live Terminal",
        "Options Chain PCR Radar"
    ]
}

def generate_signed_license(
    client_name: str,
    tier: str = "Trader Pro (Quarterly)",
    duration_days: int = 90,
    email: str = "",
    hwid: str = "ANY",
    custom_modules: Optional[list] = None
) -> Dict[str, Any]:
    """
    Generates a tamper-proof cryptographically signed license key containing
    its own self-contained verifiable payload.
    """
    client_clean = client_name.strip()
    tier_clean = tier.strip()
    now = datetime.now()

    if duration_days >= 3650:
        expires_at = "2035-12-31T23:59:59"
    else:
        expires_at = (now + timedelta(days=duration_days)).isoformat()

    # Determine Tier code
    tier_lower = tier_clean.lower()
    if "enterprise" in tier_lower or "lifetime" in tier_lower:
        tier_code = "ENT"
    elif "mastery" in tier_lower or "annual" in tier_lower:
        tier_code = "MST"
    elif "trial" in tier_lower:
        tier_code = "TRL"
    else:
        tier_code = "PRO"

    # Compact payload
    payload = {
        "sub": client_clean,
        "em": email.strip().lower() if email else "",
        "tr": tier_clean,
        "tc": tier_code,
        "exp": expires_at,
        "hw": (hwid.strip().upper() if hwid else "ANY"),
        "iat": now.strftime("%Y-%m-%d"),
        "rnd": secrets.token_hex(4).upper()
    }

    # URL-Safe Base64 JSON Payload
    json_bytes = json.dumps(payload, separators=(',', ':'), sort_keys=True).encode("utf-8")
    b64_payload = base64.urlsafe_b64encode(json_bytes).decode("ascii").rstrip("=")

    # Cryptographic HMAC-SHA256 Signature (16-char hex digest)
    sig_raw = hmac.new(
        LICENSE_SECRET_KEY.encode("utf-8"),
        b64_payload.encode("utf-8"),
        hashlib.sha256
    ).hexdigest().upper()
    signature = sig_raw[:16]

    # Formatted Key: T2O-SIG.<payload>.<signature>
    license_key = f"T2O-SIG.{b64_payload}.{signature}"

    modules = custom_modules or DEFAULT_MODULES_BY_TIER.get(tier_clean, DEFAULT_MODULES_BY_TIER["Trader Pro (Quarterly)"])

    return {
        "license_key": license_key,
        "client_name": client_clean,
        "tier": tier_clean,
        "tier_code": tier_code,
        "expires_at": expires_at,
        "hwid": payload["hw"],
        "modules": modules,
        "created_at": now.isoformat()
    }

def verify_signed_license(
    license_key: str, 
    request_hwid: Optional[str] = None
) -> Tuple[bool, Dict[str, Any]]:
    """
    Verifies a cryptographically signed license key completely offline without a database.
    Returns (is_valid: bool, details_dict: dict).
    """
    key_clean = license_key.strip()

    # Check key structure
    # Supports "T2O-SIG.<payload>.<sig>" or "T2O-SIG-<payload>-<sig>"
    separator = "." if "." in key_clean else "-"
    parts = key_clean.split(separator)

    # Valid signed keys have at least 3 parts: [Prefix, Payload, Signature]
    if len(parts) < 3 or not parts[0].startswith("T2O"):
        return False, {
            "status": "NOT_FOUND",
            "message": "Invalid license key format. Please verify characters."
        }

    b64_payload = parts[1]
    expected_sig = parts[2].upper()

    # 1. Verify HMAC Signature
    computed_sig_raw = hmac.new(
        LICENSE_SECRET_KEY.encode("utf-8"),
        b64_payload.encode("utf-8"),
        hashlib.sha256
    ).hexdigest().upper()
    computed_sig = computed_sig_raw[:16]

    if not hmac.compare_digest(computed_sig, expected_sig):
        return False, {
            "status": "SIGNATURE_INVALID",
            "message": "Cryptographic signature mismatch. License key has been tampered with or is unauthorized."
        }

    # 2. Decode and parse payload
    try:
        # Re-add base64 padding if necessary
        missing_padding = len(b64_payload) % 4
        if missing_padding:
            b64_payload_padded = b64_payload + '=' * (4 - missing_padding)
        else:
            b64_payload_padded = b64_payload
        raw_json = base64.urlsafe_b64decode(b64_payload_padded.encode("ascii")).decode("utf-8")
        payload = json.loads(raw_json)
    except Exception as e:
        return False, {
            "status": "PAYLOAD_CORRUPT",
            "message": f"Malformed cryptographic payload: {e}"
        }

    client_name = payload.get("sub", "Authorized Client")
    tier = payload.get("tr", "Trader Pro")
    expires_at = payload.get("exp", "")
    lic_hwid = payload.get("hw", "ANY").upper()

    # 3. Verify Expiry
    if expires_at:
        try:
            exp_date = datetime.fromisoformat(expires_at)
            if datetime.now() > exp_date:
                return False, {
                    "status": "EXPIRED",
                    "client_name": client_name,
                    "tier": tier,
                    "expires_at": expires_at,
                    "message": f"License for {client_name} expired on {exp_date.strftime('%d %b %Y')}."
                }
        except Exception:
            pass

    # 4. Verify HWID (if not ANY and not in cloud container environment)
    is_cloud_env = bool(
        os.getenv("RENDER") or 
        os.getenv("PORT") or 
        os.getenv("DYNO") or 
        os.getenv("RAILWAY_ENVIRONMENT")
    )
    if request_hwid and lic_hwid not in ["ANY", "CLOUD", "*", ""] and not is_cloud_env:
        clean_req_hwid = request_hwid.strip().upper()
        if clean_req_hwid != lic_hwid and clean_req_hwid != "ANY":
            return False, {
                "status": "HWID_MISMATCH",
                "message": f"License is bound to machine {lic_hwid}. Current machine is {clean_req_hwid}.",
                "bound_hwid": lic_hwid,
                "request_hwid": clean_req_hwid
            }

    modules = DEFAULT_MODULES_BY_TIER.get(tier, DEFAULT_MODULES_BY_TIER["Trader Pro (Quarterly)"])

    # 5. Admin Role Authorization Check
    admin_keys_env = [k.strip() for k in os.getenv("ADMIN_LICENSE_KEYS", "").split(",") if k.strip()]
    known_admin_keys = {
        "T2O-SIG.eyJlbSI6IiIsImV4cCI6IjIwMjctMDktMDlUMTk6MzE6MDEuMDExMjc3IiwiaHciOiJBTlkiLCJpYXQiOiIyMDI2LTA5LTA5Iiwicm5kIjoiNDkwNzQ4NzQiLCJzdWIiOiJWaWtyYW0gU2luZ2giLCJ0YyI6Ik1TVCIsInRyIjoiTWFzdGVyeSBBbm51YWwifQ.60D0D369A45C6B9F",
        "T2O-ENT-DCC9-75C6-2E46",
        "T2O-PRO-8F29-A4C1-7290"
    }
    known_admin_keys.update(admin_keys_env)

    is_admin = bool(
        payload.get("adm") == 1 or 
        payload.get("role") == "ADMIN" or 
        key_clean in known_admin_keys or 
        client_name.strip().lower() in ["vikram singh", "ankit", "admin", "administrator"] or
        "admin" in tier.lower()
    )

    return True, {
        "status": "ACTIVE",
        "client_name": client_name,
        "tier": tier,
        "role": "ADMIN" if is_admin else "USER",
        "is_admin": is_admin,
        "expires_at": expires_at,
        "modules": modules,
        "hwid": lic_hwid,
        "message": f"Welcome, {client_name}! Access authorized as {'ADMIN' if is_admin else tier}."
    }
