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
        "scenario_zh": "关注可持续发展和绿色电力形象的商业客户。",
        "scenario_en": "Commercial customer focused on sustainability and green electricity positioning.",
    },
}


def _money(amount):
    return f"SGD {amount:.2f}"


def _is_en(language=""):
    return str(language or "").lower().startswith("en")


def _resolve_profile(company_name="", plan="", average_consumption_kwh="", contract_duration_months=""):
    text = f"{company_name} {plan} {average_consumption_kwh} {contract_duration_months}".lower()
    if "brightmart" in text or plan == "fixed12" or average_consumption_kwh in ["3500", 3500]:
        return COMMERCIAL_QUOTE_PROFILES["retail12"]
    if "greenbite" in text or "green" in text or plan == "green24" or average_consumption_kwh in ["8000", 8000]:
        return COMMERCIAL_QUOTE_PROFILES["green24"]
    if "abc" in text or "manufacturing" in text or plan == "fixed24" or average_consumption_kwh in ["12000", 12000]:
        return COMMERCIAL_QUOTE_PROFILES["manufacturing24"]
    return None


def calculate_quote(customer_type: str = "commercial", plan: str = "", average_consumption_kwh: str = "", contract_duration_months: str = "24", company_name: str = "", payment_method: str = "", language: str = "zh") -> str:
    """计算 PacificLight 参考电力报价。商业报价支持三套典型业务画像。"""
    en = _is_en(language)
    customer_type = (customer_type or "commercial").lower()

    profile = _resolve_profile(company_name=company_name, plan=plan, average_consumption_kwh=average_consumption_kwh, contract_duration_months=contract_duration_months)
    if profile and customer_type == "commercial":
        plan = plan or profile["plan"]
        average_consumption_kwh = average_consumption_kwh or str(profile["average_consumption_kwh"])
        contract_duration_months = contract_duration_months or str(profile["contract_duration_months"])
        company_name = company_name or profile["company_name"]
        payment_method = payment_method or profile["payment_method"]
        business_type = profile["business_type"]
        scenario = profile["scenario_en"] if en else profile["scenario_zh"]
    else:
        business_type = "Not provided" if en else "未提供"
        scenario = "Generated based on the information provided by the customer." if en else "按用户输入生成参考报价。"

    cards = RATE_CARDS.get(customer_type)
    if not cards:
        return "This customer type is not supported for quotation." if en else "暂不支持该客户类型报价。"
    if not plan:
        plan = "fixed24" if customer_type == "commercial" else "saver24"
    card = cards.get(plan)
    if not card:
        return f"Plan {plan} is not supported." if en else f"暂不支持套餐 {plan}。"
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

    if en:
        return f"""Indicative quote (non-binding):

## Commercial Electricity Quote

### Customer Profile

| Field | Value |
|---|---|
| Company | {company_name or 'Not provided'} |
| Business Type | {business_type} |
| Scenario | {scenario} |
| Customer Type | {customer_type} |
| Payment Method | {payment_method or 'Not provided'} |

### Recommended Plan

| Field | Value |
|---|---|
| Plan | {card['label']} |
| Indicative Rate | SGD {card['rate']:.3f}/kWh |
| Contract Duration | {months} months |
| Monthly Consumption | {kwh:.0f} kWh |
| Plan Notes | {plan_notes} |

### Estimated Monthly Charges

| Item | Amount |
|---|---:|
| Energy Charge | {_money(monthly_energy)} |
| MSS Charge | {_money(mss_charge)} |
| Metering Charge | {_money(metering_charge)} |
| Carbon Tax | {_money(carbon_tax)} |
| Subtotal | {_money(subtotal)} |
| GST 9% | {_money(gst)} |
| **Estimated Monthly Total** | **{_money(estimated_monthly_total)}** |

### Estimated Contract Value

| Field | Value |
|---|---:|
| Estimated Contract Total | {_money(contract_total)} |

Note: This is an indicative quote. Final pricing, contract terms and eligibility are subject to confirmation by the PacificLight sales team."""

    return f"""参考报价（非绑定）：

## Commercial Electricity Quote

### Customer Profile

| Field | Value |
|---|---|
| Company | {company_name or 'Not provided'} |
| Business Type | {business_type} |
| Scenario | {scenario} |
| Customer Type | {customer_type} |
| Payment Method | {payment_method or 'Not provided'} |

### Recommended Plan

| Field | Value |
|---|---|
| Plan | {card['label']} |
| Indicative Rate | SGD {card['rate']:.3f}/kWh |
| Contract Duration | {months} months |
| Monthly Consumption | {kwh:.0f} kWh |
| Plan Notes | {plan_notes} |

### Estimated Monthly Charges

| Item | Amount |
|---|---:|
| Energy Charge | {_money(monthly_energy)} |
| MSS Charge | {_money(mss_charge)} |
| Metering Charge | {_money(metering_charge)} |
| Carbon Tax | {_money(carbon_tax)} |
| Subtotal | {_money(subtotal)} |
| GST 9% | {_money(gst)} |
| **Estimated Monthly Total** | **{_money(estimated_monthly_total)}** |

### Estimated Contract Value

| Field | Value |
|---|---:|
| Estimated Contract Total | {_money(contract_total)} |

说明：以上为参考报价，最终价格、合同条款和适用条件以 PacificLight 销售团队确认为准。"""
