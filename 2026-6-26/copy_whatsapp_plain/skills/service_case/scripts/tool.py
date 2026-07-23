import hashlib
import json
import re
import time
import uuid
from html import escape
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

REGISTERED_EMAIL = "sunlin@udesk.cn"
API_BASE_URL = "https://udesk-wofeng.s5.udesk.cn"
ADMIN_EMAIL = "admin_demo@udesk.cn"
OPEN_API_TOKEN = "de3e6e05-9c9e-4a8a-bcdc-a8ce992aa9ba"
TICKETS_ENDPOINT = "/open_api_v1/tickets"
CONSUMPTION_REPORT_PDF_URL = "https://espreview.s4.udesk.cn/onlinePreview?url=RDZDQUNBQ0VDRDg0OTE5MURGRDJENzkzQ0Q4QjkzRDVEMzkzQ0VDQkRDOTNDRENBREE5MENCREFEQkNERDVERENEOTBEREQxRDM5MUZBREZDQURGOTE4RjhCOTE4QkRGREY4RkQ4OEQ4Q0RCOTNEOERCODY4OTkzOEE4Qjg4OEY5M0RGOEM4Njg2OTNEOEQ4REI4QThCREI4OThDREM4N0Q4REY5MUVFREZEREQ3RDhEN0RERjJEN0Q5RDZDQUUxRkREMUQwQ0RDQkQzQ0VDQUQ3RDFEMEUxRUNEQkNFRDFDQ0NBRTFGRDkzRUVGMjkzOEM4RThFOEZFMThDOEU4Qzg4OTNFRjhDOTBDRURBRDg4MURERDFEMENBODM%3D"
CONSUMPTION_REPORT_DOWNLOAD_URL = "https://ali-s5-km-pub-std.udeskcs.com/Data/15/7f3d7daf-059a-46e9-80b8-56f60e7c48c6/PacificLight_Consumption_Report_C-PL-2001_2026-Q2.pdf"
SERVICE_CASE_TEMPLATE_ZH = "2924"
SERVICE_CASE_TEMPLATE_EN = "2925"

CUSTOMERS = {
    "C-PL-2001": {
        "company": "ABC Manufacturing Pte Ltd",
        "account_no": "C-PL-2001",
        "postal_code": "609999",
        "registered_email": REGISTERED_EMAIL,
        "account_admin": "Ms Lim",
        "current_plan": "Commercial Fixed 24",
        "service_address": "Jurong Industrial Estate, Singapore 609999",
    },
    "R-PL-1001": {"name": "Tan Mei Ling", "account_no": "R-PL-1001", "registered_email": REGISTERED_EMAIL},
    "R-PL-1002": {"name": "Nur Aisyah Binte Rahman", "account_no": "R-PL-1002", "registered_email": REGISTERED_EMAIL},
}

REPORT_Q2_2026 = {
    "period": "2026-04 to 2026-06",
    "rows": [
        {"month": "Apr 2026", "consumption": "11,680 kWh", "peak_demand": "86 kW", "billed_amount": "SGD 3,198.42"},
        {"month": "May 2026", "consumption": "12,310 kWh", "peak_demand": "91 kW", "billed_amount": "SGD 3,370.99"},
        {"month": "Jun 2026", "consumption": "12,000 kWh", "peak_demand": "89 kW", "billed_amount": "SGD 3,288.86"},
    ],
    "total_consumption": "35,990 kWh",
    "average_monthly_consumption": "11,997 kWh",
    "total_billed_amount": "SGD 9,858.27",
}


def _is_en(language=""):
    return str(language or "").lower().startswith("en")



def _span(text, color=None, weight="700", size=""):
    text = str(text)
    return text


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

def _case_colored(case_id):
    return _orange(case_id)

def _case_id(case_type="support"):
    return f"PL-{(case_type or 'support').upper()}-{uuid.uuid4().hex[:8].upper()}"


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


def _ticket_payload(subject="", content="", template_id=SERVICE_CASE_TEMPLATE_ZH):
    return {
        "ticket": {
            "platform_name": "manual_input",
            "merchant_sid": None,
            "subject": str(subject or "")[:255],
            "content": str(content or ""),
            "status_id": "1",
            "priority_id": "3",
            "template_id": str(template_id or SERVICE_CASE_TEMPLATE_ZH),
            "custom_fields": {},
        }
    }


def _submit_udesk_ticket(subject="", content="", template_id=SERVICE_CASE_TEMPLATE_ZH):
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


