"""
PLDT Broadband Repair — Udesk API Ticket Creation Script

Usage:
    python create_ticket.py --phone <mobile_number> --address <address> --issue <issue_description>
        [--account <account_number>] [--troubleshooting <steps>]

Options:
    --phone             Customer mobile number (required)
    --address           Customer address (required)
    --issue             Issue description (required)
    --account           Account number (optional)
    --troubleshooting   Summary of troubleshooting steps performed (optional)

Environment Variables:
    UDESK_API_BASE_URL    Udesk API base URL, e.g. https://xxx.udesk.cn
    UDESK_ADMIN_EMAIL     Super admin email
    UDESK_OPEN_API_TOKEN  API Token (can be obtained via log_in endpoint)
    UDESK_TICKET_PRIORITY Ticket priority, default "Normal"
    UDESK_TICKET_GROUP    Ticket group, default "Default"

Example:
    python create_ticket.py \
      --phone "09171234567" \
      --address "123 Rizal St, Barangay San Antonio, Makati City" \
      --issue "No internet connection, LOS red light" \
      --account "PLDT-123456" \
      --troubleshooting "Checked power light OK, LOS red, fiber cable checked and still red"

Note:
    This script requires environment variables to be configured before use.
    See the configuration section in the script.
"""

import sys
import json
import hashlib
import uuid
import time
import argparse
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError


# ============================================================
# Configuration (Fixed Values)
# ============================================================

API_BASE_URL = "https://udesk-wofeng.s5.udesk.cn"
ADMIN_EMAIL = "admin_demo@udesk.cn"
OPEN_API_TOKEN = "de3e6e05-9c9e-4a8a-bcdc-a8ce992aa9ba"
TICKETS_ENDPOINT = "/open_api_v1/tickets"


# ============================================================
# Signature Calculation
# ============================================================

def build_sign(email, token, timestamp, nonce, sign_version="v2"):
    """
    Calculate Udesk API v2 signature

    Algorithm: SHA256(email & open_api_token & timestamp & nonce & sign_version)
    """
    raw_str = f"{email}&{token}&{timestamp}&{nonce}&{sign_version}"
    return hashlib.sha256(raw_str.encode("utf-8")).hexdigest()


def build_url(base_url, email, token):
    """Build the full URL with authentication parameters"""
    timestamp = str(int(time.time()))
    nonce = str(uuid.uuid4())
    sign = build_sign(email, token, timestamp, nonce)

    url = (
        f"{base_url}{TICKETS_ENDPOINT}"
        f"?email={email}"
        f"&timestamp={timestamp}"
        f"&sign={sign}"
        f"&nonce={nonce}"
        f"&sign_version=v2"
    )
    return url


# ============================================================
# Ticket Creation
# ============================================================

def create_ticket(phone, address, issue, name="", troubleshooting=None, tags=""):
    """
    Call Udesk API to create a ticket

    Args:
        phone: Customer mobile number
        address: Customer address
        issue: Issue description
        name: Customer name (optional)
        troubleshooting: Troubleshooting steps performed (optional)
        tags: Ticket tags, comma-separated (optional)

    Returns:
        dict: Contains code, message, ticket_id
    """
    # Build ticket subject
    subject_parts = ["PLDT Home Broadband -"]
    if "no connection" in issue.lower() or "no internet" in issue.lower() or "down" in issue.lower():
        subject_parts.append("No Connection")
    elif "slow" in issue.lower():
        subject_parts.append("Slow Internet")
    else:
        subject_parts.append("Internet Issue")
    subject = " ".join(subject_parts)

    # Build ticket content
    content_lines = [
        f"Customer Issue: {issue}",
    ]
    if troubleshooting:
        content_lines.append(f"\nTroubleshooting Steps Completed:\n{troubleshooting}")
    content = "\n".join(content_lines)

    # Build request body
    ticket_data = {
        "subject": subject[:255],
        "content": content,
        "status_id": 1,  # Open
        "template_id": 2886,
        "tags": tags,
    }

    ticket_data["ticket_field"] = {
        "TextField_2720": phone,
        "TextField_6253": address,
        "TextField_2557": name,
    }

    payload = json.dumps({"ticket": ticket_data}, ensure_ascii=False).encode("utf-8")

    # Send request
    url = build_url(API_BASE_URL, ADMIN_EMAIL, OPEN_API_TOKEN)
    req = Request(url, data=payload, headers={
        "Content-Type": "application/json; charset=utf-8",
    })

    try:
        with urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            return {
                "code": result.get("code"),
                "message": result.get("message", ""),
                "ticket_id": result.get("ticket_id"),
            }
    except HTTPError as e:
        error_body = e.read().decode("utf-8", errors="replace")
        return {
            "code": e.code,
            "message": f"HTTP {e.code}: {error_body}",
            "ticket_id": None,
        }
    except URLError as e:
        return {
            "code": -2,
            "message": f"Network error: {e.reason}",
            "ticket_id": None,
        }
    except Exception as e:
        return {
            "code": -3,
            "message": f"Unexpected error: {str(e)}",
            "ticket_id": None,
        }


# ============================================================
# CLI
# ============================================================

def main():
    parser = argparse.ArgumentParser(description="PLDT Udesk Ticket Creation")
    parser.add_argument("--phone", default="09171234567", help="Customer mobile number")
    parser.add_argument("--address", default="123 Rizal St, Barangay San Antonio, Makati City", help="Customer address")
    parser.add_argument("--name", default="Juan Dela Cruz", help="Customer name")
    parser.add_argument("--issue", default="No internet connection, LOS red light", help="Issue description")
    parser.add_argument("--troubleshooting", default="Checked modem lights - LOS red, fiber cable checked and still red", help="Troubleshooting steps performed")
    parser.add_argument("--tags", default="", help="Ticket tags, comma-separated")

    args = parser.parse_args()

    result = create_ticket(
        phone=args.phone,
        address=args.address,
        issue=args.issue,
        name=args.name,
        troubleshooting=args.troubleshooting,
        tags=args.tags,
    )

    print(json.dumps(result, indent=2, ensure_ascii=False))

    if result["code"] == 1000:
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
