---
name: billing_query_color_test_whatsapp
description: PacificLight 账单查询技能。用于客户查询住宅电费账单、余额、付款状态、GST、Late Payment Charge、用电量、账单明细或最新账单时。
---

# 账单查询

## 何时使用

客户询问个人/住宅账单金额、付款状态、账单明细、用电量、GST、LPC、余额、欠费、为什么账单高等问题时使用。

## 不适用

商业客户要 consumption report、季度用电、Apr-Jun/Q2、财务/ESG、PDF/Excel 用电报告时，不要使用本技能；必须使用 `service_case.create_consumption_report_request(...)`。

## 必要信息

- `account_no`
- `postal_code` 或其他已验证信息
- `period`，未指定时使用 `latest`
- `language`：中文 `zh`，英文 `en`

## 调用与返回

- 客户同时提供账户号和邮编时，可直接调用 `query_bill(...)`，不需要先调用 `identity_verification`。
- 工具返回 `FINAL_ANSWER:` + 纯文本账单，智能体必须直接展示字段内容，不要改成 Markdown/HTML。
- Paid / 已支付：说明无需再次付款，不要催缴。
- Outstanding / 未支付：才提醒到期日前付款。
- 展示后可询问是否发送到账户邮箱；客户确认后必须调用 `email_send.send_bill_email(...)`。

## 异常

账单争议、减免费用、LPC waiver、异常投诉需要 `service_case` 记录或按主提示词转人工。


## WhatsApp 纯文本展示要求

- 聊天窗口输出必须是纯文本。
- 不要输出 Markdown 表格、`##` / `###` 标题、`**` 加粗、`[文本](URL)` 链接或 HTML 标签。
- 链接用 `说明：URL` / `Label: URL`。
- 邮件正文和工单 content 可继续使用 HTML 富文本。
