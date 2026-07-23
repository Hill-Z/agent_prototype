import uuid

REGISTERED_EMAIL = "sunlin@udesk.cn"
SIGNUP_BASE_URL = "https://www.pacificlight.com.sg/residential/sign-up"

PLANS = {
    "fixed12": {
        "label": "Residential Fixed 12",
        "contract": "12 months",
        "contract_zh": "12 个月",
        "rate": "SGD 0.279/kWh",
        "best_for_en": "customers who prefer a shorter fixed-price commitment",
        "best_for_zh": "希望先选择较短固定价格周期的家庭客户",
    },
    "fixed24": {
        "label": "Residential Fixed 24",
        "contract": "24 months",
        "contract_zh": "24 个月",
        "rate": "SGD 0.272/kWh",
        "best_for_en": "HDB flats and customers switching from another retailer who want predictable monthly costs",
        "best_for_zh": "HDB 住户或从其他电力零售商切换、希望月度费用更可预估的家庭客户",
    },
    "green24": {
        "label": "Residential Green 24",
        "contract": "24 months",
        "contract_zh": "24 个月",
        "rate": "SGD 0.289/kWh",
        "best_for_en": "customers who prefer renewable energy attributes and longer-term price certainty",
        "best_for_zh": "关注绿色电力属性并希望锁定较长期价格的家庭客户",
    },
}


def _is_en(language=""):
    return str(language or "").lower().startswith("en")


def _recommend(customer_scenario="", dwelling_type="", switching_from_retailer=""):
    text = f"{customer_scenario} {dwelling_type} {switching_from_retailer}".lower()
    if "green" in text or "renewable" in text or "绿色" in text or "环保" in text:
        return "green24"
    if "switch" in text or "retailer" in text or "hdb" in text or "flat" in text or "转" in text or "切换" in text or "四房" in text:
        return "fixed24"
    if "short" in text or "12" in text or "短" in text:
        return "fixed12"
    return "fixed24"


def _signup_url(plan="fixed24", channel="email"):
    ref = uuid.uuid4().hex[:8].upper()
    return f"{SIGNUP_BASE_URL}?plan={plan or 'fixed24'}&ref=PL{ref}&channel={channel or 'email'}"


def _channel_label(channel="", en=False):
    raw = (channel or "email").lower()
    if raw == "email":
        return "email" if en else "邮件"
    return "email" if en else "邮件"


def _plan_rows(en=False):
    if en:
        return "\n".join(
            f"| {p['label']} | {p['contract']} | {p['rate']} | {p['best_for_en']} |"
            for p in PLANS.values()
        )
    return "\n".join(
        f"| {p['label']} | {p.get('contract_zh', p['contract'])} | {p['rate']} | {p['best_for_zh']} |"
        for p in PLANS.values()
    )


def get_residential_fixed_plans(customer_scenario: str = "", dwelling_type: str = "", switching_from_retailer: str = "", language: str = "zh") -> str:
    """Return PacificLight residential fixed-price plans and recommendation."""
    en = _is_en(language)
    recommended_key = _recommend(customer_scenario, dwelling_type, switching_from_retailer)
    recommended = PLANS[recommended_key]

    if en:
        return f"""## Residential Fixed-Price Plans

| Plan | Contract | Indicative Rate | Best For |
|---|---:|---:|---|
{_plan_rows(en=True)}

**Recommended option:** {recommended['label']}

For your profile, {recommended['label']} is a good fit because it gives you fixed-price certainty over {recommended['contract']}.

The rates above are indicative. Final plan details and eligibility will be confirmed during online sign-up."""

    return f"""## 住宅固定价格计划

| 计划 | 合同期 | 参考电价 | 适合客户 |
|---|---:|---:|---|
{_plan_rows(en=False)}

**推荐计划：** {recommended['label']}

按您当前情况，{recommended['label']} 会比较合适，因为它可以在 {recommended.get('contract_zh', recommended['contract'])} 内提供固定价格确定性，月度费用更容易预估。

以上为参考计划信息，最终计划详情和适用资格以在线开户注册页面确认为准。"""


def send_signup_link(channel: str = "email", contact: str = REGISTERED_EMAIL, plan: str = "fixed24", customer_scenario: str = "", language: str = "zh") -> str:
    """Return a residential sign-up link prepared for email delivery. Continue with email_send.send_email."""
    en = _is_en(language)
    if not plan or plan not in PLANS:
        plan = _recommend(customer_scenario)
    if not contact:
        contact = REGISTERED_EMAIL
    link = _signup_url(plan=plan, channel="email")
    plan_label = PLANS[plan]["label"]
    channel_label = _channel_label("email", en=en)

    if en:
        return (f"Sign-up link prepared for {channel_label} delivery.\n"
                f"Recipient: {contact}\n"
                f"Recommended Plan: {plan_label}\n"
                f"Sign-up Link: {link}\n"
                f"Next step: call email_send.send_email with the subject and HTML content from prepare_signup_email(...).")

    return (f"开户链接已准备好通过{channel_label}发送。\n"
            f"收件邮箱：{contact}\n"
            f"推荐计划：{plan_label}\n"
            f"开户链接：{link}\n"
            f"下一步：调用 email_send.send_email，并使用 prepare_signup_email(...) 返回的邮件主题和 HTML 正文。")


