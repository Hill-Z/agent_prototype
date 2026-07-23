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
def manage_consent(account_no: str = "", phone: str = "", email: str = "", channel: str = "whatsapp", action: str = "query", consent_type: str = "") -> str:
    """查询或更新 PacificLight consent。"""
    c = _find_customer(account_no=account_no, phone=phone, email=email)
    if not c:
        return "未找到客户，无法处理 Consent。"
    key = consent_type or channel
    if key == "marketing":
        key = "email_marketing"
    current = c.get("consent", {}).get(key, False)
    if action in ["opt_in", "grant", "update"]:
        current = True
    elif action in ["opt_out", "revoke"]:
        current = False
    status = "已订阅/同意" if current else "已退订/不同意"
    return f"Consent 已处理。账户号：{c['account_no']}\n项目：{key}\n当前状态：{status}\n审计编号：CONSENT-202606-001"
