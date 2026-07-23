import re

COMMERCIAL_REGISTRATION_URL = "https://www.pacificlight.com.sg/business/low-tension-registration"

RATE_CARDS = {
    "commercial": {
        "fixed12": {
            "label": "Commercial Fixed 12",
            "rate": 0.255,
            "recommended_for": "small_business",
            "description_zh": "适合中小型门店、办公室和用电量较稳定的商业客户。",
            "description_en": "Suitable for SMEs, retail shops, offices and commercial customers with stable electricity consumption.",
        },
        "fixed24": {
            "label": "Commercial Fixed 24",
            "rate": 0.245,
            "recommended_for": "manufacturing",
            "description_zh": "适合制造业、仓储、工业园区等月用电量较高且希望锁定较长价格周期的客户。",
            "description_en": "Suitable for manufacturing, warehousing and industrial customers with higher monthly consumption who prefer a longer fixed-price period.",
        },
        "green24": {
            "label": "Commercial Green 24",
            "rate": 0.262,
            "recommended_for": "green_business",
            "description_zh": "适合有 ESG、绿色电力或可持续发展诉求的商业客户。",
            "description_en": "Suitable for businesses with ESG, green electricity or sustainability requirements.",
        },
    },
    "residential": {
        "standard": {"label": "Residential Standard", "rate": 0.285, "description_zh": "标准住宅价格计划。", "description_en": "Standard residential price plan."},
        "saver24": {"label": "Residential Saver 24", "rate": 0.272, "description_zh": "适合希望锁定 24 个月价格的住宅客户。", "description_en": "Suitable for residential customers who want to lock in the price for 24 months."},
    },
}

COMMERCIAL_QUOTE_PROFILES = {
    "retail12": {
        "company_name": "BrightMart Retail Pte Ltd",
        "customer_type": "commercial",
        "plan": "fixed12",
        "average_consumption_kwh": 3500,
        "contract_duration_months": 12,
        "payment_method": "GIRO",
        "business_type": "Retail shop",
        "scenario_zh": "小型零售门店，希望短周期固定价格。",
        "scenario_en": "Small retail shop looking for a shorter fixed-price contract.",
    },
    "manufacturing24": {
        "company_name": "ABC Manufacturing Pte Ltd",
        "customer_type": "commercial",
        "plan": "fixed24",
        "average_consumption_kwh": 12000,
        "contract_duration_months": 24,
        "payment_method": "GIRO",
        "business_type": "Manufacturing",
        "scenario_zh": "制造业客户，用电量较高，希望锁定 24 个月价格。",
        "scenario_en": "Manufacturing customer with higher electricity usage, looking to lock in pricing for 24 months.",
    },
    "green24": {
        "company_name": "GreenBite Foods Pte Ltd",
        "customer_type": "commercial",
        "plan": "green24",
        "average_consumption_kwh": 8000,
        "contract_duration_months": 24,
        "payment_method": "Bank Transfer",
        "business_type": "Food services / ESG-focused business",
        "business_type_zh": "餐饮服务 / ESG 绿色电力客户",
        "business_type_en": "Food services / ESG-focused business",
        "start_date": "2026-09-01",
        "scenario_zh": "关注可持续发展和绿色电力形象的商业客户。",
        "scenario_en": "Commercial customer focused on sustainability and green electricity positioning.",
    },
    "sunrise_bakery24": {
        "company_name": "Sunrise Bakery Pte Ltd",
        "customer_type": "commercial",
        "plan": "fixed24",
        "average_consumption_kwh": 8000,
        "contract_duration_months": 24,
        "payment_method": "GIRO",
        "business_type": "Bakery / food service",
        "business_type_zh": "烘焙 / 餐饮服务",
        "business_type_en": "Bakery / food service",
        "start_date": "2026-09-01",
        "scenario_zh": "烘焙/餐饮类商业客户，希望按预估用电量先获得稳定预算参考。",
        "scenario_en": "Bakery / food service customer looking for predictable electricity budgeting.",
        "plan_notes_zh": "适合希望锁定 24 个月固定电价、让月度电费更容易预估的烘焙和餐饮类商业客户。",
        "plan_notes_en": "Suitable for bakery and food-service businesses that want a 24-month fixed electricity rate for more predictable monthly budgeting.",
    },
}