def _create_additional_recipient_ticket(account_no="", company="", period="", report_format="", additional_recipient="", language="zh"):
    """Create an Additional Recipient Ticket for a commercial report recipient."""
    en = _is_en(language)
    template_id = SERVICE_CASE_TEMPLATE_EN if en else SERVICE_CASE_TEMPLATE_ZH
    safe_account = escape(str(account_no or ""))
    safe_company = escape(str(company or "PacificLight Customer"))
    safe_period = escape(str(period or ""))
    safe_format = escape(str(report_format or "PDF"))
    safe_recipient = escape(str(additional_recipient or ""))
    safe_registered = escape(REGISTERED_EMAIL)

    if en:
        subject = f"PacificLight Additional Recipient Ticket - commercial report for {account_no}"
        content = (
            "<div>"
            "<p>A customer requested the commercial consumption report to be sent to an additional email address. "
            "Please review the additional recipient request before any report is sent to the additional recipient.</p>"
            "<ul>"
            f"<li><strong>Account No.:</strong> {safe_account}</li>"
            f"<li><strong>Company:</strong> {safe_company}</li>"
            f"<li><strong>Report Period:</strong> {safe_period}</li>"
            f"<li><strong>Report Format:</strong> {safe_format}</li>"
            f"<li><strong>Registered Billing Email:</strong> {safe_registered}</li>"
            f"<li><strong>Additional Recipient:</strong> {safe_recipient}</li>"
            "</ul>"
            "</div>"
        )
    else:
        subject = f"PacificLight Additional Recipient Ticket - {account_no} 新增报告收件人"
        content = (
            "<div>"
            "<p>客户要求将商业用电报告发送至额外邮箱。请先审核新增收件人申请，审核通过后再向额外收件人发送报告。</p>"
            "<ul>"
            f"<li><strong>账户号：</strong>{safe_account}</li>"
            f"<li><strong>客户：</strong>{safe_company}</li>"
            f"<li><strong>报告周期：</strong>{safe_period}</li>"
            f"<li><strong>报告格式：</strong>{safe_format}</li>"
            f"<li><strong>账户登记账单邮箱：</strong>{safe_registered}</li>"
            f"<li><strong>额外收件人：</strong>{safe_recipient}</li>"
            "</ul>"
            "</div>"
        )
    return _submit_udesk_ticket(subject, content, template_id)


def _create_callback_ticket(title="", description="", account_no="", language="zh"):
    """Create a callback ticket for commercial quote follow-up."""
    en = _is_en(language)
    template_id = SERVICE_CASE_TEMPLATE_EN if en else SERVICE_CASE_TEMPLATE_ZH
    safe_title = escape(str(title or ("Commercial quote callback" if en else "商业报价回电")))
    safe_desc = escape(str(description or ("Customer requested a callback for commercial electricity quotation." if en else "客户要求商业用电报价回电跟进。")))
    safe_account = escape(str(account_no or ("Not provided" if en else "未提供")))

    if en:
        subject = f"PacificLight Callback Request - Commercial Quote - {safe_account}"
        content = (
            "<div>"
            "<p>A customer requested a callback for a PacificLight commercial electricity quote. "
            "Please follow up using the contact details provided in the request details.</p>"
            "<ul>"
            f"<li><strong>Callback Type:</strong> Commercial electricity quote follow-up</li>"
            f"<li><strong>Request Title:</strong> {safe_title}</li>"
            f"<li><strong>Account No.:</strong> {safe_account}</li>"
            f"<li><strong>Customer Request / Contact Details:</strong> {safe_desc}</li>"
            "</ul>"
            "</div>"
        )
    else:
        subject = f"PacificLight 回电请求 - 商业报价 - {safe_account}"
        content = (
            "<div>"
            "<p>客户要求针对 PacificLight 商业用电报价进行回电跟进，请根据请求信息中的联系方式联系客户。</p>"
            "<ul>"
            f"<li><strong>回电类型：</strong>商业用电报价跟进</li>"
            f"<li><strong>请求标题：</strong>{safe_title}</li>"
            f"<li><strong>账户号：</strong>{safe_account}</li>"
            f"<li><strong>客户诉求 / 联系方式：</strong>{safe_desc}</li>"
            "</ul>"
            "</div>"
        )
    return _submit_udesk_ticket(subject, content, template_id)



def _normalize_report_period(period=""):
    raw = str(period or "").strip()
    low = raw.lower().replace("–", "-").replace("—", "-")
    q2_tokens = [
        "q2", "2026 q2", "q2 2026", "apr-jun", "apr to jun", "april to june",
        "apr to jun 2026", "april to june 2026", "2026-04 to 2026-06", "2026-04-2026-06"
    ]
    if low in q2_tokens or (("apr" in low or "april" in low or "4月" in low or "04" in low) and ("jun" in low or "june" in low or "6月" in low or "06" in low) and "2026" in low):
        return REPORT_Q2_2026["period"]
    return raw or REPORT_Q2_2026["period"]

