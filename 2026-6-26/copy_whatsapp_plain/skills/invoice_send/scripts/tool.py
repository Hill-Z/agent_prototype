CUSTOMERS = {
    "R-PL-1001": {
        "customer_id": "res_1001",
        "customer_type": "residential",
        "name": "Tan Mei Ling",
        "phone": "+6591234567",
        "email": "sunlin@udesk.cn",
        "account_no": "R-PL-1001",
        "postal_code": "238888",
        "id_last4": "1234",
        "crm": "Velocity CRM",
        "status": "active",
        "current_plan": "Residential Saver 24",
        "contract_end_date": "2026-12-31",
        "service_address": "Orchard Road, Singapore 238888",
        "retailer": "PacificLight Energy",
        "payment_method": "GIRO / AXS / PayNow / Internet Banking",
        "consent": {"whatsapp": True, "sms": False, "email_marketing": True, "account_notifications": True},
    },
    "R-PL-1002": {
        "customer_id": "res_1002",
        "customer_type": "residential",
        "name": "Nur Aisyah Binte Rahman",
        "phone": "+6588765432",
        "email": "sunlin@udesk.cn",
        "account_no": "R-PL-1002",
        "postal_code": "520201",
        "id_last4": "6721",
        "crm": "Velocity CRM",
        "status": "active",
        "current_plan": "Residential Standard",
        "contract_end_date": "2027-03-31",
        "service_address": "Tampines Street 21, Singapore 520201",
        "retailer": "PacificLight Energy",
        "payment_method": "PayNow / AXS / Internet Banking",
        "consent": {"whatsapp": False, "sms": True, "email_marketing": False, "account_notifications": True},
    },
    "C-PL-2001": {
        "customer_id": "com_2001",
        "customer_type": "commercial",
        "company": "ABC Manufacturing Pte Ltd",
        "contact_person": "Ms Lim",
        "phone": "+6566018899",
        "email": "sunlin@udesk.cn",
        "account_no": "C-PL-2001",
        "postal_code": "609999",
        "id_last4": "8899",
        "crm": "Microsoft 365 CRM",
        "assigned_sales": "sunlin@udesk.cn",
        "status": "renewal_due",
        "current_plan": "Commercial Fixed 24",
        "contract_end_date": "2026-09-30",
        "average_consumption_kwh": 12000,
        "payment_method": "GIRO",
        "service_address": "Jurong Industrial Estate, Singapore 609999",
        "retailer": "PacificLight Energy",
        "consent": {"whatsapp": True, "sms": True, "email_marketing": False, "account_notifications": True},
    },
}

BILLS = {
    "R-PL-1001": [
        {"invoice_no": "PL-R-202606-001", "period": "2026-06", "amount": 134.89, "currency": "SGD", "due_date": "2026-07-15", "status": "Outstanding", "late_payment_charge": 0.00},
    ],
    "R-PL-1002": [
        {"invoice_no": "PL-R-202606-002", "period": "2026-06", "amount": 91.82, "currency": "SGD", "due_date": "2026-07-18", "status": "Paid", "late_payment_charge": 0.00},
    ],
    "C-PL-2001": [
        {"invoice_no": "PL-C-202606-001", "period": "2026-06", "amount": 3288.86, "currency": "SGD", "due_date": "2026-07-20", "status": "Outstanding", "late_payment_charge": 0.00},
        {"invoice_no": "PL-C-202605-001", "period": "2026-05", "amount": 3370.99, "currency": "SGD", "due_date": "2026-06-20", "status": "Paid", "late_payment_charge": 0.00},
    ],
}

RATE_CARDS = {
    "residential": {
        "standard": {"label": "Residential Standard", "rate": 0.285},
        "saver24": {"label": "Residential Saver 24", "rate": 0.272},
    },
    "commercial": {
        "fixed12": {"label": "Commercial Fixed 12", "rate": 0.255},
        "fixed24": {"label": "Commercial Fixed 24", "rate": 0.245},
        "green24": {"label": "Commercial Green 24", "rate": 0.262},
    },
}


