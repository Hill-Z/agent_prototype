import hashlib
import json
import re
import time
import uuid
from urllib.request import Request, urlopen

# ============================================================
# Udesk Open API Configuration
# ============================================================

API_BASE_URL = "https://udesk-wofeng.s5.udesk.cn"
ADMIN_EMAIL = "admin_demo@udesk.cn"
OPEN_API_TOKEN = "de3e6e05-9c9e-4a8a-bcdc-a8ce992aa9ba"
TICKETS_ENDPOINT = "/open_api_v1/tickets"

# User-provided fixed recipient/customer identifier
USER_ID = 102008100
REGISTERED_RECIPIENT_EMAIL = "sunlin@udesk.cn"

# Udesk ticket/template configuration from reference package
TEMPLATE_ID = 2901
EMAIL_TITLE_FIELD = "TextField_6753"
EMAIL_CONTENT_FIELD = "TextField_6754"


PDF_SOURCE_DOWNLOAD_URL = "https://ali-s5-km-pub-std.udeskcs.com/Data/15/4e10eca6-8350-456a-8082-ddd140673ef3/PacificLight_Electricity_Bill_R-PL-1001_2026-06.pdf"
PDF_BILL_LINK = "https://espreview.s4.udesk.cn/onlinePreview?url=RDZDQUNBQ0VDRDg0OTE5MURGRDJENzkzQ0Q4QjkzRDVEMzkzQ0VDQkRDOTNDRENBREE5MENCREFEQkNERDVERENEOTBEREQxRDM5MUZBREZDQURGOTE4RjhCOTE4QjhGOEJERDhEOEM4OEQ4OTM4OTg4REQ4RjkzOEE4OUQ4ODk5M0RDRENEODg5OTM4RDhDREY4RkRBREY4RDhEOEI4RURBOEQ5MUVFREZEREQ3RDhEN0RERjJEN0Q5RDZDQUUxRkJEMkRCRERDQUNDRDdEREQ3Q0FDN0UxRkNEN0QyRDJFMUVDOTNFRUYyOTM4RjhFOEU4RkUxOEM4RThDODg5MzhFODg5MENFREFEODgxREREMUQwQ0FEQkQwQ0E4Mw%3D%3D"



def _build_sign(email, token, timestamp, nonce, sign_version="v2"):
    """Calculate Udesk API v2 signature."""
    raw_str = f"{email}&{token}&{timestamp}&{nonce}&{sign_version}"
    return hashlib.sha256(raw_str.encode("utf-8")).hexdigest()


def _build_url(base_url, email, token):
    """Build the full URL with authentication parameters."""
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


def _normalize_text(value):
    if value is None:
        return ""
    if isinstance(value, (list, tuple)):
        return " ".join(str(x) for x in value if x is not None).strip()
    return str(value).strip()


def _looks_like_body(value: str) -> bool:
    value = _normalize_text(value)
    if not value:
        return False
    lower = value.lower()
    body_markers = [
        "\n", "<br", "<table", "<p", "dear ", "customer name:", "account no.",
        "billing period:", "invoice no.", "pdf link", "total amount due", "best regards",
    ]
    return len(value) > 120 or any(marker in lower for marker in body_markers)


def _extract_between(text: str, labels):
    source = _normalize_text(text)
    if not source:
        return ""
    normalized = re.sub(r"<[^>]+>", " ", source)
    normalized = re.sub(r"\s+", " ", normalized).strip()

    known_labels = [
        "Customer Name", "Company", "Account No.", "Account No", "Billing Period", "Invoice No.",
        "Invoice No", "Bill Date", "Due Date", "Payment Status", "Meter No.", "Meter No",
        "Previous Reading", "Current Reading", "Consumption", "Energy Charge", "MSS Charge",
        "Metering Charge", "Carbon Tax", "Subtotal", "GST 9%", "Late Payment Charge",
        "Total Amount Due", "PDF Link", "客户名称", "公司", "账户号", "账期", "发票号",
        "账单日期", "到期日", "付款状态", "电表号", "总应付金额",
    ]
    label_pattern = "|".join(re.escape(x) for x in sorted(known_labels, key=len, reverse=True))

    for label in labels:
        pattern = re.compile(
            re.escape(label).rstrip(re.escape(":")) + r"\s*[:：]?\s*(.*?)(?=\s+(?:" + label_pattern + r")\s*[:：]|$)",
            re.IGNORECASE,
        )
        match = pattern.search(normalized)
        if match:
            return match.group(1).strip(" :：-—|,.，。")
    return ""