def _money(amount):
    return f"SGD {amount:.2f}"


def _is_en(language=""):
    return str(language or "").lower().startswith("en")


def _normalize_start_date(start_date="", profile=None, language="zh"):
    """Keep quote dates realistic and avoid stale/hallucinated years."""
    en = _is_en(language)
    value = str(start_date or "").strip()
    year_match = re.search(r"(20\d{2})", value)
    if year_match and int(year_match.group(1)) < 2026:
        value = ""
    if not value and profile:
        value = str(profile.get("start_date", "") or "").strip()
    return value or ("To be confirmed" if en else "待确认")


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


def _amount_colored(amount):
    return _orange(_money(amount), size="16px")


def _plan_colored(plan):
    return _orange(plan)


def _indicative_label(text):
    return _amber(text)


def _normalize_plan(plan="", contract_duration_months=""):
    raw = str(plan or "").strip().lower().replace("-", "_").replace(" ", "_")
    months = str(contract_duration_months or "").strip().lower()
    if raw in {"commercial_fixed_24m", "commercial_fixed_24", "commercial_24m", "fixed_24", "fixed_24m", "24", "24m", "24_month", "24_months", "24个月"}:
        return "fixed24"
    if raw in {"commercial_fixed_12m", "commercial_fixed_12", "commercial_12m", "fixed_12", "fixed_12m", "12", "12m", "12_month", "12_months", "12个月"}:
        return "fixed12"
    if raw in {"commercial_green_24m", "green_24", "green_24m", "green24", "green"}:
        return "green24"
    if raw in {"fixed24", "fixed12", "green24", "standard", "saver24"}:
        return raw
    if not raw:
        if months.startswith("12"):
            return "fixed12"
        if months.startswith("24"):
            return "fixed24"
    return raw


def _infer_business_type_key(company_name="", business_type=""):
    text = f"{company_name} {business_type}".lower()
    if any(x in text for x in ["bakery", "cafe", "restaurant", "food", "bistro", "kitchen", "餐饮", "烘焙", "面包"]):
        return "bakery"
    if any(x in text for x in ["retail", "mart", "shop", "store", "零售", "门店"]):
        return "retail"
    if any(x in text for x in ["manufacturing", "factory", "industrial", "warehouse", "制造", "工厂", "仓储", "工业"]):
        return "manufacturing"
    return "commercial"


def _business_type_label(company_name="", business_type="", language="en"):
    key = _infer_business_type_key(company_name, business_type)
    en = _is_en(language)
    labels = {
        "bakery": ("Bakery / food service", "烘焙 / 餐饮服务"),
        "retail": ("Retail shop", "零售门店"),
        "manufacturing": ("Manufacturing / industrial", "制造业 / 工业客户"),
        "commercial": ("Commercial business", "商业客户"),
    }
    return labels[key][0 if en else 1]


def _infer_business_type(company_name="", business_type=""):
    return _business_type_label(company_name, business_type, "en")


def _resolve_profile(company_name="", plan="", average_consumption_kwh="", contract_duration_months="", business_type=""):
    text = f"{company_name} {business_type} {plan} {contract_duration_months}".lower()
    business_key = _infer_business_type_key(company_name, business_type)
    if "sunrise" in text or business_key == "bakery":
        return COMMERCIAL_QUOTE_PROFILES["sunrise_bakery24"]
    if "greenbite" in text or "green" in text or "esg" in text or plan == "green24":
        return COMMERCIAL_QUOTE_PROFILES["green24"]
    if "brightmart" in text or "retail" in text or plan == "fixed12" or average_consumption_kwh in ["3500", 3500]:
        return COMMERCIAL_QUOTE_PROFILES["retail12"]
    if "abc" in text or "manufacturing" in text or "factory" in text or "industrial" in text or average_consumption_kwh in ["12000", 12000]:
        return COMMERCIAL_QUOTE_PROFILES["manufacturing24"]
    if plan == "fixed24" and business_key == "manufacturing":
        return COMMERCIAL_QUOTE_PROFILES["manufacturing24"]
    return None



