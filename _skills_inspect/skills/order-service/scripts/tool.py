"""
订单查询与服务 —— 接口调用工具

提供订单查询、售后追踪、物流信息等能力。
类方法（_开头）不会被注册为工具，仅内部复用。
顶层方法会被 agent 系统注册为可调用的工具。
"""
import os
import json
import time
import hmac
import hashlib
from datetime import datetime, timedelta

import requests

# ======================== 配置 ========================
BASE_URL = os.getenv("API_BASE_URL", "https://msc-mystore-uat.watsonsestore.com.cn")
API_KEY = os.getenv("API_KEY", "167f0b51bfce4221b91e845bba4df6a2")
API_PWD = os.getenv("API_PWD", "ce2cfb0fc80b4dbd883e9ae8a61bc492ea763342a2084f068d659b54972f040d")
STORE_NO = os.getenv("STORE_NO", "8998")


# ======================== 字段映射定义 ========================

# 订单状态映射（基于实际数据验证）
# 数据来源: output/all_user_orders.json — status 与 status_name 对照
#   ORDERED  -> 已支付 (116条)
#   DISPATCHED -> 已发货 (82条)
#   CANCELLED -> 交易关闭 (73条)
#   HAVESIGN -> 交易完成 (42条)
#   CLOSE    -> 已支付 (1条，边缘情况)
ORDER_STATUS_MAP = {
    "ORDERED": "已支付",
    "DISPATCHED": "已发货",
    "CANCELLED": "已取消",     # 交易关闭
    "HAVESIGN": "已签收",      # 交易完成
    # "CLOSE": "已关闭",       # 边缘情况，先不关注
}

# 中文 → 英文状态反向映射（供状态筛选使用）
CN_STATUS_MAP = {v: k for k, v in ORDER_STATUS_MAP.items()}

# 售后状态映射（接口文档定义）
REFUND_STATUS_MAP = {
    "AFTER_SERVER_APPLY": "售后申请中",
    "AFTER_SERVER_APPLY_PASS": "售后审核通过",
    "AFTER_SERVER_APPLY_CANCEL": "售后已取消",
    "AFTER_SERVER_APPLY_FINISH": "售后已完成",
    "AFTER_SERVER_APPLY_FAIL": "售后失败",
}

# 订单类型映射（接口文档定义）
ORDER_TYPE_MAP = {
    "CNC": "门店自提",
    "CND": "闪电送",
    "CNDT": "同城配",
    "CNDXT": "跨城配",
    "CNE": "仓配达",
    "CNE-跨境": "跨境购-保税仓直发",
    "CNES": "品牌直发",
    "INSTORE": "门店购买",
    "VIRTUAL_PRD": "虚拟商品",
}

# 快递公司映射（基于实际数据整理）
EXPRESS_COM_MAP = {
    "meituan": "美团配送",
    "eleme": "饿了么",
    "STO": "申通快递",
    "SFSS": "顺丰速运",
    "SFTC": "顺丰同城",
    "JDTC": "京东同城",
    "SF": "顺丰快递",
    "jd": "京东快递",
    "YUNDA": "韵达快递",
    "EMS": "EMS快递",
    "SFXT": "顺丰XT",
    "yuantong": "圆通速递",
    "YTO": "圆通速递",
}


def _status_cn(mapping: dict, key: str) -> str:
    """通过映射表将 API 状态码转为中文"""
    return mapping.get(key, key)


def _parse_status_input(raw: str) -> list:
    """
    解析用户传入的状态筛选条件。
    支持 , ；; 分隔，支持中文或英文状态，非法值忽略。
    示例: "已支付,已发货" → ["ORDERED", "DISPATCHED"]
          "ORDERED" → ["ORDERED"]
          "" → []
    """
    if not raw or not raw.strip():
        return []
    # 统一分隔符为逗号
    s = raw.replace("；", ",").replace(";", ",").replace("，", ",")
    tokens = [t.strip() for t in s.split(",") if t.strip()]
    result = []
    for t in tokens:
        if t in CN_STATUS_MAP:
            result.append(CN_STATUS_MAP[t])
        elif t in ORDER_STATUS_MAP:
            result.append(t)
        # 非法值直接忽略
    return result


def _yuan(amt_fen: int) -> str:
    """分转元"""
    return f"¥{amt_fen / 100:.2f}"


# ======================== 输出字段表 ========================

# 每条字段定义: (字段路径, 中文名, 格式化函数)
# 字段路径 支持 key 或 parent.key（如 shipping.ship_name）

