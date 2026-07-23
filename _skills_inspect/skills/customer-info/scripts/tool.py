"""
客户信息查询 —— 查询用户基本信息、会员信息、积分和优惠券等

数据为静态模拟数据，直接内置于工具中。
"""
import json

from datetime import datetime

# ======================== 模拟数据 ========================

CUSTOMER_DATA = {
    "69379c51ac4ea8392e5c49aa": {
        "phone": "15797621207",
        "is_member": False,
        "is_annual_member": False,
        "member_card_no": None,
        "points": None,
        "coupons": [
            {"name": "全场100-10", "keycode": "cp0001", "valid_period": "2026.06.01-2026.07.30"},
            {"name": "全场200-15", "keycode": "cp0002", "valid_period": "2026.06.01-2026.07.30"},
            {"name": "全场50-10", "keycode": "cp0003", "valid_period": "2026.06.01-2026.07.30"},
        ],
    },
    "61161be8563c06177a1af320": {
        "phone": "13928925880",
        "is_member": True,
        "is_annual_member": False,
        "member_card_no": "19301349297",
        "points": 26,
        "coupons": [
            {"name": "全场100-10", "keycode": "cp0001", "valid_period": "2026.05.01-2026.05.30"},
            {"name": "全场200-15", "keycode": "cp0002", "valid_period": "2026.05.01-2026.05.30"},
            {"name": "全场50-10", "keycode": "cp0003", "valid_period": "2026.05.01-2026.05.30"},
        ],
    },
    "61cec690f56b9414770b9707": {
        "phone": "18026437035",
        "is_member": True,
        "is_annual_member": True,
        "member_card_no": "19301349075",
        "points": 109,
        "coupons": [
            {"name": "全场100-10", "keycode": "cp0001", "valid_period": "2026.06.01-2026.07.30"},
            {"name": "全场200-15", "keycode": "cp0002", "valid_period": "2026.06.01-2026.07.30"},
            {"name": "全场50-10", "keycode": "cp0003", "valid_period": "2026.06.01-2026.07.30"},
        ],
    },
}


def _member_label(is_member: bool, is_annual: bool) -> str:
    if not is_member:
        return "非会员"
    if is_annual:
        return "年卡会员"
    return "普通会员"


def _format_coupon(c: dict) -> str:
    # 判断是否过期
    now = datetime.now()
    valid = c["valid_period"]
    expired = False
    if " - " in valid or "-" in valid:
        sep = " - " if " - " in valid else "-"
        parts = valid.split(sep)
        if len(parts) == 2:
            try:
                end = datetime.strptime(parts[1].strip(), "%Y.%m.%d")
                expired = now > end
            except ValueError:
                pass
    tag = " [已过期]" if expired else ""
    return f"  · {c['name']}  有效期: {c['valid_period']}{tag}"


def get_customer_info(wuid: str) -> str:
    """
    查询客户信息，包含会员信息、积分和优惠券等

    参数:
        wuid: 用户ID
    """
    customer = CUSTOMER_DATA.get(wuid)
    if not customer:
        return f"未找到该用户（WUID: {wuid}）"

    lines = []

    # 基本信息
    lines.append(f"手机号: {customer['phone']}")
    lines.append(f"会员身份: {_member_label(customer['is_member'], customer['is_annual_member'])}")

    if customer["member_card_no"]:
        lines.append(f"会员卡号: {customer['member_card_no']}")

    if customer["points"] is not None:
        lines.append(f"会员积分: {customer['points']}")
    else:
        lines.append("会员积分: 无")

    # 优惠券
    coupons = customer.get("coupons", [])
    if coupons:
        total = len(coupons)
        lines.append(f"\n优惠券（共 {total} 张）:")
        for c in coupons:
            lines.append(_format_coupon(c))
    else:
        lines.append("\n优惠券: 暂无")

    return "\n".join(lines)
