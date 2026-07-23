import uuid

REGISTERED_EMAIL = "sunlin@udesk.cn"
SIGNUP_BASE_URL = "https://www.pacificlight.com.sg/sign-up-page/"

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


def _plan_label(label):
    return _orange(label)

def _rate_label(rate):
    return _orange(rate)

def _note(text):
    return _muted(text)

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
    # Real PacificLight online sign-up entry. Do not add generated ref/query parameters.
    return SIGNUP_BASE_URL


def _channel_label(channel="", en=False):
    raw = (channel or "email").lower()
    if raw == "email":
        return "email" if en else "邮件"
    return "email" if en else "邮件"


def _plan_cards(en=False):
    cards = []
    for p in PLANS.values():
        if en:
            cards.append(
                f"### {_plan_label(p['label'])}\n"
                f"- Contract: {p['contract']}\n"
                f"- Indicative Rate: {_rate_label(p['rate'])}\n"
                f"- Best for: {p['best_for_en']}"
            )
        else:
            cards.append(
                f"### {_plan_label(p['label'])}\n"
                f"- 合约期：{p.get('contract_zh', p['contract'])}\n"
                f"- 参考电价：{_rate_label(p['rate'])}\n"
                f"- 适合客户：{p['best_for_zh']}"
            )
    return "\n\n".join(cards)


def get_residential_fixed_plans(customer_scenario: str = "", dwelling_type: str = "", switching_from_retailer: str = "", language: str = "zh") -> str:
    """Return PacificLight residential fixed-price plans and recommendation."""
    en = _is_en(language)
    recommended_key = _recommend(customer_scenario, dwelling_type, switching_from_retailer)
    recommended = PLANS[recommended_key]

    if en:
        return f"""FINAL_ANSWER: ## Residential Fixed-Price Plans

Here are the fixed-price plans that may fit your home electricity needs:

{_plan_cards(en=True)}

**Recommended option:** {_plan_label(recommended['label'])}"""

    return f"""FINAL_ANSWER: ## 住宅固定价格计划

以下是适合家庭用电的固定价格计划：

{_plan_cards(en=False)}

**推荐计划：** {_plan_label(recommended['label'])}"""


def send_signup_link(channel: str = "email", contact: str = REGISTERED_EMAIL, plan: str = "fixed24", customer_scenario: str = "", language: str = "zh") -> str:
    """Return a customer-facing residential sign-up link card for email delivery."""
    en = _is_en(language)
    if not plan or plan not in PLANS:
        plan = _recommend(customer_scenario)
    if not contact:
        contact = REGISTERED_EMAIL
    link = _signup_url(plan=plan, channel="email")
    plan_label = PLANS[plan]["label"]

    if en:
        return f"""## Residential Sign-up Link

**Recommended Plan:** {_plan_label(plan_label)}  
**Recipient Email:** {contact}  
**Sign-up Link:** [Continue residential sign-up]({link})

I can email this sign-up link and plan summary to **{contact}** for you."""

    return f"""## 住宅开户注册链接

**推荐计划：** {_plan_label(plan_label)}  
**收件邮箱：** {contact}  
**开户链接：** [点击此处继续开户注册]({link})

我可以把开户链接和计划说明发送到 **{contact}**，方便您稍后继续办理。"""

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