def _get_nested(d: dict, path: str):
    """从嵌套字典按路径取值，如 shipping.ship_name"""
    parts = path.split(".", 1)
    val = d.get(parts[0], {}) if len(parts) > 1 else d.get(parts[0])
    if val is None or val == "" or val == {}:
        return None
    if len(parts) > 1 and isinstance(val, dict):
        return _get_nested(val, parts[1])
    return val


def _render_fields(data: dict, fields: list) -> str:
    """根据字段表渲染输出文本

    fields: [(api_path, 中文名), (api_path, 中文名, 格式化函数), ...]
    每个字段一行输出，值为空则跳过。
    """
    out = []
    for field_def in fields:
        path = field_def[0]
        label = field_def[1]
        fmt = field_def[2] if len(field_def) > 2 else None

        val = _get_nested(data, path)
        if val is None:
            continue

        if fmt:
            val = fmt(val)
        out.append(f"{label}: {val}")

    return "\n".join(out)


# ======================== 接口类 ========================

class _OrderAPI:
    """订单接口封装（私有类，不会被注册为工具）"""

    @staticmethod
    def _sign_params(params: dict) -> str:
        sorted_keys = sorted(params.keys())
        params_str = "&".join(f"{k}={params[k]}" for k in sorted_keys)
        raw = f"{API_KEY}{API_KEY}{API_PWD}ZhiDEpIn0g{params_str}{API_KEY}Pinggc0upon{API_PWD}"
        return hmac.new(API_PWD.encode(), raw.encode(), hashlib.sha256).hexdigest()

    @staticmethod
    def _build_signed_params(biz_params: dict) -> dict:
        params = {
            "api_key": API_KEY,
            "timestamp": str(int(time.time() * 1000)),
        }
        params.update(biz_params)
        params["api_sign"] = _OrderAPI._sign_params(params)
        return params

    @staticmethod
    def _call(url: str, data: dict) -> dict:
        full_url = BASE_URL + url
        try:
            resp = requests.post(full_url, data=data, timeout=15)
            return resp.json()
        except Exception as e:
            return {"code": -1, "message": f"接口调用异常: {e}"}

    # ---- 订单接口 ----

    @staticmethod
    def query_order_list(wuid: str, page: str = "1", page_size: str = "10",
                         order_time_start: str = "", order_time_end: str = "",
                         status_list: list | None = None):
        params = {
            "wuid": wuid,
            "channel_id": [],
            "status": status_list or [],
            "order_type": [],
            "page_size": page_size,
            "page": page,
        }
        if order_time_start:
            params["order_time_start"] = order_time_start
        if order_time_end:
            params["order_time_end"] = order_time_end
        data = _OrderAPI._build_signed_params({
            "json_text": json.dumps(params),
        })
        return _OrderAPI._call("/spaceage/watsons/order/list", data)

    @staticmethod
    def query_order_detail(wuid: str, order_no: str):
        data = _OrderAPI._build_signed_params({
            "json_text": json.dumps({
                "wuid": wuid,
                "order_no": order_no,
            }),
        })
        return _OrderAPI._call("/spaceage/watsons/order/detail", data)

    @staticmethod
    def query_refund_list(wuid: str, page: str = "1", page_size: str = "10"):
        data = _OrderAPI._build_signed_params({
            "json_text": json.dumps({
                "wuid": wuid,
                "page": page,
                "page_size": page_size,
            }),
        })
        return _OrderAPI._call("/spaceage/watsons/refund/list", data)

    @staticmethod
    def query_refund_detail(wuid: str, order_no: str):
        data = _OrderAPI._build_signed_params({
            "json_text": json.dumps({"wuid": wuid, "order_no": order_no}),
        })
        return _OrderAPI._call("/spaceage/watsons/refund/detail", data)

    # ---- 结果格式化 ----

    @staticmethod
    def _summarize_orders(raw: dict) -> str:
        if raw.get("code") != 10000:
            return f"查询失败: {raw.get('message', '未知错误')}"

        data = raw.get("data", {})
        total = data.get("total", 0)
        if total == 0:
            return "该用户暂无订单记录。"

        lines = [f"共 {total} 条订单，当前显示第 {data.get('current', 1)} 页："]
        # 列表每行的输出字段
        row_fields = [
            ("order_no", "订单号"),
            ("item_name_zht", "商品"),
        ]
        for order in data.get("data", []):
            parts = []
            for api_key, label in row_fields:
                val = order.get(api_key, "")
                if val:
                    parts.append(f"{label}: {val}")
            # 状态 + 金额 + 来源单独处理
            parts.append(_status_cn(ORDER_STATUS_MAP, order.get("status", "")))
            parts.append(_yuan(order.get("order_amt", 0)))
            src = order.get("sales_source", "")
            if src:
                parts.append(src)
            parts.append(order.get("order_time", ""))
            lines.append("  · " + " | ".join(parts))

        return "\n".join(lines)

    @staticmethod
    def _summarize_order_detail(raw: dict) -> str:
        if raw.get("code") != 10000:
            return f"查询失败: {raw.get('message', '未知错误')}"

        d = raw.get("data", {})

        # 订单主体字段
        body_fields = [
            ("order_no", "订单号"),
            ("status", "状态", lambda v: _status_cn(ORDER_STATUS_MAP, v)),
            ("order_amt", "金额", _yuan),
            ("earn_points", "可得积分"),
            ("order_time", "下单时间"),
            ("order_type", "订单类型", lambda v: _status_cn(ORDER_TYPE_MAP, v)),
            ("sales_source", "来源"),
            ("warehouse_address", "门店地址"),
            ("warehouse_tel", "门店电话"),
            ("delivery_phone", "配送员电话"),
            ("send_time", "发货时间"),
        ]
        lines = [_render_fields(d, body_fields)]

        # 取货码/自提码（二选一展示，优先取货码）
        code = d.get("delivery_goods_code") or d.get("pickup_code")
        code_label = "取货码" if d.get("delivery_goods_code") else "自提码" if d.get("pickup_code") else None
        if code_label and code:
            lines.append(f"{code_label}: {code}")
            if d.get("delivery_goods_expire_time"):
                lines.append(f"{code_label}有效期: {d['delivery_goods_expire_time']}")

        # 商品列表
        items = d.get("items", [])
        if items:
            lines.append("商品列表:")
            for item in items:
                qty = item.get("item_qty", 1)
                lines.append(f"  · {item.get('item_name_zht', '')} x{qty}")

        # 收货信息
        shipping = d.get("shipping", {})
        if shipping:
            ship_fields = [
                ("ship_name", "收货人"),
                ("ship_tel", "收货人电话"),
            ]
            lines.append(_render_fields(shipping, ship_fields))
            addr = "".join(filter(None, [
                shipping.get("ship_province", ""),
                shipping.get("ship_city", ""),
                shipping.get("ship_area", ""),
                shipping.get("ship_address", ""),
            ]))
            lines.append(f"收货人地址: {addr}")

        # 物流信息
        express = d.get("express", {})
        if express:
            com = express.get('express_com', '')
            com_cn = EXPRESS_COM_MAP.get(com, com)
            lines.append(f"快递公司: {com_cn}")
            lines.append(f"快递单号: {express.get('express_id', '')}")
            lines.append("（如需查看物流轨迹，可凭快递单号在快递公司官网或小程序查询）")

        return "\n".join(lines)

    @staticmethod
    def _summarize_refunds(raw: dict) -> str:
        if raw.get("code") != 10000:
            return f"查询失败: {raw.get('message', '未知错误')}"

        data = raw.get("data", {})
        total = data.get("total", 0)
        if total == 0:
            return "该用户暂无售后记录。"

        lines = [f"共 {total} 条售后记录："]
        row_fields = [
            ("aid", "售后单"),
            ("order_no", "订单"),
        ]
        for item in data.get("data", []):
            parts = []
            for api_key, label in row_fields:
                val = item.get(api_key, "")
                if val:
                    parts.append(f"{label}: {val}")
            parts.append(_status_cn(REFUND_STATUS_MAP, item.get("status", "")))
            lines.append("  · " + " | ".join(parts))

        return "\n".join(lines)

    @staticmethod
    def _summarize_refund_detail(raw: dict) -> str:
        if raw.get("code") != 10000:
            return f"查询失败: {raw.get('message', '未知错误')}"

        d = raw.get("data", {})

        fields = [
            ("aid", "售后单号"),
            ("order_no", "关联订单"),
            ("status", "售后状态", lambda v: _status_cn(REFUND_STATUS_MAP, v)),
            ("actual_refund", "是否已退款", lambda v: "是" if v == 1 else "否"),
            ("express_status_desc", "退货物流"),
        ]
        lines = [_render_fields(d, fields)]

        if d.get("wl_no"):
            lines.append(f"退货快递单号: {d['wl_no']}")

        if d.get("fast_refund") == "YES":
            lines.append("极速退款: 是")

        # 入库单信息
        rid_list = d.get("rid_list", [])
        if rid_list:
            lines.append("入库单:")
            for rid in rid_list:
                rs = rid.get("rid_status", "")
                lines.append(f"  · {rid.get('rid', '')} — {rs}")

        return "\n".join(lines)


