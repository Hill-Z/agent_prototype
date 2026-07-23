import hashlib
import json
import re
import time
import uuid
from datetime import date
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

API_BASE_URL = "https://udesk-wofeng.s5.udesk.cn"
ADMIN_EMAIL = "admin_demo@udesk.cn"
OPEN_API_TOKEN = "de3e6e05-9c9e-4a8a-bcdc-a8ce992aa9ba"
TICKETS_ENDPOINT = "/open_api_v1/tickets"
PACIFICLIGHT_TICKET_TEMPLATE_ZH = "2897"
PACIFICLIGHT_TICKET_TEMPLATE_EN = "2895"


CUSTOMERS = {
    "R-PL-1001": {
        "customer_type": "residential",
        "name": "Tan Mei Ling",
        "account_no": "R-PL-1001",
        "postal_code": "238888",
        "phone": "+6591234567",
        "email": "sunlin@udesk.cn",
        "current_plan": "Residential Saver 24",
        "contract_end_date": "2026-12-31",
        "service_address": "Orchard Road, Singapore 238888",
        "billing_delivery": "Email bill",
        "move_house_eligible": True,
    },
    "R-PL-1002": {
        "customer_type": "residential",
        "name": "Nur Aisyah Binte Rahman",
        "account_no": "R-PL-1002",
        "postal_code": "520201",
        "phone": "+6588765432",
        "email": "sunlin@udesk.cn",
        "current_plan": "Residential Standard",
        "contract_end_date": "2027-03-31",
        "service_address": "Tampines Street 21, Singapore 520201",
        "billing_delivery": "Email bill",
        "move_house_eligible": True,
    },
    "C-PL-2001": {
        "customer_type": "commercial",
        "company": "ABC Manufacturing Pte Ltd",
        "contact_person": "Ms Lim",
        "account_no": "C-PL-2001",
        "postal_code": "609999",
        "phone": "+6566018899",
        "email": "sunlin@udesk.cn",
        "current_plan": "Commercial Fixed 24",
        "contract_end_date": "2026-09-30",
        "service_address": "Jurong Industrial Estate, Singapore 609999",
        "billing_delivery": "Email bill",
        "account_admin": "Ms Lim",
    },
}

UPDATE_LABELS = {
    "phone": ("contact phone number", "联系电话"),
    "email": ("registered email address", "登记邮箱"),
    "billing_delivery": ("billing delivery preference", "账单接收方式"),
    "service_address": ("service address", "服务地址"),
    "move_house": ("move-house request", "搬家/账户转移请求"),
    "additional_recipient": ("additional recipient approval request", "新增收件人审批请求"),
    "report_recipient": ("report recipient approval request", "报告收件人审批请求"),
}


def _is_en(language=""):
    return str(language or "").lower().startswith("en")


def _customer_type_label(value, language="zh"):
    raw = str(value or "")
    if _is_en(language):
        return raw
    low = raw.lower()
    if low == "residential":
        return "住宅客户"
    if low == "commercial":
        return "商业客户"
    return raw



def _span(text, color=None, weight="700", size=""):
    text = str(text)
    return text if str(weight) == "400" else f"**{text}**"


def _orange(text, weight="700", size=""):
    return _span(text, "#EA580C", weight, size)


def _green(text, weight="700"):
    return _span(text, "#16A34A", weight)


def _red(text, weight="700"):
    return _span(text, "#DC2626", weight)


def _amber(text, weight="600"):
    return _span(text, "#D97706", weight)


def _muted(text):
    return _span(text, "#6B7280", "400")


def _submitted(text="Submitted"):
    return _green(text)

def _pending(text):
    return _amber(text, "700")

def _ticket_colored(ticket_id):
    return _orange(ticket_id)

def _customer(account_no=""):
    return CUSTOMERS.get((account_no or "").upper())


def _case_id(kind="UPD"):
    return f"PL-{kind.upper()}-{uuid.uuid4().hex[:8].upper()}"



