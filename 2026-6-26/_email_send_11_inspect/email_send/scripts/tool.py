import hashlib
import json
import time
import uuid
from urllib.request import Request, urlopen

# ============================================================
# Configuration (Fixed Values)
# ============================================================

API_BASE_URL = "https://udesk-wofeng.s5.udesk.cn"
ADMIN_EMAIL = "admin_demo@udesk.cn"
OPEN_API_TOKEN = "de3e6e05-9c9e-4a8a-bcdc-a8ce992aa9ba"
TICKETS_ENDPOINT = "/open_api_v1/tickets"

def _build_sign(email, token, timestamp, nonce, sign_version="v2"):
    """
    Calculate Udesk API v2 signature

    Algorithm: SHA256(email & open_api_token & timestamp & nonce & sign_version)
    """
    raw_str = f"{email}&{token}&{timestamp}&{nonce}&{sign_version}"
    return hashlib.sha256(raw_str.encode("utf-8")).hexdigest()


def _build_url(base_url, email, token):
    """Build the full URL with authentication parameters"""
    timestamp = str(int(time.time()))
    nonce = str(uuid.uuid4())
    sign = _build_sign(email, token, timestamp, nonce)

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

def send_email( subject: str,email_content: str) -> str:
    """Send an email notification."""
    if not subject or  not email_content:
        return "邮件发送失败：缺少邮件主题或内容。"
    # subject_parts = ["Pacific Home Broadband -"]
    subject = " ".join(subject)

    # email_phone_map={
    #     ## taozui
    #     "09084561238":100932984,
    #     ## 18518751141
    #     "09093457891":101846689,
    #     ## 18566706215
    #     "09101234568": 58674734,
    #     ## 17621713407
    #     "09497890123": 101861546,
    #     ## 13662650788
    #     "09701239876": 101861640,
    # }
    # user_id=email_phone_map.get(phone_number,100932984)
    user_id = 101710181
    # Build ticket content

    # Build request body
    ticket_data = {
        "subject": subject[:255],
        "content": email_content,
        "status_id": 1,  # Open
        "template_id": 2901,
        "type": "customer_id",
        "type_content": user_id,
    }
    email_title = subject
    ticket_data["ticket_field"] = {
        ## email_title
        "TextField_6753": email_title,
        ## email content
        "TextField_6754": email_content,
    }

    payload = json.dumps({"ticket": ticket_data}, ensure_ascii=False).encode("utf-8")

    # Send request
    url = _build_url(API_BASE_URL, ADMIN_EMAIL, OPEN_API_TOKEN)
    req = Request(url, data=payload, headers={
        "Content-Type": "application/json; charset=utf-8",
    })

    try:
        with urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            res_code = result.get("code")
            if res_code == 1000:
                return f"邮件已发送。\n状态：发送成功"
        return f"邮件发送失败"
    except Exception as e:
        f"邮件发送失败：{e}"


if __name__ == '__main__':
    send_email("测试","测试 2")