# ====================================================================
# 以下为工具入口（顶层方法，会被 agent 系统注册为工具）
# ====================================================================


def query_orders(wuid: str, page: str = "1", page_size: str = "10",
                 order_time_start: str = "", order_time_end: str = "",
                 status: str = "") -> str:
    """
    查询用户的订单列表（最近三个月）

    参数:
        wuid: 用户ID
        page: 页码，默认1
        page_size: 每页条数，默认10
        order_time_start: 下单开始时间，格式 "YYYY-MM-DD HH:MM:SS"，可选
        order_time_end: 下单结束时间，格式 "YYYY-MM-DD HH:MM:SS"，可选
        status: 按状态筛选，多个状态用逗号分隔，可选。
                示例: "已支付,已发货"
                可用状态: 已支付、已发货、已签收、已取消

    时间筛选说明:
        - 不传时间参数时，默认查最近三个月的全部订单
        - 传了时间参数后，接口会按时间范围精确筛选
        - 接口要求 只能查询最近三个月的订单
    """

    now = datetime.now()
    MAX_DAYS = 85  # 接口限制约87天，留余量
    is_fallback = False
    error_msg = ""

    # 校验时间范围有效性，不合法则回退到默认
    if order_time_start and order_time_end:
        start_dt = datetime.strptime(order_time_start, "%Y-%m-%d %H:%M:%S")
        end_dt = datetime.strptime(order_time_end, "%Y-%m-%d %H:%M:%S")

        if start_dt < now - timedelta(days=MAX_DAYS):
            error_msg = "开始时间超出可查询范围（仅最近三个月）"
            is_fallback = True
        elif end_dt > now:
            error_msg = "结束时间不能晚于当前时间"
            is_fallback = True
        elif start_dt > end_dt:
            error_msg = "开始时间不能晚于结束时间"
            is_fallback = True

    if is_fallback:
        order_time_start = ""
        order_time_end = ""

    # 解析状态筛选
    status_list = _parse_status_input(status)

    raw = _OrderAPI.query_order_list(wuid, page, page_size,
                                     order_time_start, order_time_end, status_list)
    result = _OrderAPI._summarize_orders(raw)

    if is_fallback:
        # 模型传了非法时间，回退到默认
        now_str = now.strftime("%Y-%m-%d %H:%M")
        result = f"（{error_msg}，已默认查最近三个月的订单，当前时间 {now_str}）\n" + result
    else:
        # 正常传参，显示实际范围
        time_hint = f"（查询范围: {order_time_start} ~ {order_time_end}）"
        result = time_hint + "\n" + result

    return result