def _find_customer(account_no="", phone="", email="", customer_id=""):
    for c in CUSTOMERS.values():
        if account_no and c.get("account_no", "").lower() == account_no.lower():
            return c
        if phone and c.get("phone") == phone:
            return c
        if email and c.get("email", "").lower() == email.lower():
            return c
        if customer_id and c.get("customer_id") == customer_id:
            return c
    return None


def _money(amount):
    return f"SGD {amount:.2f}"


def _is_en(language=""):
    return str(language or "").lower().startswith("en")

import uuid

REGISTERED_RECIPIENT_EMAIL = "sunlin@udesk.cn"
PDF_SOURCE_DOWNLOAD_URL = "https://ali-s5-km-pub-std.udeskcs.com/Data/15/4e10eca6-8350-456a-8082-ddd140673ef3/PacificLight_Electricity_Bill_R-PL-1001_2026-06.pdf"
PDF_DOWNLOAD_URL = "https://espreview.s4.udesk.cn/onlinePreview?url=RDZDQUNBQ0VDRDg0OTE5MURGRDJENzkzQ0Q4QjkzRDVEMzkzQ0VDQkRDOTNDRENBREE5MENCREFEQkNERDVERENEOTBEREQxRDM5MUZBREZDQURGOTE4RjhCOTE4QjhGOEJERDhEOEM4OEQ4OTM4OTg4REQ4RjkzOEE4OUQ4ODk5M0RDRENEODg5OTM4RDhDREY4RkRBREY4RDhEOEI4RURBOEQ5MUVFREZEREQ3RDhEN0RERjJEN0Q5RDZDQUUxRkJEMkRCRERDQUNDRDdEREQ3Q0FDN0UxRkNEN0QyRDJFMUVDOTNFRUYyOTM4RjhFOEU4RkUxOEM4RThDODg5MzhFODg5MENFREFEODgxREREMUQwQ0FEQkQwQ0E4Mw%3D%3D"


def _pdf_markdown_link(language="zh"):
    label = "Click here to view the PDF document" if _is_en(language) else "点击此处查看 PDF 文档"
    return f"{label}: {PDF_DOWNLOAD_URL}"


def send_invoice(account_no: str = "", invoice_no: str = "", recipient_email: str = "", channel: str = "email", language: str = "zh") -> str:
    """Send or show a PacificLight invoice/PDF bill link in customer-facing language."""
    c = _find_customer(account_no=account_no)
    if not c:
        return "FINAL_ANSWER: Customer not found, so the invoice cannot be sent." if _is_en(language) else "FINAL_ANSWER: 未找到客户，无法发送发票。"
    bill_list = BILLS.get(c["account_no"], [])
    if invoice_no:
        bill_list = [b for b in bill_list if b["invoice_no"] == invoice_no]
    if not bill_list:
        return "FINAL_ANSWER: The requested invoice was not found." if _is_en(language) else "FINAL_ANSWER: 未找到对应发票。"
    b = bill_list[0]
    to = REGISTERED_RECIPIENT_EMAIL
    link_only = str(channel or "").lower() in {"link", "pdf", "view", "download"}
    if _is_en(language):
        if link_only:
            return (f"FINAL_ANSWER: Sure — you can view the PDF bill here: {_pdf_markdown_link(language)}\n\n"
                    f"Invoice No.: {b['invoice_no']} | Billing Period: {b['period']} | Amount: {_money(b['amount'])}")
        return (f"FINAL_ANSWER: Done — I’ve sent the invoice PDF link to the registered account email {to}. Please check your inbox.\n\n"
                f"Invoice No.: {b['invoice_no']} | Billing Period: {b['period']} | Amount: {_money(b['amount'])}\n"
                f"PDF Document: {_pdf_markdown_link(language)}")
    if link_only:
        return (f"FINAL_ANSWER: 可以，您可以点击这里查看 PDF 账单：{_pdf_markdown_link(language)}\n\n"
                f"发票号：{b['invoice_no']}｜账期：{b['period']}｜账单金额：{_money(b['amount'])}")
    return (f"FINAL_ANSWER: 好的，发票 PDF 链接已发送到您的账户登记邮箱 {to}，请留意查收。\n\n"
            f"发票号：{b['invoice_no']}｜账期：{b['period']}｜账单金额：{_money(b['amount'])}\n"
            f"PDF 文档：{_pdf_markdown_link(language)}")

