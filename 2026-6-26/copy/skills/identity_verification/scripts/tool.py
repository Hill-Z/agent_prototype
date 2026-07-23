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


def _digits(value=""):
    return "".join(ch for ch in str(value or "") if ch.isdigit())


def _norm_account(value=""):
    return str(value or "").strip().upper().replace(" ", "")


def _find_customer(account_no="", phone="", email="", customer_id=""):
    """Find customer with account_no as the authoritative locator when present."""
    normalized_account = _norm_account(account_no)
    if normalized_account:
        for c in CUSTOMERS.values():
            if _norm_account(c.get("account_no")) == normalized_account:
                return c
        return None

    # Fallback only when account number is not provided. The registered email may
    # be shared by multiple records, so email must not override an explicit account_no.
    phone_digits = _digits(phone)
    email_norm = str(email or "").strip().lower()
    for c in CUSTOMERS.values():
        if phone_digits and _digits(c.get("phone")) == phone_digits:
            return c
        if email_norm and c.get("email", "").strip().lower() == email_norm:
            return c
        if customer_id and c.get("customer_id") == customer_id:
            return c
    return None


def _money(amount):
    return f"SGD {amount:.2f}"


def _customer_type_label(value, language="zh"):
    raw = str(value or "")
    if str(language or "").lower().startswith("en"):
        return raw
    low = raw.lower()
    if low == "residential":
        return "住宅客户"
    if low == "commercial":
        return "商业客户"
    return raw


def verify_identity(account_no: str = "", postal_code: str = "", phone: str = "", email: str = "", id_last4: str = "", language: str = "zh") -> str:
    """Verify PacificLight identity. Main path: account_no + billing postal code."""
    en = str(language or "").lower().startswith("en")
    c = _find_customer(account_no=account_no, phone=phone, email=email)
    if not c:
        return "Verification failed: no matching customer was found. Please check the account number." if en else "验证失败：未找到匹配客户。请确认账户号。"

    matched = []
    postal_digits = _digits(postal_code)
    expected_postal = _digits(c.get("postal_code"))
    id_digits = _digits(id_last4)
    expected_id = _digits(c.get("id_last4"))

    if postal_digits and postal_digits == expected_postal:
        matched.append("postal_code")
    if id_digits and id_digits == expected_id:
        matched.append("id_last4")

    if not matched:
        if en:
            return "Verification failed: the account was found, but the billing postal code does not match our records. Please double-check the 6-digit billing postal code."
        return "验证失败：账户存在，但账单邮编与记录不匹配。请核对账单上的6位邮编后重新提供。"

    display_name = c.get("company") or c.get("name")
    if en:
        return (f"Verification successful. Customer: {display_name}\n"
                f"Customer Type: {c['customer_type']}\n"
                f"Customer ID: {c['customer_id']}\n"
                f"Account No.: {c['account_no']}\n"
                f"CRM: {c['crm']}\n"
                f"Verified Fields: {', '.join(matched)}")
    return (f"验证成功。客户：{display_name}\n"
            f"客户类型：{_customer_type_label(c['customer_type'], language)}\n"
            f"客户ID：{c['customer_id']}\n"
            f"账户号：{c['account_no']}\n"
            f"CRM：{c['crm']}\n"
            f"验证字段：{', '.join(matched)}")