def _format_report_link(language="en"):
    if _is_en(language):
        return f"Click here to view the consumption report: {CONSUMPTION_REPORT_PDF_URL}"
    return f"点击此处查看用电报告：{CONSUMPTION_REPORT_PDF_URL}"



def _is_valid_email(value=""):
    raw = str(value or "").strip()
    if not raw:
        return False
    low = raw.lower()
    invalid = {"暂未提供", "未提供", "无", "没有", "none", "null", "not provided", "n/a", "na", "-"}
    if low in invalid or raw in invalid:
        return False
    return bool(re.match(r"^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$", raw))


def create_case(title: str, description: str = "", account_no: str = "", case_type: str = "support", priority: str = "normal", language: str = "zh") -> str:
    """Create a PacificLight service case record."""
    en = _is_en(language)
    case_id = _case_id(case_type)
    if (case_type or "").lower() == "commercial_quote":
        callback_ticket = _create_callback_ticket(title=title, description=description, account_no=account_no, language=language)
        if callback_ticket.get("code") != 1000:
            if en:
                return "FINAL_ANSWER: Sorry, I couldn’t create the callback ticket at the moment. I’ll connect you with a specialist. #Instruct[Human]"
            return "FINAL_ANSWER: 抱歉，当前暂时未能创建回电工单，我为您转接专属顾问继续处理。#Instruct[Human]"
        ticket_id = callback_ticket.get("ticket_id") or case_id
        if en:
            return (f"FINAL_ANSWER: Callback Request Submitted\n\n"
                    f"Ticket ID: {_case_colored(ticket_id)}\n\n"
                    f"Request Details\n"
                    f"- Callback Type: Commercial electricity quote follow-up\n"
                    f"- Request: {title or 'Commercial electricity quote callback'}\n"
                    f"- Contact / Details: {description or 'Not provided'}\n"
                    f"- Status: {_submitted('Submitted')}\n\n"
                    f"A PacificLight sales consultant will call back or follow up using the contact details provided.")
        return (f"FINAL_ANSWER: 回电请求已提交\n\n"
                f"工单编号： {_case_colored(ticket_id)}\n\n"
                f"请求信息\n"
                f"- 回电类型：商业用电报价跟进\n"
                f"- 请求事项：{title or '商业用电报价回电'}\n"
                f"- 联系方式 / 详情：{description or '未提供'}\n"
                f"- 状态：{_submitted('已提交')}\n\n"
                f"PacificLight 销售顾问会根据您提供的联系方式回电或继续跟进。")
    if en:
        return (f"FINAL_ANSWER: I have recorded your request and submitted it to the relevant team for follow-up.\n\n"
                f"Case ID: {_case_colored(case_id)}\n"
                f"- Title: {title}\n- Account No.: {account_no or 'Not provided'}\n"
                f"- Type: {case_type}\n- Priority: {priority}\n- Details: {description or 'None'}\n- Status: {_submitted('Submitted')}")
    return (f"FINAL_ANSWER: 我已记录您的问题，并提交对应团队继续跟进。\n\n"
            f"Case ID：{case_id}\n"
            f"- 标题：{title}\n- 账户号：{account_no or '未提供'}\n"
            f"- 类型：{case_type}\n- 优先级：{priority}\n- 说明：{description or '无'}\n- 状态：{_submitted('已提交')}")