def prepare_signup_email(plan: str = "fixed24", recipient_email: str = REGISTERED_EMAIL, customer_scenario: str = "", dwelling_type: str = "", language: str = "zh") -> str:
    """Prepare subject and HTML body for a residential sign-up email."""
    en = _is_en(language)
    if not plan or plan not in PLANS:
        plan = _recommend(customer_scenario, dwelling_type)
    if not recipient_email:
        recipient_email = REGISTERED_EMAIL
    p = PLANS[plan]
    link = _signup_url(plan=plan, channel="email")

    if en:
        subject = f"PacificLight {p['label']} Sign-up Link"
        body = f"""
<div style='font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#111827'>
  <p>Dear Customer,</p>
  <p>Thank you for your interest in PacificLight residential electricity plans.</p>
  <p>Based on your enquiry, <strong>{p['label']}</strong> may be a suitable option.</p>
  <table style='border-collapse:collapse;margin:12px 0;max-width:760px'>
    <tr><th style='text-align:left;padding:8px 10px;border:1px solid #e5e7eb;background:#f8fafc'>Recommended Plan</th><td style='padding:8px 10px;border:1px solid #e5e7eb'>{p['label']}</td></tr>
    <tr><th style='text-align:left;padding:8px 10px;border:1px solid #e5e7eb;background:#f8fafc'>Contract Period</th><td style='padding:8px 10px;border:1px solid #e5e7eb'>{p['contract']}</td></tr>
    <tr><th style='text-align:left;padding:8px 10px;border:1px solid #e5e7eb;background:#f8fafc'>Indicative Rate</th><td style='padding:8px 10px;border:1px solid #e5e7eb'>{p['rate']}</td></tr>
    <tr><th style='text-align:left;padding:8px 10px;border:1px solid #e5e7eb;background:#f8fafc'>Best For</th><td style='padding:8px 10px;border:1px solid #e5e7eb'>{p['best_for_en']}</td></tr>
  </table>
  <p>You can continue your application here: <a href='{link}' target='_blank' rel='noopener noreferrer'>Continue residential sign-up</a></p>
  <p>If any supporting document is required, the sign-up portal will show it during the application.</p>
  <p>Best regards,<br><strong>PacificLight Customer Service</strong><br>PacificLight Energy</p>
</div>
""".strip()
        return f"SUBJECT: {subject}\nRECIPIENT: {recipient_email}\nSIGNUP_LINK: {link}\nEMAIL_HTML:\n{body}"

    subject = f"PacificLight {p['label']} 开户注册链接"
    body = f"""
<div style='font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#111827'>
  <p>尊敬的客户，</p>
  <p>感谢您咨询 PacificLight 住宅用电计划。</p>
  <p>根据您当前的咨询情况，<strong>{p['label']}</strong> 会比较适合。</p>
  <table style='border-collapse:collapse;margin:12px 0;max-width:760px'>
    <tr><th style='text-align:left;padding:8px 10px;border:1px solid #e5e7eb;background:#f8fafc'>推荐计划</th><td style='padding:8px 10px;border:1px solid #e5e7eb'>{p['label']}</td></tr>
    <tr><th style='text-align:left;padding:8px 10px;border:1px solid #e5e7eb;background:#f8fafc'>合约周期</th><td style='padding:8px 10px;border:1px solid #e5e7eb'>{p.get('contract_zh', p['contract'])}</td></tr>
    <tr><th style='text-align:left;padding:8px 10px;border:1px solid #e5e7eb;background:#f8fafc'>参考电价</th><td style='padding:8px 10px;border:1px solid #e5e7eb'>{p['rate']}</td></tr>
    <tr><th style='text-align:left;padding:8px 10px;border:1px solid #e5e7eb;background:#f8fafc'>适合客户</th><td style='padding:8px 10px;border:1px solid #e5e7eb'>{p['best_for_zh']}</td></tr>
  </table>
  <p>您可以通过以下链接继续完成开户注册：<a href='{link}' target='_blank' rel='noopener noreferrer'>点击此处继续开户注册</a></p>
  <p>如果后续需要补充文件，开户注册页面会在对应步骤提示您。</p>
  <p>此致，<br><strong>PacificLight Customer Service</strong><br>PacificLight Energy</p>
</div>
""".strip()
    return f"SUBJECT: {subject}\nRECIPIENT: {recipient_email}\nSIGNUP_LINK: {link}\nEMAIL_HTML:\n{body}"
