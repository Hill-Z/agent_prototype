CUSTOMERS = {
    "R-PL-1001": {
        "customer_id": "res_1001",
        "customer_type": "Residential",
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
    },
    "R-PL-1002": {
        "customer_id": "res_1002",
        "customer_type": "Residential",
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
    },
    "C-PL-2001": {
        "customer_id": "com_2001",
        "customer_type": "Commercial",
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
    },
}

BILLS = {
    "R-PL-1001": [
        {
            "invoice_no": "PL-R-202606-001",
            "period": "2026-06",
            "billing_period_start": "2026-06-01",
            "billing_period_end": "2026-06-30",
            "bill_date": "2026-07-01",
            "due_date": "2026-07-15",
            "status": "Outstanding",
            "meter_no": "MTR-884219",
            "previous_reading": 12458,
            "current_reading": 12910,
            "consumption_kwh": 452,
            "reading_type": "Actual Reading",
            "energy_charge": 118.85,
            "mss_charge": 2.90,
            "metering_charge": 0.90,
            "carbon_tax": 1.10,
            "late_payment_charge": 0.00,
            "gst_rate": 0.09,
        },
    ],
    "R-PL-1002": [
        {
            "invoice_no": "PL-R-202606-002",
            "period": "2026-06",
            "billing_period_start": "2026-06-01",
            "billing_period_end": "2026-06-30",
            "bill_date": "2026-07-02",
            "due_date": "2026-07-18",
            "status": "Paid",
            "meter_no": "MTR-552018",
            "previous_reading": 8812,
            "current_reading": 9126,
            "consumption_kwh": 314,
            "reading_type": "Actual Reading",
            "energy_charge": 82.16,
            "mss_charge": 1.95,
            "metering_charge": 0.90,
            "carbon_tax": 0.75,
            "late_payment_charge": 0.00,
            "gst_rate": 0.09,
        },
    ],
    "C-PL-2001": [
        {
            "invoice_no": "PL-C-202606-001",
            "period": "2026-06",
            "billing_period_start": "2026-06-01",
            "billing_period_end": "2026-06-30",
            "bill_date": "2026-07-01",
            "due_date": "2026-07-20",
            "status": "Outstanding",
            "meter_no": "MTR-COM-771029",
            "previous_reading": 884200,
            "current_reading": 896200,
            "consumption_kwh": 12000,
            "reading_type": "Actual Reading",
            "energy_charge": 2940.00,
            "mss_charge": 42.00,
            "metering_charge": 6.50,
            "carbon_tax": 28.80,
            "late_payment_charge": 0.00,
            "gst_rate": 0.09,
        },
        {
            "invoice_no": "PL-C-202605-001",
            "period": "2026-05",
            "billing_period_start": "2026-05-01",
            "billing_period_end": "2026-05-31",
            "bill_date": "2026-06-01",
            "due_date": "2026-06-20",
            "status": "Paid",
            "meter_no": "MTR-COM-771029",
            "previous_reading": 871900,
            "current_reading": 884200,
            "consumption_kwh": 12300,
            "reading_type": "Actual Reading",
            "energy_charge": 3012.40,
            "mss_charge": 43.05,
            "metering_charge": 6.50,
            "carbon_tax": 29.52,
            "late_payment_charge": 0.00,
            "gst_rate": 0.09,
        },
    ],
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


def _fmt_kwh(value):
    return f"{value:,} kWh"


def _bill_totals(bill):
    subtotal = round(
        bill["energy_charge"]
        + bill["mss_charge"]
        + bill["metering_charge"]
        + bill["carbon_tax"],
        2,
    )
    gst = round(subtotal * bill["gst_rate"], 2)
    total = round(subtotal + gst + bill["late_payment_charge"], 2)
    return subtotal, gst, total


def _is_en(language=""):
    return str(language or "").lower().startswith("en")


def _status_label(status, language="zh"):
    if _is_en(language):
        mapping = {"Outstanding": "Outstanding", "Paid": "Paid", "Open": "Outstanding", "open": "Outstanding", "paid": "Paid"}
    else:
        mapping = {"Outstanding": "未支付", "Paid": "已支付", "Open": "未支付", "open": "未支付", "paid": "已支付"}
    return mapping.get(status, status)



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


def _status_colored(status, language="zh"):
    label = _status_label(status, language)
    low = str(status or "").lower()
    return _green(label) if low == "paid" else _red(label)


def _amount_colored(amount):
    return _orange(_money(amount), size="16px")



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


def _reading_type_label(value, language="zh"):
    raw = str(value or "")
    if _is_en(language):
        return raw
    low = raw.lower()
    if low == "actual reading":
        return "实际抄表"
    if low == "estimated reading":
        return "估算读数"
    return raw

def _payment_note(bill, language="zh"):
    status = str(bill.get("status", "")).lower()
    if _is_en(language):
        if status == "paid":
            return "This bill has been paid. No further payment is required. You may keep this bill as your payment record. Would you like me to email this bill to your account email as well?"
        return f"Please complete the payment before {bill['due_date']} to avoid late payment charges. Would you like me to email this bill to your account email as well?"
    if status == "paid":
        return f"该账单已支付，无需再次付款。您可以保存本账单作为付款记录。是否需要我把这份账单发送到您的账户邮箱？"
    return f"请在 {bill['due_date']} 前完成付款，以避免产生逾期付款费用。是否需要我把这份账单发送到您的账户邮箱？"


def _build_plain_bill(customer, bill, verified, language="zh"):
    display_name = customer.get("company") or customer.get("name")
    subtotal, gst, total = _bill_totals(bill)
    status = _status_label(bill['status'], language)
    if _is_en(language):
        verification_line = "Identity verification has been completed." if verified else "I found the bill information for this account."
        return f"""{verification_line}

Electricity Bill Details

Total Amount Due: {_amount_colored(total)}  
Payment Status: {_status_colored(bill['status'], language)}  
Due Date: {bill['due_date']}

Account
- Customer: {display_name}
- Account No.: {customer['account_no']}
- Customer Type: {customer['customer_type']}
- Current Plan: {customer['current_plan']}
- Service Address: {customer['service_address']}
- Electricity Retailer: {customer['retailer']}

Bill
- Billing Period: {bill['billing_period_start']} to {bill['billing_period_end']}
- Invoice No.: {bill['invoice_no']}
- Bill Date: {bill['bill_date']}
- Late Payment Charge: {_money(bill['late_payment_charge'])}

Usage
- Meter No.: {bill['meter_no']}
- Previous Reading: {_fmt_kwh(bill['previous_reading'])}
- Current Reading: {_fmt_kwh(bill['current_reading'])}
- Consumption: {_fmt_kwh(bill['consumption_kwh'])}
- Reading Type: {bill['reading_type']}

Charges
- Energy Charge: {_money(bill['energy_charge'])}
- MSS Charge: {_money(bill['mss_charge'])}
- Metering Charge: {_money(bill['metering_charge'])}
- Carbon Tax: {_money(bill['carbon_tax'])}
- Subtotal: {_money(subtotal)}
- GST 9%: {_money(gst)}
- Late Payment Charge: {_money(bill['late_payment_charge'])}
- Total Amount Due: {_amount_colored(total)}

Payment Methods
- GIRO auto deduction
- AXS
- PayNow
- Internet Banking Bill Payment
- PacificLight Customer Portal

Note
{_payment_note(bill, language)}
"""
    verification_line = "身份验证已通过。" if verified else "已查询到账单信息。"
    return f"""{verification_line}

电费账单详情

应付总额： {_amount_colored(total)}  
付款状态： {_status_colored(bill['status'], language)}  
到期日： {bill['due_date']}

账户信息
- 客户姓名 / 公司：{display_name}
- 账户号：{customer['account_no']}
- 客户类型：{_customer_type_label(customer['customer_type'], language)}
- 当前套餐：{customer['current_plan']}
- 服务地址：{customer['service_address']}
- 电力零售商：{customer['retailer']}

账单信息
- 账单周期：{bill['billing_period_start']} 至 {bill['billing_period_end']}
- 发票号：{bill['invoice_no']}
- 出账日期：{bill['bill_date']}
- 逾期付款费用：{_money(bill['late_payment_charge'])}

用电信息
- 电表号：{bill['meter_no']}
- 上期读数：{_fmt_kwh(bill['previous_reading'])}
- 本期读数：{_fmt_kwh(bill['current_reading'])}
- 本期用电量：{_fmt_kwh(bill['consumption_kwh'])}
- 抄表方式：{_reading_type_label(bill['reading_type'], language)}

费用明细
- 电费：{_money(bill['energy_charge'])}
- 市场支持服务费（MSS）：{_money(bill['mss_charge'])}
- 电表服务费：{_money(bill['metering_charge'])}
- 碳税：{_money(bill['carbon_tax'])}
- 小计：{_money(subtotal)}
- GST 9%：{_money(gst)}
- 逾期付款费用：{_money(bill['late_payment_charge'])}
- 应付总额： {_amount_colored(total)}

付款方式
- GIRO 自动扣款
- AXS
- PayNow
- 网上银行账单付款
- PacificLight 客户门户

温馨提示
{_payment_note(bill, language)}
"""

def query_bill(account_no: str = "", customer_id: str = "", period: str = "latest", postal_code: str = "", id_last4: str = "", language: str = "zh") -> str:
    """查询 PacificLight 电费账单，并返回可直接展示的 plain-text FINAL_ANSWER。"""
    c = _find_customer(account_no=account_no, customer_id=customer_id)
    if not c:
        return "FINAL_ANSWER: Account bill information was not found. Please check the account number and provide it again." if _is_en(language) else "FINAL_ANSWER: 未找到该账户的账单信息。请您核对账户号后重新提供。"

    bill_list = BILLS.get(c["account_no"], [])
    if period and period != "latest":
        bill_list = [b for b in bill_list if b["period"] == period]
    if not bill_list:
        return "FINAL_ANSWER: No bill was found for this billing period. Please confirm the billing period and try again." if _is_en(language) else "FINAL_ANSWER: 暂未查询到该账期的账单。请您确认账期后再试。"

    b = bill_list[0]
    verified = bool((postal_code and postal_code == c.get("postal_code")) or (id_last4 and id_last4 == c.get("id_last4")) or postal_code or id_last4)
    return "FINAL_ANSWER: " + _build_plain_bill(c, b, verified, language)


