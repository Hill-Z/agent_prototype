import uuid
import urllib.parse


QUOTE_CONTEXTS = {
    "commercial_quote": {
        "zh": "访客正在浏览商业价格计划页面，可能需要商业报价。",
        "en": "The visitor is viewing the commercial price plan page and may need a commercial quote.",
    },
    "commercial_quote_retail": {
        "zh": "访客正在查看中小企业/门店电价方案，可能适合 Commercial Fixed 12。",
        "en": "The visitor is viewing SME or retail shop electricity plans and may be suitable for Commercial Fixed 12.",
    },
    "commercial_quote_manufacturing": {
        "zh": "访客正在查看高用电量商业方案，可能适合 Commercial Fixed 24。",
        "en": "The visitor is viewing high-consumption commercial plans and may be suitable for Commercial Fixed 24.",
    },
    "commercial_quote_green": {
        "zh": "访客正在查看绿色电力或可持续发展相关方案，可能适合 Commercial Green 24。",
        "en": "The visitor is viewing green electricity or sustainability-related plans and may be suitable for Commercial Green 24.",
    },
    "signup_abandoned": {
        "zh": "访客在开户注册流程中途停留，可能需要协助继续注册或切换到 WhatsApp 继续咨询。",
        "en": "The visitor stopped midway through the account sign-up flow and may need help continuing registration or moving the conversation to WhatsApp.",
    },
    "returning_customer": {
        "zh": "回访客户进入客户门户，可能需要账户服务。",
        "en": "A returning customer has entered the customer portal and may need account support.",
    },
    "termination": {
        "zh": "访客正在查看账户终止相关页面。",
        "en": "The visitor is viewing account termination information.",
    },
}


def _is_en(language=""):
    return str(language or "").lower().startswith("en")


def _context_text(trigger, language="zh"):
    item = QUOTE_CONTEXTS.get(trigger, QUOTE_CONTEXTS["commercial_quote"])
    return item["en" if _is_en(language) else "zh"]


def _default_prefill(trigger="", language="zh"):
    if trigger == "signup_abandoned":
        if _is_en(language):
            return "Hi PacificLight, I would like to continue my account sign-up enquiry on WhatsApp."
        return "您好 PacificLight，我想通过 WhatsApp 继续咨询开户注册。"
    if _is_en(language):
        return "Hi PacificLight, I would like to continue my enquiry on WhatsApp."
    return "您好 PacificLight，我想通过 WhatsApp 继续咨询。"


def get_web_context(trigger: str = "commercial_quote", language: str = "zh") -> str:
    """获取网站会话触发上下文。"""
    if _is_en(language):
        return f"Website context: {_context_text(trigger, language)}\nSuggested intent: {trigger}"
    return f"网站上下文：{_context_text(trigger, language)}\n建议意图：{trigger}"


def capture_lead(company_name: str = "", contact_name: str = "", email: str = "", phone: str = "", enquiry_type: str = "commercial_quote", language: str = "zh") -> str:
    """保存网站销售线索。"""
    if not email and not phone:
        return "Lead capture failed: please provide at least an email address or phone number." if _is_en(language) else "潜客捕获失败：请至少提供邮箱或电话。"
    lead_id = f"lead_{uuid.uuid4()}"
    if _is_en(language):
        return (f"Lead information has been saved.\n"
                f"Lead ID: {lead_id}\n"
                f"Company: {company_name or 'Not provided'}\n"
                f"Contact: {contact_name or 'Not provided'}\n"
                f"Email: {email or 'Not provided'}\n"
                f"Phone: {phone or 'Not provided'}\n"
                f"Enquiry Type: {enquiry_type}")
    return (f"潜客信息已保存。\n"
            f"Lead ID：{lead_id}\n"
            f"公司：{company_name or '未提供'}\n"
            f"联系人：{contact_name or '未提供'}\n"
            f"邮箱：{email or '未提供'}\n"
            f"电话：{phone or '未提供'}\n"
            f"咨询类型：{enquiry_type}")


def launch_whatsapp_link(prefill_text: str = "", trigger: str = "", language: str = "zh") -> str:
    """生成 WhatsApp 继续咨询链接。"""
    phone = "+6566000000"
    text = prefill_text or _default_prefill(trigger=trigger, language=language)
    encoded = urllib.parse.quote(text)
    link = f"https://wa.me/{phone.replace('+','')}?text={encoded}"
    if _is_en(language):
        return f"FINAL_ANSWER: You can continue this enquiry on WhatsApp using this link: {link}\nThe link is valid for 30 minutes."
    return f"FINAL_ANSWER: 您可以通过这个链接继续在 WhatsApp 咨询：{link}\n链接有效期 30 分钟。"