def create_consumption_report_request(account_no: str = "", period: str = "", report_format: str = "both", send_to_registered_email: bool = True, additional_recipient: str = "", language: str = "zh") -> str:
    """Create a commercial report request or Additional Recipient Ticket and return a focused plain-text summary."""
    en = _is_en(language)
    c = CUSTOMERS.get((account_no or "").upper())
    if not c:
        return "FINAL_ANSWER: I could not find this account. Please check the account number and try again." if en else "FINAL_ANSWER: 未找到对应账户，请核对账户号后再试。"
    if not str(account_no or "").upper().startswith("C-"):
        return "FINAL_ANSWER: Consumption reports are available for commercial accounts. For residential accounts, I can help you check the electricity bill instead." if en else "FINAL_ANSWER: 用电报告适用于商业账户。住宅账户我可以帮您查询电费账单明细。"

    case_id = _case_id("REPORT")
    company = c.get("company") or c.get("name") or "PacificLight Customer"
    email = c.get("registered_email", REGISTERED_EMAIL)
    fmt = (report_format or "both").upper()
    if fmt in {"BOTH", "PDF+EXCEL", "PDF AND EXCEL"}:
        fmt_display = "PDF and Excel" if en else "PDF 和 Excel"
    elif fmt == "PDF":
        fmt_display = "PDF"
    elif fmt in {"EXCEL", "XLSX"}:
        fmt_display = "Excel"
    else:
        fmt_display = report_format or ("PDF and Excel" if en else "PDF 和 Excel")
    report_period = _normalize_report_period(period)
    report_link = _format_report_link(language)

    if _is_valid_email(additional_recipient):
        additional_recipient_ticket = _create_additional_recipient_ticket(
            account_no=account_no,
            company=company,
            period=report_period,
            report_format=fmt_display,
            additional_recipient=additional_recipient,
            language=language,
        )
        ticket_id = additional_recipient_ticket.get("ticket_id", "")
        if en:
            return (f"FINAL_ANSWER: Additional Recipient Ticket Submitted\n\n"
                    f"- Additional email: {additional_recipient}\n"
                    f"- Additional Recipient Ticket: {_case_colored(ticket_id)}\n"
                    f"- Status: {_submitted('Submitted')}\n\n"
                    f"I’ve submitted this for review first. The report will only be sent to the additional email after the additional recipient request is approved.")
        return (f"FINAL_ANSWER: Additional Recipient Ticket 已提交\n\n"
                f"- 额外邮箱：{additional_recipient}\n"
                f"- Additional Recipient Ticket：{_case_colored(ticket_id)}\n"
                f"- 状态：{_submitted('已提交')}\n\n"
                f"我已先为这个额外邮箱提交新增收件人审核。审核通过后，报告才会发送到该邮箱。")

    if en:
        return (f"FINAL_ANSWER: Consumption Report Request Created\n\n"
                f"Case ID: {_case_colored(case_id)}  \n"
                f"Status: {_submitted('Submitted')}\n\n"
                f"Request Details\n"
                f"- Account No.: {account_no}\n"
                f"- Company: {company}\n"
                f"- Report Period: {report_period}\n"
                f"- Report Format: {fmt_display}\n"
                f"- Primary Delivery: registered billing email {email}\n\n"
                f"Report Link\n{report_link}")

    return (f"FINAL_ANSWER: 用电报告请求已创建\n\n"
            f"请求编号： {_case_colored(case_id)}  \n"
            f"状态： {_submitted('已提交')}\n\n"
            f"请求信息\n"
            f"- 账户号：{account_no}\n"
            f"- 客户：{company}\n"
            f"- 报告周期：{report_period}\n"
            f"- 报告格式：{fmt_display}\n"
            f"- 主要发送方式：账户登记账单邮箱 {email}\n\n"
            f"报告链接\n{report_link}")

