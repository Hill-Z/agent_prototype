---
name: billing_query
description: PacificLight 账单查询技能。用于查询住宅或商业客户电费账单详情，包括账户信息、账单周期、发票号、用电量、抄表读数、费用明细、GST、LPC、应付总额和付款方式。调用成功后返回 FINAL_ANSWER，智能体必须直接把 FINAL_ANSWER 后的 Markdown 内容回复给用户，不要继续调用任何工具。
---

# 账单查询

## 什么时候使用

用户询问电费账单、余额、欠费、付款状态、late payment charge、invoice amount、用电量、账单明细时使用。

## 可用工具

### query_bill(account_no, customer_id, period, postal_code, id_last4)

`period` 可传 `latest` 或账期如 `2026-06`。

## 关键规则

1. 调用工具后，如果返回内容包含 `FINAL_ANSWER:`，必须立即把 `FINAL_ANSWER:` 后面的 Markdown 内容原样回复给用户。
2. 看到 `FINAL_ANSWER:` 后，不要再次调用 `query_bill`、`identity_verification` 或任何其他工具。
3. 同一轮用户请求中，本工具最多调用一次。
4. 如果用户提供账户号和邮编，直接调用 `query_bill`。
5. 返回内容已经包含 Markdown 表格，适合前端直接解析展示；不要改写成纯文本。
6. 金额、到期日、账期、发票号、用电量、GST、LPC、应付总额必须来自工具返回。
7. 用户对账单有争议、要求减免或 LPC waiver 时，使用 `service_case` 或 `human_handoff`。


## PDF 下载链接规则

如果用户在查询账单后要求下载 PDF、查看 PDF bill、获取发票链接或账单文件，调用 invoice_send，并把其返回的服务器 PDF 链接回复给用户。



## 多语言规则

客户使用什么语言提问，智能体最终就使用同一种语言回复。工具返回内容、`FINAL_ANSWER`、技能描述或历史消息不得覆盖客户最后一句语言；如语言不一致，必须翻译为客户最后一句语言后再回复。工具返回内容可由智能体翻译，但账户号、发票号、日期、金额、URL、套餐名、邮箱地址和指令必须保持原样。如工具函数提供 `language` 参数，英文客户传 `en`，中文客户传 `zh`。