def _html_escape(value=""):
    return (str(value or "")
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;"))


def _build_sign(email, token, timestamp, nonce, sign_version="v2"):
    raw = f"{email}&{token}&{timestamp}&{nonce}&{sign_version}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _build_url(base_url=API_BASE_URL, email=ADMIN_EMAIL, token=OPEN_API_TOKEN):
    timestamp = str(int(time.time()))
    nonce = str(uuid.uuid4())
    sign = _build_sign(email, token, timestamp, nonce)
    return (
        f"{base_url}{TICKETS_ENDPOINT}"
        f"?email={email}"
        f"&timestamp={timestamp}"
        f"&sign={sign}"
        f"&nonce={nonce}"
        f"&sign_version=v2"
    )


def _ticket_payload(subject="", content="", template_id=PACIFICLIGHT_TICKET_TEMPLATE_ZH):
    return {
        "ticket": {
            "platform_name": "manual_input",
            "merchant_sid": None,
            "subject": str(subject or "")[:255],
            "content": str(content or ""),
            "status_id": "1",
            "priority_id": "3",
            "template_id": str(template_id or PACIFICLIGHT_TICKET_TEMPLATE_ZH),
            "custom_fields": {},
        }
    }


def _submit_udesk_ticket(subject="", content="", template_id=PACIFICLIGHT_TICKET_TEMPLATE_ZH):
    if not str(subject or "").strip() or not str(content or "").strip():
        return {"code": -1, "message": "Missing ticket subject or content", "ticket_id": None, "payload": _ticket_payload(subject, content, template_id)}
    payload_dict = _ticket_payload(subject, content, template_id)
    payload = json.dumps(payload_dict, ensure_ascii=False).encode("utf-8")
    req = Request(_build_url(), data=payload, headers={"Content-Type": "application/json; charset=utf-8"})
    try:
        with urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8")
            result = json.loads(raw) if raw else {}
        ticket = result.get("ticket") or result.get("data") or {}
        ticket_id = result.get("ticket_id") or ticket.get("id") or ticket.get("ticket_id") or result.get("id")
        return {"code": result.get("code"), "message": result.get("message", ""), "ticket_id": ticket_id, "payload": payload_dict}
    except HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        return {"code": exc.code, "message": f"HTTP {exc.code}: {body}", "ticket_id": None, "payload": payload_dict}
    except URLError as exc:
        return {"code": -2, "message": f"Network error: {exc.reason}", "ticket_id": None, "payload": payload_dict}
    except Exception as exc:
        return {"code": -3, "message": f"Unexpected error: {exc}", "ticket_id": None, "payload": payload_dict}


def _move_house_subject(customer, language="zh"):
    account = customer.get("account_no", "")
    if _is_en(language):
        return f"PacificLight Move-house / Address Change Request - {account}"
    return f"PacificLight 搬家/地址变更申请 - {account}"


_DATE_PATTERN = re.compile(
    r"(?<!\d)(\d{4})\s*(?:[-/.年])\s*(\d{1,2})\s*(?:[-/.月])\s*(\d{1,2})\s*日?"
)


def _normalize_date(value=""):
    """Normalize an explicit year-month-day value; month/day alone is invalid."""
    raw = str(value or "").strip()
    match = _DATE_PATTERN.fullmatch(raw)
    if not match:
        return ""
    year, month, day = (int(part) for part in match.groups())
    try:
        date(year, month, day)
    except ValueError:
        return ""
    return f"{year:04d}-{month:02d}-{day:02d}"


def _resolve_move_dates(move_out_date="", new_supply_date="", effective_date=""):
    """Resolve structured dates, with a strict legacy fallback for two explicit dates."""
    if str(move_out_date or "").strip() or str(new_supply_date or "").strip():
        return _normalize_date(move_out_date), _normalize_date(new_supply_date)
    legacy_dates = [_normalize_date(match.group(0)) for match in _DATE_PATTERN.finditer(str(effective_date or ""))]
    if len(legacy_dates) >= 2:
        return legacy_dates[0], legacy_dates[1]
    return "", ""


def _move_house_content(customer, new_value="", move_out_date="", new_supply_date="", notes="", language="zh"):
    display = customer.get("company") or customer.get("name") or "PacificLight Customer"
    if _is_en(language):
        rows = [
            ("Request Type", "Move-house / Address Change"),
            ("Account No.", customer.get("account_no", "")),
            ("Customer", display),
            ("Current Service Address", customer.get("service_address", "")),
            ("New Address / Postal Code", new_value),
            ("Move-out Date", move_out_date),
            ("New Supply Start Date", new_supply_date),
            ("Current Plan", customer.get("current_plan", "")),
            ("Contract End Date", customer.get("contract_end_date", "")),
            ("Registered Email", customer.get("email", "")),
            ("Contact Phone", customer.get("phone", "")),
            ("Customer Notes", notes or "None"),
        ]
        intro = "The customer has requested a move-house / service address change. Please review supply availability and contract terms."
    else:
        rows = [
            ("请求类型", "搬家/地址变更"),
            ("账户号", customer.get("account_no", "")),
            ("客户", display),
            ("当前服务地址", customer.get("service_address", "")),
            ("新地址 / 新邮编", new_value),
            ("搬出日期", move_out_date),
            ("新地址开始供电日期", new_supply_date),
            ("当前套餐", customer.get("current_plan", "")),
            ("合同到期日", customer.get("contract_end_date", "")),
            ("登记邮箱", customer.get("email", "")),
            ("联系电话", customer.get("phone", "")),
            ("客户备注", notes or "无"),
        ]
        intro = "客户申请搬家/服务地址变更，请确认新地址供电可用性和当前合约条款。"
    row_html = "".join(
        f"<tr><th style='text-align:left;padding:8px 10px;border:1px solid #e5e7eb;background:#f8fafc;width:220px'>{_html_escape(k)}</th>"
        f"<td style='padding:8px 10px;border:1px solid #e5e7eb'>{_html_escape(v)}</td></tr>"
        for k, v in rows
    )
    if _is_en(language):
        note = f"<strong>Note:</strong> The Care Team should verify electricity supply availability at the new address. {_pending('Early Termination Charges may apply')} if the current contract ends early."
    else:
        note = f"<strong>备注：</strong>请客服团队确认新地址供电可用性和当前合约条款。如当前合约提前结束，可能会产生 {_pending('提前解约费')}。"
    return f"""
<div style='font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#111827'>
  <p>{_html_escape(intro)}</p>
  <table style='border-collapse:collapse;margin:12px 0;max-width:860px'>{row_html}</table>
  <p>{note}</p>
</div>
""".strip()


def create_ticket(subject: str = "", content: str = "", language: str = "zh") -> str:
    """Create a PacificLight Udesk ticket from a subject and rich-text HTML content."""
    en = _is_en(language)
    template_id = PACIFICLIGHT_TICKET_TEMPLATE_EN if en else PACIFICLIGHT_TICKET_TEMPLATE_ZH
    result = _submit_udesk_ticket(subject=subject, content=content, template_id=template_id)
    if result.get("code") == 1000:
        ticket_id = result.get("ticket_id") or "Created"
        if en:
            return f"FINAL_ANSWER: The service ticket has been created successfully. Ticket ID: {ticket_id}"
        return f"FINAL_ANSWER: 工单已创建成功。工单编号：{ticket_id}"
    if en:
        return "FINAL_ANSWER: Sorry, I couldn’t create the ticket at the moment. I’ll connect you with a specialist. #Instruct[Human]"
    return "FINAL_ANSWER: 抱歉，当前暂时未能创建工单，我为您转接专属顾问继续处理。#Instruct[Human]"


def get_customer_update_profile(account_no: str = "", language: str = "zh") -> str:
    """Return editable account profile for a verified customer."""
    en = _is_en(language)
    c = _customer(account_no)
    if not c:
        return "Account profile not found. Please check the account number." if en else "未找到对应账户资料，请核对账户号。"
    display = c.get("company") or c.get("name")

    if en:
        return f"""## Account Profile

**Customer:** {display}  
**Account No.:** {c['account_no']}  
**Customer Type:** {c['customer_type']}

### Current Details
- Current Plan: {c['current_plan']}
- Contract End Date: {c['contract_end_date']}
- Service Address: {c['service_address']}
- Registered Email: {c['email']}
- Contact Phone: {c['phone']}
- Billing Delivery: {c['billing_delivery']}

Editable items: contact phone number, registered email address, billing delivery preference, service address / move-house request. For commercial accounts, additional report or billing recipients require account administrator approval."""

    return f"""## 账户资料

**客户：** {display}  
**账户号：** {c['account_no']}  
**客户类型：** {_customer_type_label(c['customer_type'], language)}

### 当前资料
- 当前套餐：{c['current_plan']}
- 合同到期日：{c['contract_end_date']}
- 服务地址：{c['service_address']}
- 登记邮箱：{c['email']}
- 联系电话：{c['phone']}
- 账单接收方式：{c['billing_delivery']}

可变更项目：联系电话、登记邮箱、账单接收方式、服务地址 / 搬家转移账户。商业账户如需新增报告或账单收件人，需要账户管理员审批。"""


def submit_account_update(
    account_no: str = "",
    update_type: str = "",
    new_value: str = "",
    effective_date: str = "",
    notes: str = "",
    language: str = "zh",
    move_out_date: str = "",
    new_supply_date: str = "",
) -> str:
    """Submit an account update or move-house service request as a customer-facing Markdown card."""
    en = _is_en(language)
    c = _customer(account_no)
    if not c:
        return "FINAL_ANSWER: I could not find this account. Please check the account number and try again." if en else "FINAL_ANSWER: 未找到对应账户，请核对账户号后再试。"

    update_type = (update_type or "general").lower()
    label_en, label_zh = UPDATE_LABELS.get(update_type, ("account update request", "账户资料变更请求"))
    cid = _case_id("MOVE" if update_type == "move_house" else "UPD")
    display = c.get("company") or c.get("name")

    if update_type in {"additional_recipient", "report_recipient"}:
        if en:
            return (f"FINAL_ANSWER: ## Additional Recipient Request Submitted\n\n"
                    f"**Case ID:** {_ticket_colored(cid)}\n\n"
                    f"### Request Details\n"
                    f"- Customer: {display}\n"
                    f"- Account No.: {c['account_no']}\n"
                    f"- Requested Recipient / Detail: {new_value or 'Not provided'}\n"
                    f"- Status: {_pending('Pending account administrator approval')}\n\n"
                    f"Reports or billing documents will only be sent to the additional recipient after approval.")
        return (f"FINAL_ANSWER: ## 新增收件人审批请求已提交\n\n"
                f"**请求编号：** {_ticket_colored(cid)}\n\n"
                f"### 请求信息\n"
                f"- 客户：{display}\n"
                f"- 账户号：{c['account_no']}\n"
                f"- 申请收件人 / 详情：{new_value or '未提供'}\n"
                f"- 状态：{_pending('待账户管理员审批')}\n\n"
                f"审批通过后，报告或账单文件才会发送至新增收件人。")

    if update_type == "move_house":
        missing_new_address = not str(new_value or "").strip()
        move_out_date, new_supply_date = _resolve_move_dates(
            move_out_date=move_out_date,
            new_supply_date=new_supply_date,
            effective_date=effective_date,
        )
        if missing_new_address:
            if en:
                return "FINAL_ANSWER: Great, I have the moving dates. Could you also provide the new address or new postal code so I can submit the move-house request correctly?"
            return "FINAL_ANSWER: 好的，搬出和新地址开始供电日期我已了解。还请您提供新地址或新邮编，我才能为您提交搬家/账户转移请求。"
        if not move_out_date or not new_supply_date:
            if en:
                return "FINAL_ANSWER: Please provide both dates with the year: the move-out date and the new supply start date, for example 2026-07-25 and 2026-07-26."
            return "FINAL_ANSWER: 请提供带年份的两个日期：当前地址搬出日期和新地址开始供电日期，例如 2026-07-25 和 2026-07-26。"
        subject = _move_house_subject(c, language)
        content = _move_house_content(
            c,
            new_value=new_value,
            move_out_date=move_out_date,
            new_supply_date=new_supply_date,
            notes=notes,
            language=language,
        )
        template_id = PACIFICLIGHT_TICKET_TEMPLATE_EN if en else PACIFICLIGHT_TICKET_TEMPLATE_ZH
        result = _submit_udesk_ticket(subject=subject, content=content, template_id=template_id)
        if result.get("code") == 1000:
            ticket_id = result.get("ticket_id") or cid
            if en:
                return (f"FINAL_ANSWER: ## Move-house Service Ticket Created\n\n"
                        f"**Ticket ID:** {_ticket_colored(ticket_id)}  \n"
                        f"**Status:** {_submitted('Submitted')}\n\n"
                        f"### Request Details\n"
                        f"- Account No.: {c['account_no']}\n"
                        f"- Current Plan: {c['current_plan']}\n"
                        f"- Current Service Address: {c['service_address']}\n"
                        f"- New Address / Postal Code: {new_value}\n"
                        f"- Move-out Date: {move_out_date}\n"
                        f"- New Supply Start Date: {new_supply_date}\n\n"
                        f"The Care Team will check the new supply address and your contract terms. If the current contract ends early, {_pending('Early Termination Charges may apply')}. You will receive a confirmation after review.")
            return (f"FINAL_ANSWER: ## 搬家服务工单已创建\n\n"
                    f"**工单编号：** {_ticket_colored(ticket_id)}  \n"
                    f"**状态：** {_submitted('已提交')}\n\n"
                    f"### 请求信息\n"
                    f"- 账户号：{c['account_no']}\n"
                    f"- 当前套餐：{c['current_plan']}\n"
                    f"- 当前服务地址：{c['service_address']}\n"
                    f"- 新地址 / 邮编：{new_value}\n"
                    f"- 搬出日期：{move_out_date}\n"
                    f"- 新地址开始供电日期：{new_supply_date}\n\n"
                    f"客服团队会继续确认新地址供电情况和合约条款。如当前合约提前结束，可能会产生 {_pending('提前解约费')}，审核后会再发送确认。")
        if en:
            return "FINAL_ANSWER: Sorry, I couldn’t create the move-house ticket at the moment. I’ll connect you with a specialist. #Instruct[Human]"
        return "FINAL_ANSWER: 抱歉，当前暂时未能创建搬家工单，我为您转接专属顾问继续处理。#Instruct[Human]"

    if en:
        return (f"FINAL_ANSWER: ## Account Update Request Submitted\n\n"
                f"**Case ID:** {_ticket_colored(cid)}\n\n"
                f"### Request Details\n"
                f"- Account No.: {c['account_no']}\n"
                f"- Request Type: {label_en}\n"
                f"- Requested Change: {new_value or 'Not provided'}\n"
                f"- Effective Date: {effective_date or 'As soon as processed'}\n"
                f"- Status: {_submitted('Submitted for processing')}")
    return (f"FINAL_ANSWER: ## 账户资料变更请求已提交\n\n"
            f"**请求编号：** {_ticket_colored(cid)}\n\n"
            f"### 请求信息\n"
            f"- 账户号：{c['account_no']}\n"
            f"- 请求类型：{label_zh}\n"
            f"- 变更内容：{new_value or '未提供'}\n"
            f"- 生效日期：{effective_date or '处理完成后尽快生效'}\n"
            f"- 状态：{_submitted('已提交处理')}")