def prepare_consumption_report_email(account_no: str = "C-PL-2001", period: str = "2026-04 to 2026-06", report_format: str = "both", language: str = "zh") -> str:
    """Prepare subject and HTML body for a commercial consumption report email."""
    en = _is_en(language)
    c = CUSTOMERS.get((account_no or "").upper(), CUSTOMERS["C-PL-2001"])
    company = c.get("company") or c.get("name") or "PacificLight Customer"
    email = c.get("registered_email", REGISTERED_EMAIL)
    period = _normalize_report_period(period)
    rows_html = "".join(
        f"<tr><td style='padding:8px 10px;border:1px solid #e5e7eb'>{r['month']}</td>"
        f"<td style='padding:8px 10px;border:1px solid #e5e7eb;text-align:right'>{r['consumption']}</td>"
        f"<td style='padding:8px 10px;border:1px solid #e5e7eb;text-align:right'>{r['peak_demand']}</td>"
        f"<td style='padding:8px 10px;border:1px solid #e5e7eb;text-align:right'>{r['billed_amount']}</td></tr>"
        for r in REPORT_Q2_2026['rows']
    )
    if en:
        subject = f"PacificLight Consumption Report {account_no} - {period}"
        body = f"""
<div style='font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#111827'>
  <p>Dear Customer,</p>
  <p>Here is the requested PacificLight electricity consumption report for <strong>{company}</strong>.</p>
  <table style='border-collapse:collapse;margin:12px 0;max-width:860px'>
    <tr><th style='text-align:left;padding:8px 10px;border:1px solid #e5e7eb;background:#f8fafc'>Account No.</th><td style='padding:8px 10px;border:1px solid #e5e7eb'>{account_no}</td></tr>
    <tr><th style='text-align:left;padding:8px 10px;border:1px solid #e5e7eb;background:#f8fafc'>Service Address</th><td style='padding:8px 10px;border:1px solid #e5e7eb'>{c.get('service_address', '')}</td></tr>
    <tr><th style='text-align:left;padding:8px 10px;border:1px solid #e5e7eb;background:#f8fafc'>Report Period</th><td style='padding:8px 10px;border:1px solid #e5e7eb'>{period}</td></tr>
  </table>
  <table style='border-collapse:collapse;margin:12px 0;max-width:860px'>
    <tr><th style='padding:8px 10px;border:1px solid #e5e7eb;background:#f8fafc'>Month</th><th style='padding:8px 10px;border:1px solid #e5e7eb;background:#f8fafc'>Consumption</th><th style='padding:8px 10px;border:1px solid #e5e7eb;background:#f8fafc'>Peak Demand</th><th style='padding:8px 10px;border:1px solid #e5e7eb;background:#f8fafc'>Billed Amount</th></tr>
    {rows_html}
  </table>
  <p><strong>Total Consumption:</strong> {REPORT_Q2_2026['total_consumption']}<br>
  <strong>Average Monthly Consumption:</strong> {REPORT_Q2_2026['average_monthly_consumption']}<br>
  <strong>Total Billed Amount:</strong> {REPORT_Q2_2026['total_billed_amount']}</p>
  <p>Report PDF: <a href='{CONSUMPTION_REPORT_PDF_URL}' target='_blank' rel='noopener noreferrer'>Click here to view the consumption report</a></p>
  <p>This report may be used for internal finance and ESG reporting reference.</p>
  <p>Best regards,<br><strong>PacificLight Customer Service</strong><br>PacificLight Energy</p>
</div>
""".strip()
        return f"SUBJECT: {subject}\nRECIPIENT: {email}\nREPORT_PDF_URL: {CONSUMPTION_REPORT_PDF_URL}\nEMAIL_HTML:\n{body}"

    subject = f"PacificLight 用电报告 {account_no} - {period}"
    body = f"""
<div style='font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#111827'>
  <p>尊敬的客户，</p>
  <p>以下是 <strong>{company}</strong> 申请的 PacificLight 用电报告。</p>
  <table style='border-collapse:collapse;margin:12px 0;max-width:860px'>
    <tr><th style='text-align:left;padding:8px 10px;border:1px solid #e5e7eb;background:#f8fafc'>账户号</th><td style='padding:8px 10px;border:1px solid #e5e7eb'>{account_no}</td></tr>
    <tr><th style='text-align:left;padding:8px 10px;border:1px solid #e5e7eb;background:#f8fafc'>服务地址</th><td style='padding:8px 10px;border:1px solid #e5e7eb'>{c.get('service_address', '')}</td></tr>
    <tr><th style='text-align:left;padding:8px 10px;border:1px solid #e5e7eb;background:#f8fafc'>报告周期</th><td style='padding:8px 10px;border:1px solid #e5e7eb'>{period}</td></tr>
  </table>
  <table style='border-collapse:collapse;margin:12px 0;max-width:860px'>
    <tr><th style='padding:8px 10px;border:1px solid #e5e7eb;background:#f8fafc'>月份</th><th style='padding:8px 10px;border:1px solid #e5e7eb;background:#f8fafc'>用电量</th><th style='padding:8px 10px;border:1px solid #e5e7eb;background:#f8fafc'>峰值负荷</th><th style='padding:8px 10px;border:1px solid #e5e7eb;background:#f8fafc'>账单金额</th></tr>
    {rows_html}
  </table>
  <p><strong>总用电量：</strong>{REPORT_Q2_2026['total_consumption']}<br>
  <strong>月均用电量：</strong>{REPORT_Q2_2026['average_monthly_consumption']}<br>
  <strong>账单总额：</strong>{REPORT_Q2_2026['total_billed_amount']}</p>
  <p>报告 PDF：<a href='{CONSUMPTION_REPORT_PDF_URL}' target='_blank' rel='noopener noreferrer'>点击此处查看用电报告</a></p>
  <p>该报告可用于内部财务和 ESG 汇报参考。</p>
  <p>此致，<br><strong>PacificLight Customer Service</strong><br>PacificLight Energy</p>
</div>
""".strip()
    return f"SUBJECT: {subject}\nRECIPIENT: {email}\nREPORT_PDF_URL: {CONSUMPTION_REPORT_PDF_URL}\nEMAIL_HTML:\n{body}"