def get_current_time() -> str:
    """
    获取当前系统时间。当你需要查询用户订单但不确定时间范围时，
    先调用此工具获取当前时间，再根据用户描述推算具体的 order_time_start/end。
    """
    from datetime import datetime
    now = datetime.now()
    return (
        f"当前时间: {now.strftime('%Y-%m-%d %H:%M')}\n"
        f"今天是 {now.strftime('%Y-%m-%d')}，星期{['一','二','三','四','五','六','日'][now.weekday()]}\n"
    )


def get_order_detail(wuid: str, order_no: str) -> str:
    """
    查询订单详情，包含商品信息、收货地址、物流状态等

    参数:
        wuid: 用户ID
        order_no: 订单号
    """
    raw = _OrderAPI.query_order_detail(wuid, order_no)
    return _OrderAPI._summarize_order_detail(raw)


def query_refunds(wuid: str, page: str = "1", page_size: str = "10") -> str:
    """
    查询用户的售后/退款记录列表

    参数:
        wuid: 用户ID
        page: 页码，默认1
        page_size: 每页条数，默认10
    """
    raw = _OrderAPI.query_refund_list(wuid, page, page_size)
    return _OrderAPI._summarize_refunds(raw)


def get_refund_detail(wuid: str, order_no: str) -> str:
    """
    查询售后单详情，包含退款进度、退货物流状态等

    参数:
        wuid: 用户ID
        order_no: 关联的订单号
    """
    raw = _OrderAPI.query_refund_detail(wuid, order_no)
    return _OrderAPI._summarize_refund_detail(raw)