def _sanitize_subject(subject: str, email_content: str = "") -> str:
    subject = _normalize_text(subject).replace("\r", " ").replace("\n", " ")
    email_content = _normalize_text(email_content)
    if subject and not _looks_like_body(subject):
        return subject[:120]

    invoice_no = _extract_between(email_content, ["Invoice No.:", "Invoice No:", "发票号：", "发票号:"])
    billing_period = _extract_between(email_content, ["Billing Period:", "账期：", "账期:"])
    if invoice_no and billing_period:
        return f"PacificLight Electricity Bill {invoice_no} - {billing_period}"[:120]
    if invoice_no:
        return f"PacificLight Electricity Bill {invoice_no}"[:120]
    return "PacificLight Customer Service Update"


def _html_escape(value):
    return (
        _normalize_text(value)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def _is_en(language=""):
    return str(language or "").lower().startswith("en")


def _normalize_bill_status(value: str, language: str = "en") -> str:
    raw = _normalize_text(value)
    low = raw.lower()
    paid_markers = ["paid", "已支付", "已付款", "settled", "closed"]
    outstanding_markers = ["outstanding", "unpaid", "未支付", "未付款", "open", "待支付"]
    if any(x in low for x in paid_markers) or any(x in raw for x in ["已支付", "已付款"]):
        return "Paid" if _is_en(language) else "已支付"
    if any(x in low for x in outstanding_markers) or any(x in raw for x in ["未支付", "未付款", "待支付"]):
        return "Outstanding" if _is_en(language) else "未支付"
    return raw


def _normalize_billing_period(value: str, language: str = "en") -> str:
    raw = _normalize_text(value)
    if _is_en(language):
        return raw.replace(" 至 ", " to ").replace("至", " to ").replace(" 到 ", " to ").replace("到", " to ")
    return raw.replace(" to ", " 至 ")


def _normalize_bill_email_data(data: dict, language: str = "en") -> dict:
    normalized = dict(data)
    normalized["billing_period"] = _normalize_billing_period(normalized.get("billing_period", ""), language)
    normalized["payment_status"] = _normalize_bill_status(normalized.get("payment_status", ""), language)
    return normalized



def _normalize_pdf_link(value: str = "") -> str:
    link = _normalize_text(value)
    if not link:
        return PDF_BILL_LINK
    if link == PDF_SOURCE_DOWNLOAD_URL or link == PDF_BILL_LINK:
        return link
    if "espreview.s4.udesk.cn/onlinePreview" in link:
        return PDF_BILL_LINK
    return link


def _money_status_note(payment_status: str, due_date: str, language: str = "en") -> str:
    status = _normalize_bill_status(payment_status, language).lower()
    if _is_en(language):
        if status == "paid":
            return "This bill has been paid. No further payment is required for this invoice."
        if due_date:
            return f"Please complete the payment before {due_date} to avoid late payment charges."
        return "Please complete the payment by the due date stated on the bill."
    if status == "已支付":
        return "该账单已支付，无需再次付款。"
    if due_date:
        return f"请在 {due_date} 前完成付款，以避免产生逾期付款费用。"
    return "请在账单到期日前完成付款。"


def _bill_email_html(language: str = "en", **data) -> str:
    data = _normalize_bill_email_data(data, language)

    def e(key):
        return _html_escape(data.get(key, ""))

    if _is_en(language):
        rows = [
            ("Customer Name / Company", e("customer_name")),
            ("Account No.", e("account_no")),
            ("Billing Period", e("billing_period")),
            ("Invoice No.", e("invoice_no")),
            ("Bill Date", e("bill_date")),
            ("Due Date", e("due_date")),
            ("Payment Status", e("payment_status")),
            ("Meter No.", e("meter_no")),
            ("Previous Reading", e("previous_reading")),
            ("Current Reading", e("current_reading")),
            ("Consumption", e("consumption")),
            ("Energy Charge", e("energy_charge")),
            ("MSS Charge", e("mss_charge")),
            ("Metering Charge", e("metering_charge")),
            ("Carbon Tax", e("carbon_tax")),
            ("Subtotal", e("subtotal")),
            ("GST 9%", e("gst")),
            ("Late Payment Charge", e("late_payment_charge")),
            ("Total Amount Due", e("total_amount_due")),
        ]
    else:
        rows = [
            ("客户姓名 / 公司", e("customer_name")),
            ("账户号", e("account_no")),
            ("账单周期", e("billing_period")),
            ("发票号", e("invoice_no")),
            ("出账日期", e("bill_date")),
            ("到期日", e("due_date")),
            ("付款状态", e("payment_status")),
            ("电表号", e("meter_no")),
            ("上期读数", e("previous_reading")),
            ("本期读数", e("current_reading")),
            ("本期用电量", e("consumption")),
            ("电费", e("energy_charge")),
            ("市场支持服务费（MSS）", e("mss_charge")),
            ("电表服务费", e("metering_charge")),
            ("碳税", e("carbon_tax")),
            ("小计", e("subtotal")),
            ("GST 9%", e("gst")),
            ("逾期付款费用", e("late_payment_charge")),
            ("应付总额", e("total_amount_due")),
        ]
    row_html = "".join(
        f"<tr><th style='text-align:left;padding:8px 10px;border:1px solid #e5e7eb;background:#f8fafc;width:220px'>{label}</th>"
        f"<td style='padding:8px 10px;border:1px solid #e5e7eb'>{value}</td></tr>"
        for label, value in rows if value
    )
    customer = e("customer_name") or "Customer"
    note = _html_escape(_money_status_note(data.get("payment_status", ""), data.get("due_date", ""), language))
    pdf_link = _html_escape(_normalize_pdf_link(data.get("pdf_link")))
    if _is_en(language):
        return f"""
<div style='font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#111827'>
  <p>Dear {customer},</p>
  <p>Here is your requested PacificLight electricity bill.</p>
  <table style='border-collapse:collapse;margin:12px 0;max-width:760px'>
    {row_html}
  </table>
  <p><strong>PDF Document:</strong> <a href='{pdf_link}' target='_blank' rel='noopener noreferrer'>Click here to view the PDF document</a></p>
  <p>{note}</p>
  <p>Best regards,<br><strong>PacificLight Customer Service</strong><br>PacificLight Energy</p>
</div>
""".strip()
    return f"""
<div style='font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#111827'>
  <p>尊敬的 {customer}，</p>
  <p>以下是您申请查看的 PacificLight 电费账单。</p>
  <table style='border-collapse:collapse;margin:12px 0;max-width:760px'>
    {row_html}
  </table>
  <p><strong>PDF 文档：</strong> <a href='{pdf_link}' target='_blank' rel='noopener noreferrer'>点击此处查看 PDF 文档</a></p>
  <p>{note}</p>
  <p>此致，<br><strong>PacificLight Customer Service</strong><br>PacificLight Energy</p>
</div>
""".strip()



def _extract_prepared_email(subject: str, email_content: str):
    """Accept a prepared template block and extract SUBJECT / EMAIL_HTML safely."""
    content = _normalize_text(email_content)
    subj = _normalize_text(subject)
    if not content:
        return subj, content

    subject_match = re.search(r"(?:^|\n)SUBJECT:\s*(.+?)(?=\n[A-Z_]+:|\Z)", content, flags=re.S)
    html_match = re.search(r"(?:^|\n)EMAIL_HTML:\s*(.+)\Z", content, flags=re.S)
    if subject_match and (not subj or _looks_like_body(subj)):
        subj = _normalize_text(subject_match.group(1))
    if html_match:
        content = _normalize_text(html_match.group(1))

    # Some model-generated quote emails used a full document wrapper. Keep only the body fragment
    # so Udesk templates render it like the fixed bill/report templates.
    content = re.sub(r"^\s*<html[^>]*>\s*<body[^>]*>", "", content, flags=re.I | re.S)
    content = re.sub(r"</body>\s*</html>\s*$", "", content, flags=re.I | re.S).strip()
    return subj, content


def _submit_email_ticket(subject: str, email_content: str) -> str:
    subject, email_content = _extract_prepared_email(subject, email_content)
    email_content = _normalize_text(email_content)
    subject = _sanitize_subject(subject, email_content)
    if not subject or not email_content:
        return "邮件发送失败：缺少邮件主题或内容。"

    ticket_data = {
        "subject": subject[:255],
        "content": email_content,
        "status_id": 1,
        "template_id": TEMPLATE_ID,
        "type": "customer_id",
        "type_content": USER_ID,
        "ticket_field": {
            EMAIL_TITLE_FIELD: subject,
            EMAIL_CONTENT_FIELD: email_content,
        },
    }

    payload = json.dumps({"ticket": ticket_data}, ensure_ascii=False).encode("utf-8")
    url = _build_url(API_BASE_URL, ADMIN_EMAIL, OPEN_API_TOKEN)
    req = Request(url, data=payload, headers={"Content-Type": "application/json; charset=utf-8"})

    try:
        with urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8")
            result = json.loads(raw) if raw else {}
        if result.get("code") == 1000:
            ticket = result.get("ticket") or result.get("data") or {}
            ticket_id = ticket.get("id") or ticket.get("ticket_id") or ""
            extra = f"\n工单编号：{ticket_id}" if ticket_id else ""
            return f"邮件已发送。\n状态：发送成功{extra}"
        message = result.get("message") or result.get("msg") or "Udesk API 未返回成功状态。"
        return f"邮件发送失败：{message}"
    except Exception as exc:
        return f"邮件发送失败：{exc}"


def send_email(subject: str, email_content: str) -> str:
    """Submit an email sending request through the configured Udesk ticket workflow."""
    return _submit_email_ticket(subject=subject, email_content=email_content)


def send_bill_email(
    customer_name: str = "",
    account_no: str = "",
    billing_period: str = "",
    invoice_no: str = "",
    bill_date: str = "",
    due_date: str = "",
    payment_status: str = "",
    meter_no: str = "",
    previous_reading: str = "",
    current_reading: str = "",
    consumption: str = "",
    energy_charge: str = "",
    mss_charge: str = "",
    metering_charge: str = "",
    carbon_tax: str = "",
    subtotal: str = "",
    gst: str = "",
    late_payment_charge: str = "",
    total_amount_due: str = "",
    pdf_link: str = PDF_BILL_LINK,
    language: str = "en",
) -> str:
    """Build and submit a structured PacificLight bill email with a safe subject and HTML body."""
    normalized_period = _normalize_billing_period(billing_period, language)
    subject = _sanitize_subject(
        f"PacificLight Electricity Bill {_normalize_text(invoice_no)} - {normalized_period}",
        "",
    )
    email_content = _bill_email_html(
        language=language,
        customer_name=customer_name,
        account_no=account_no,
        billing_period=billing_period,
        invoice_no=invoice_no,
        bill_date=bill_date,
        due_date=due_date,
        payment_status=payment_status,
        meter_no=meter_no,
        previous_reading=previous_reading,
        current_reading=current_reading,
        consumption=consumption,
        energy_charge=energy_charge,
        mss_charge=mss_charge,
        metering_charge=metering_charge,
        carbon_tax=carbon_tax,
        subtotal=subtotal,
        gst=gst,
        late_payment_charge=late_payment_charge,
        total_amount_due=total_amount_due,
        pdf_link=_normalize_pdf_link(pdf_link),
    )
    return _submit_email_ticket(subject=subject, email_content=email_content)


def send_email_163(to: str = "", subject: str = "", body: str = "", cc: str = "") -> str:
    """Compatibility wrapper for older calls. It submits the same Udesk email workflow."""
    parts = [f"To: {REGISTERED_RECIPIENT_EMAIL}"]
    if to and to != REGISTERED_RECIPIENT_EMAIL:
        parts.append(f"Requested recipient: {to}")
        parts.append("Note: The message will be sent to the registered account email sunlin@udesk.cn.")
    if cc:
        parts.append(f"Requested cc: {cc}")
    if body:
        parts.append(body)
    email_content = "\n\n".join(parts).strip()
    return _submit_email_ticket(subject=subject, email_content=email_content)


if __name__ == "__main__":
    print(send_email("PacificLight Email Test", "This is a test email content."))




