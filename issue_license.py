#!/usr/bin/env python3
"""
Trade2Options - Dalal Street AI
Production Cryptographic License Key Generator (CLI Tool)

Generate enterprise, pro, and trial signed keys that validate 100% offline
and work on Render, local terminal, and all platforms with zero database dependencies.
"""

import sys
import argparse
from crypto_licensing import generate_signed_license

def main():
    parser = argparse.ArgumentParser(
        description="TRADE2OPTIONS — Issue Production Cryptographic License Keys"
    )
    parser.add_argument("--client", "-c", type=str, help="Client / Trader Full Name")
    parser.add_argument("--email", "-e", type=str, default="", help="Client Email Address (optional)")
    parser.add_argument(
        "--tier", "-t", 
        type=str, 
        default="Enterprise Lifetime",
        choices=["Enterprise Lifetime", "Mastery Annual", "Trader Pro (Quarterly)", "7-Day Free Trial"],
        help="Subscription Tier"
    )
    parser.add_argument(
        "--days", "-d", 
        type=int, 
        default=3650, 
        help="Validity duration in days (default: 3650 for lifetime, 365 for annual, 90 for quarterly)"
    )
    parser.add_argument(
        "--hwid", 
        type=str, 
        default="ANY", 
        help="Machine Hardware ID to lock to (default: ANY for all cloud/web devices)"
    )

    args = parser.parse_args()

    # Interactive mode if no client specified
    client_name = args.client
    email = args.email
    tier = args.tier
    duration_days = args.days
    hwid = args.hwid

    if not client_name:
        print("=" * 68)
        print("  🔑 TRADE2OPTIONS — PRODUCTION LICENSE KEY GENERATOR")
        print("=" * 68)
        client_name = input("Enter Client Name (e.g. Rahul Sharma): ").strip()
        if not client_name:
            client_name = "Valued Trader"
        
        email = input("Enter Client Email (optional): ").strip()

        print("\nSelect Subscription Tier:")
        print("  [1] Enterprise Lifetime  (All Modules + Unlimited Seats)")
        print("  [2] Mastery Annual       (Debate Arena + Terminal + Discord)")
        print("  [3] Trader Pro           (Quarterly - 90 Days)")
        print("  [4] 7-Day Free Trial")
        tier_choice = input("Enter choice (1-4, default 1): ").strip()

        if tier_choice == "2":
            tier = "Mastery Annual"
            duration_days = 365
        elif tier_choice == "3":
            tier = "Trader Pro (Quarterly)"
            duration_days = 90
        elif tier_choice == "4":
            tier = "7-Day Free Trial"
            duration_days = 7
        else:
            tier = "Enterprise Lifetime"
            duration_days = 3650

        hwid_input = input("Lock to specific HWID? (Press Enter for 'ANY' - recommended for Render/Web): ").strip()
        if hwid_input:
            hwid = hwid_input

    # Generate cryptographically signed license
    lic = generate_signed_license(
        client_name=client_name,
        tier=tier,
        duration_days=duration_days,
        email=email,
        hwid=hwid
    )

    print("\n" + "=" * 68)
    print("  ✅ LICENSE KEY SUCCESSFULLY GENERATED & SIGNED")
    print("=" * 68)
    print(f"  Client Name : {lic['client_name']}")
    print(f"  Tier        : {lic['tier']}")
    print(f"  Hardware ID : {lic['hwid']}")
    print(f"  Expires At  : {lic['expires_at']}")
    print(f"  Modules     : {', '.join(lic['modules'])}")
    print("-" * 68)
    print(f"\n  🎯 LICENSE KEY:\n")
    print(f"  {lic['license_key']}\n")
    print("=" * 68)
    print("  ⚡ Copy the key above and provide it to the client.")
    print("  ⚡ It validates immediately on Render and local without any redeploy.")
    print("=" * 68 + "\n")

if __name__ == "__main__":
    main()
