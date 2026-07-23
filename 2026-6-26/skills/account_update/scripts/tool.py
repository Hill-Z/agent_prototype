import uuid

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


def _customer(account_no=""):
    return CUSTOMERS.get((account_no or "").upper())


def _case_id(kind="UPD"):
    return f"PL-{kind.upper()}-{uuid.uuid4().hex[:8].upper()}"


def get_customer_update_profile(account_no: str = "", language: str = "zh") -> str:
    """Return editable account profile for a verified customer."""
    en = _is_en(language)
    c = _customer(account_no)
    if not c:
        return "Account profile not found. Please check the account number." if en else "未找到对应账户资料，请核对账户号。"
    display = c.get("company") or c.get("name")

    if en:
        return f"""## Account Profile

| Field | Value |
|---|---|
| Customer | {display} |
| Account No. | {c['account_no']} |
| Customer Type | {c['customer_type']} |
| Current Plan | {c['current_plan']} |
| Contract End Date | {c['contract_end_date']} |
| Service Address | {c['service_address']} |
| Registered Email | {c['email']} |
| Contact Phone | {c['phone']} |
| Billing Delivery | {c['billing_delivery']} |

Editable items: contact phone number, registered email address, billing delivery preference, service address / move-house request. For commercial accounts, additional report or billing recipients require account administrator approval."""

    return f"""## 账户资料

| 字段 | 内容 |
|---|---|
| 客户 | {display} |
| 账户号 | {c['account_no']} |
| 客户类型 | {c['customer_type']} |
| 当前套餐 | {c['current_plan']} |
| 合同到期日 | {c['contract_end_date']} |
| 服务地址 | {c['service_address']} |
| 登记邮箱 | {c['email']} |
| 联系电话 | {c['phone']} |
| 账单接收方式 | {c['billing_delivery']} |

可变更项目：联系电话、登记邮箱、账单接收方式、服务地址 / 搬家转移账户。商业账户如需新增报告或账单收件人，需要账户管理员审批。"""


def submit_account_update(account_no: str = "", update_type: str = "", new_value: str = "", effective_date: str = "", notes: str = "", language: str = "zh") -> str:
    """Submit an account update or move-house service request."""
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
            return (f"FINAL_ANSWER: Created. I’ve submitted an {label_en} for {display}.\n\n"
                    f"Case ID: {cid}\n"
                    f"Account No.: {c['account_no']}\n"
                    f"Requested recipient / detail: {new_value or 'Not provided'}\n"
                    f"Status: Pending account administrator approval. Reports or billing documents will only be sent to the additional recipient after approval.")
        return (f"FINAL_ANSWER: 已创建。已为 {display} 提交{label_zh}。\n\n"
                f"Case ID：{cid}\n"
                f"账户号：{c['account_no']}\n"
                f"申请收件人 / 详情：{new_value or '未提供'}\n"
                f"状态：待账户管理员审批。审批通过后，报告或账单文件才会发送至新增收件人。")

    if update_type == "move_house":
        if en:
            return (f"FINAL_ANSWER: Your move-house service request has been created.\n\n"
                    f"Case ID: {cid}\n"
                    f"Account No.: {c['account_no']}\n"
                    f"Current Plan: {c['current_plan']}\n"
                    f"Current Service Address: {c['service_address']}\n"
                    f"New Address / Postal Code: {new_value or 'Not provided'}\n"
                    f"Preferred Effective Date: {effective_date or 'Not provided'}\n\n"
                    f"If the current contract ends early, Early Termination Charges may apply. The Care Team will confirm after checking your contract terms.")
        return (f"FINAL_ANSWER: 您的搬家服务请求已创建。\n\n"
                f"Case ID：{cid}\n"
                f"账户号：{c['account_no']}\n"
                f"当前套餐：{c['current_plan']}\n"
                f"当前服务地址：{c['service_address']}\n"
                f"新地址 / 邮编：{new_value or '未提供'}\n"
                f"期望生效日期：{effective_date or '未提供'}\n\n"
                f"如果当前合约提前结束，可能会产生 Early Termination Charges，Care Team 会根据合约条款进一步确认。")

    if en:
        return (f"FINAL_ANSWER: Your {label_en} has been submitted.\n\n"
                f"Case ID: {cid}\n"
                f"Account No.: {c['account_no']}\n"
                f"Requested Change: {new_value or 'Not provided'}\n"
                f"Effective Date: {effective_date or 'As soon as processed'}\n"
                f"Status: Submitted for processing.")
    return (f"FINAL_ANSWER: 您的{label_zh}已提交。\n\n"
            f"Case ID：{cid}\n"
            f"账户号：{c['account_no']}\n"
            f"变更内容：{new_value or '未提供'}\n"
            f"生效日期：{effective_date or '处理完成后尽快生效'}\n"
            f"状态：已提交处理。")