def _html_escape(value=""):
    return (str(value or "")
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;"))


def _quote_data(customer_type: str = "commercial", plan: str = "", average_consumption_kwh: str = "", contract_duration_months: str = "24", company_name: str = "", payment_method: str = "", business_type: str = "", start_date: str = "", contact_name: str = "", contact_email: str = "", contact_phone: str = "", language: str = "zh"):
    en = _is_en(language)
    customer_type = (customer_type or "commercial").lower()
    normalized_plan = _normalize_plan(plan, contract_duration_months)
    profile = _resolve_profile(company_name=company_name, plan=normalized_plan, average_consumption_kwh=average_consumption_kwh, contract_duration_months=contract_duration_months, business_type=business_type)
    if profile and customer_type == "commercial":
        normalized_plan = normalized_plan or profile["plan"]
        average_consumption_kwh = average_consumption_kwh or str(profile["average_consumption_kwh"])
        contract_duration_months = contract_duration_months or str(profile["contract_duration_months"])
        company_name = company_name or profile["company_name"]
        payment_method = payment_method or profile["payment_method"]
        start_date = _normalize_start_date(start_date, profile, language)
        if business_type or company_name:
            business_type = _business_type_label(company_name, business_type, language)
        else:
            business_type = profile.get("business_type_en" if en else "business_type_zh", profile["business_type"])
        scenario = profile["scenario_en"] if en else profile["scenario_zh"]
    else:
        start_date = _normalize_start_date(start_date, None, language)
        business_type = _business_type_label(company_name, business_type, language)
        scenario = "Generated based on the information provided by the customer." if en else "按用户输入生成参考报价。"

    cards = RATE_CARDS.get(customer_type)
    if not cards:
        raise ValueError("unsupported_customer_type")
    if not normalized_plan:
        normalized_plan = "fixed24" if customer_type == "commercial" else "saver24"
    card = cards.get(normalized_plan)
    if not card:
        normalized_plan = "fixed24" if customer_type == "commercial" else "saver24"
        card = cards.get(normalized_plan)

    kwh = float(average_consumption_kwh or 1000)
    months = int(contract_duration_months or 24)
    monthly_energy = round(kwh * card["rate"], 2)
    mss_charge = round(kwh * 0.0035, 2)
    metering_charge = 6.50 if customer_type == "commercial" else 0.90
    carbon_tax = round(kwh * 0.0024, 2)
    subtotal = round(monthly_energy + mss_charge + metering_charge + carbon_tax, 2)
    gst = round(subtotal * 0.09, 2)
    estimated_monthly_total = round(subtotal + gst, 2)
    contract_total = round(estimated_monthly_total * months, 2)
    plan_notes = card["description_en"] if en else card["description_zh"]
    if profile and customer_type == "commercial":
        plan_notes = profile.get("plan_notes_en" if en else "plan_notes_zh", plan_notes)
    return {
        "en": en,
        "customer_type": customer_type,
        "plan_key": normalized_plan,
        "plan_label": card["label"],
        "rate": card["rate"],
        "company_name": company_name or ("To be confirmed" if en else "待确认"),
        "business_type": business_type,
        "scenario": scenario,
        "start_date": start_date,
        "payment_method": payment_method or "GIRO",
        "months": months,
        "kwh": kwh,
        "monthly_energy": monthly_energy,
        "mss_charge": mss_charge,
        "metering_charge": metering_charge,
        "carbon_tax": carbon_tax,
        "subtotal": subtotal,
        "gst": gst,
        "estimated_monthly_total": estimated_monthly_total,
        "contract_total": contract_total,
        "plan_notes": plan_notes,
        "contact_name": contact_name,
        "contact_email": contact_email,
        "contact_phone": contact_phone,
    }


def prepare_commercial_quote_email(customer_type: str = "commercial", plan: str = "", average_consumption_kwh: str = "", contract_duration_months: str = "24", company_name: str = "", payment_method: str = "", business_type: str = "", start_date: str = "", recipient_email: str = "sunlin@udesk.cn", language: str = "zh") -> str:
    """Prepare a stable HTML email template for a commercial indicative quote."""
    if not str(company_name or "").strip():
        if _is_en(language):
            return "FINAL_ANSWER: Please provide the company or shop name before I send the quote summary."
        return "FINAL_ANSWER: 请先提供公司或店铺名称，我再为您发送报价摘要。"
    data = _quote_data(customer_type=customer_type, plan=plan, average_consumption_kwh=average_consumption_kwh, contract_duration_months=contract_duration_months, company_name=company_name, payment_method=payment_method, business_type=business_type, start_date=start_date, language=language)
    en = data["en"]
    email = recipient_email or "sunlin@udesk.cn"
    if en:
        subject = f"PacificLight Commercial Electricity Indicative Quote - {data['company_name']}"
        greeting = f"Dear { _html_escape(data['company_name']) },"
        intro = "Here is the PacificLight commercial electricity indicative quote prepared based on the information provided."
        profile_labels = [("Company", data['company_name']), ("Business Type", data['business_type']), ("Expected Supply Start", data['start_date']), ("Payment Method", data['payment_method'])]
        plan_labels = [("Recommended Plan", data['plan_label']), ("Indicative Rate", f"SGD {data['rate']:.3f}/kWh"), ("Contract Duration", f"{data['months']} months"), ("Monthly Consumption", f"{data['kwh']:,.0f} kWh"), ("Plan Notes", data['plan_notes'])]
        charge_title = "Estimated Monthly Charges"
        total_label = "Estimated Monthly Total"
        contract_label = "Estimated Contract Total"
        note = "This is a non-binding indicative quote. Final pricing, contract terms and eligibility are subject to confirmation by the PacificLight sales team."
        signoff = "Best regards,<br><strong>PacificLight Customer Service</strong><br>PacificLight Energy"
        profile_title = "Customer Profile"
        plan_title = "Recommended Plan"
        next_step = "If you would like to proceed, you can register your interest here:"
        link_text = "Open PacificLight business registration"
    else:
        subject = f"PacificLight 商业用电参考报价 - {data['company_name']}"
        greeting = f"尊敬的 {_html_escape(data['company_name'])}，"
        intro = "以下是根据您提供的信息生成的 PacificLight 商业用电参考报价。"
        profile_labels = [("公司", data['company_name']), ("业务类型", data['business_type']), ("预计开始供电日期", data['start_date']), ("付款方式", data['payment_method'])]
        plan_labels = [("推荐计划", data['plan_label']), ("参考电价", f"SGD {data['rate']:.3f}/kWh"), ("合同期", f"{data['months']} 个月"), ("月均用电量", f"{data['kwh']:,.0f} kWh"), ("计划说明", data['plan_notes'])]
        charge_title = "预估月度费用"
        total_label = "预估月度总额"
        contract_label = "预估合约总额"
        note = "以上为非绑定参考报价，最终价格、合同条款和适用条件以 PacificLight 销售团队确认为准。"
        signoff = "此致，<br><strong>PacificLight 客户服务团队</strong><br>PacificLight Energy"
        profile_title = "客户信息"
        plan_title = "推荐方案"
        next_step = "如需继续办理，您可以通过以下页面提交商业用电意向登记："
        link_text = "打开 PacificLight 商业用电登记页面"

    def rows(items):
        return "".join(
            f"<tr><th style='text-align:left;padding:8px 10px;border:1px solid #e5e7eb;background:#f8fafc;width:220px'>{_html_escape(k)}</th>"
            f"<td style='padding:8px 10px;border:1px solid #e5e7eb'>{_html_escape(v)}</td></tr>"
            for k, v in items
        )

    if en:
        charge_rows = [
            ("Energy Charge", _money(data['monthly_energy'])),
            ("MSS Charge", _money(data['mss_charge'])),
            ("Metering Charge", _money(data['metering_charge'])),
            ("Carbon Tax", _money(data['carbon_tax'])),
            ("Subtotal", _money(data['subtotal'])),
            ("GST 9%", _money(data['gst'])),
            (total_label, _money(data['estimated_monthly_total'])),
            (contract_label, _money(data['contract_total'])),
        ]
    else:
        charge_rows = [
            ("电费", _money(data['monthly_energy'])),
            ("市场支持服务费（MSS）", _money(data['mss_charge'])),
            ("电表服务费", _money(data['metering_charge'])),
            ("碳税", _money(data['carbon_tax'])),
            ("小计", _money(data['subtotal'])),
            ("消费税（GST 9%）", _money(data['gst'])),
            (total_label, _money(data['estimated_monthly_total'])),
            (contract_label, _money(data['contract_total'])),
        ]
    body = f"""
<div style='font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#111827'>
  <p>{greeting}</p>
  <p>{intro}</p>
  <h3>{_html_escape(profile_title)}</h3>
  <table style='border-collapse:collapse;margin:12px 0;max-width:860px'>{rows(profile_labels)}</table>
  <h3>{_html_escape(plan_title)}</h3>
  <table style='border-collapse:collapse;margin:12px 0;max-width:860px'>{rows(plan_labels)}</table>
  <h3>{_html_escape(charge_title)}</h3>
  <table style='border-collapse:collapse;margin:12px 0;max-width:860px'>{rows(charge_rows)}</table>
  <p>{_html_escape(next_step)} <a href='{COMMERCIAL_REGISTRATION_URL}' target='_blank' rel='noopener noreferrer'>{_html_escape(link_text)}</a></p>
  <p><strong>{'Note:' if en else '说明：'}</strong> {_html_escape(note)}</p>
  <p>{signoff}</p>
</div>
""".strip()
    return f"SUBJECT: {subject}\nRECIPIENT: {email}\nEMAIL_HTML:\n{body}"


def calculate_quote(customer_type: str = "commercial", plan: str = "", average_consumption_kwh: str = "", contract_duration_months: str = "24", company_name: str = "", payment_method: str = "", business_type: str = "", start_date: str = "", contact_name: str = "", contact_email: str = "", contact_phone: str = "", language: str = "zh") -> str:
    """计算 PacificLight 参考电力报价。商业报价支持自然语言套餐别名和常见商业场景。"""
    en = _is_en(language)
    customer_type = (customer_type or "commercial").lower()
    plan = _normalize_plan(plan, contract_duration_months)
    if customer_type == "commercial" and not str(company_name or "").strip():
        if en:
            return "FINAL_ANSWER: Sure, I can prepare an indicative commercial electricity quote. Could you share your company or shop name first? If it is not finalized yet, you can tell me the working name and I will continue with an estimate."
        return "FINAL_ANSWER: 可以的，我可以先为您测算一份商业用电参考报价。请先告诉我公司或店铺名称；如果名称还没最终确定，也可以先提供暂用名称，我会继续为您估算。"

    profile = _resolve_profile(company_name=company_name, plan=plan, average_consumption_kwh=average_consumption_kwh, contract_duration_months=contract_duration_months, business_type=business_type)
    if profile and customer_type == "commercial":
        plan = plan or profile["plan"]
        average_consumption_kwh = average_consumption_kwh or str(profile["average_consumption_kwh"])
        contract_duration_months = contract_duration_months or str(profile["contract_duration_months"])
        company_name = company_name or profile["company_name"]
        payment_method = payment_method or profile["payment_method"]
        start_date = _normalize_start_date(start_date, profile, language)
        if business_type or company_name:
            business_type = _business_type_label(company_name, business_type, language)
        else:
            business_type = profile.get("business_type_en" if en else "business_type_zh", profile["business_type"])
        scenario = profile["scenario_en"] if en else profile["scenario_zh"]
    else:
        start_date = _normalize_start_date(start_date, None, language)
        business_type = _business_type_label(company_name, business_type, language)
        scenario = "Generated based on the information provided by the customer." if en else "按用户输入生成参考报价。"

    cards = RATE_CARDS.get(customer_type)
    if not cards:
        return "This customer type is not supported for quotation." if en else "暂不支持该客户类型报价。"
    if not plan:
        plan = "fixed24" if customer_type == "commercial" else "saver24"
    card = cards.get(plan)
    if not card:
        plan = "fixed24" if customer_type == "commercial" else "saver24"
        card = cards.get(plan)
    try:
        kwh = float(average_consumption_kwh or 1000)
        months = int(contract_duration_months or 24)
    except ValueError:
        return "The consumption or contract duration format is invalid." if en else "用电量或合同期限格式不正确。"

    monthly_energy = round(kwh * card["rate"], 2)
    mss_charge = round(kwh * 0.0035, 2)
    metering_charge = 6.50 if customer_type == "commercial" else 0.90
    carbon_tax = round(kwh * 0.0024, 2)
    subtotal = round(monthly_energy + mss_charge + metering_charge + carbon_tax, 2)
    gst = round(subtotal * 0.09, 2)
    estimated_monthly_total = round(subtotal + gst, 2)
    contract_total = round(estimated_monthly_total * months, 2)
    plan_notes = card["description_en"] if en else card["description_zh"]
    if profile and customer_type == "commercial":
        plan_notes = profile.get("plan_notes_en" if en else "plan_notes_zh", plan_notes)

    if en:
        return f"""{_indicative_label("Indicative quote (non-binding):")}

## Commercial Electricity Quote

**Estimated Monthly Total:** {_amount_colored(estimated_monthly_total)}  
**Estimated Contract Total:** {_orange(_money(contract_total))}

### Customer Profile
- Company: {company_name or 'To be confirmed'}
- Business Type: {business_type}
- Scenario: {scenario}
- Customer Type: {customer_type}
- Expected Supply Start: {start_date or 'To be confirmed'}
- Payment Method: {payment_method or 'To be confirmed'}

### Recommended Plan
- Plan: {_plan_colored(card['label'])}
- Indicative Rate: {_orange(f"SGD {card['rate']:.3f}/kWh")}
- Contract Duration: {months} months
- Monthly Consumption: {kwh:.0f} kWh
- Plan Notes: {plan_notes}

### Estimated Monthly Charges
- Energy Charge: {_money(monthly_energy)}
- MSS Charge: {_money(mss_charge)}
- Metering Charge: {_money(metering_charge)}
- Carbon Tax: {_money(carbon_tax)}
- Subtotal: {_money(subtotal)}
- GST 9%: {_money(gst)}
- **Estimated Monthly Total: {_money(estimated_monthly_total)}**

{_indicative_label("Note: This is an indicative quote. Final pricing, contract terms and eligibility are subject to confirmation by the PacificLight sales team.")}

**Next step:** [Open PacificLight business registration]({COMMERCIAL_REGISTRATION_URL})

If you would like me to email this quote summary, please share the recipient email address. If you would like a sales consultant to call back, you can also leave your contact name and phone number."""

    return f"""{_indicative_label("参考报价（非绑定）：")}

## 商业用电参考报价

**预估月度总额：** {_amount_colored(estimated_monthly_total)}  
**预估合约总额：** {_orange(_money(contract_total))}

### 客户信息
- 公司：{company_name or '暂未确认'}
- 业务类型：{business_type}
- 场景：{scenario}
- 客户类型：商业客户
- 预计开始供电日期：{start_date or '待确认'}
- 付款方式：{payment_method or '待确认'}

### 推荐方案
- 计划：{_plan_colored(card['label'])}
- 参考电价：{_orange(f"SGD {card['rate']:.3f}/kWh")}
- 合同期：{months} 个月
- 月均用电量：{kwh:.0f} kWh
- 计划说明：{plan_notes}

### 预估月度费用
- 电费：{_money(monthly_energy)}
- 市场支持服务费（MSS）：{_money(mss_charge)}
- 电表服务费：{_money(metering_charge)}
- 碳税：{_money(carbon_tax)}
- 小计：{_money(subtotal)}
- GST 9%：{_money(gst)}
- **预估月度总额：{_money(estimated_monthly_total)}**

{_indicative_label("说明：以上为参考报价，最终价格、合同条款和适用条件以 PacificLight 销售团队确认为准。")}

**下一步：** [打开 PacificLight 商业用电登记页面]({COMMERCIAL_REGISTRATION_URL})

如果需要我把这份报价摘要发送给您，请提供接收邮箱；如果希望销售顾问回电跟进，也可以留下联系人姓名和电话。"""

