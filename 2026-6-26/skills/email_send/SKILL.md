---
name: email_send
description: Use when PacificLight 客服智能体需要发送账单、报价摘要、服务确认、续约跟进或客户后续材料邮件，并需要防止邮件主题与正文混淆。
---

# 邮件发送

用于向客户或内部销售/客服团队发送邮件内容。账单类邮件优先使用结构化账单发送函数，由工具生成安全邮件标题和 HTML 富文本正文，避免标题与正文混淆。

## 可用工具

### send_email(subject, email_content)

按 Udesk 配置提交邮件发送请求。适用于报价摘要、服务确认、续约跟进等通用邮件。`subject` 必须是简短标题，不能传入完整正文。`email_content` 支持 HTML 富文本。

### send_bill_email(..., language)

发送 PacificLight 账单邮件。用于“把账单/发票/PDF bill 发到邮箱”等场景。调用时传入账单结构化字段和 `language`。英文邮件传 `language="en"`，中文邮件传 `language="zh"`。工具会自动生成标题 `PacificLight Electricity Bill {Invoice No.} - {Billing Period}` 和 HTML 富文本正文，并将 `未支付/已支付`、`至` 等中文状态或连接词按邮件语言归一化。

### send_email_163(to, subject, body, cc)

兼容旧调用方式；会将 `to`、`cc`、`subject`、`body` 组合成邮件正文后提交同一发送请求。

## 邮件正文生成规则

调用本技能前，智能体必须根据当前对话和工具返回结果生成完整邮件正文。账单类邮件优先调用 `send_bill_email(...)`，不要手写账单邮件标题和正文。通用邮件使用 `send_email(subject, email_content)`。

通用邮件正文建议结构：

1. Greeting
2. Reason for email
3. Key details from tool results
4. Disclaimer or next step
5. Sign-off

通用邮件正文建议使用 HTML 富文本，例如 `<p>`、`<table>`、`<ul>`、`<strong>` 和 `<a>`，不要使用 Markdown 表格。

## 使用规则

1. 不要发送空主题或空正文。
2. 邮件主题必须是 120 字符以内的简短标题，不能包含问候语、账单明细、PDF Link、HTML、Markdown 表格或换行。
3. 发送给客户前，确认客户希望接收邮件，或客户已经提供/确认邮箱。
4. 涉及账户敏感信息时，先完成身份验证。
5. 邮件内容必须来自当前对话和工具返回结果，不要编造价格、账户信息、发票号、日期或 URL。
6. 保留账户号、发票号、日期、金额、套餐名和链接的原始格式。
7. 工具返回成功后，告知用户邮件已发送。
8. 如发送失败，说明暂时无法发送邮件，并建议转人工或稍后重试。


## 账单/发票邮件强制规则

当用户要求“把账单发到邮箱 / send bill to email / email me the invoice / send PDF bill”等，必须调用 `send_bill_email(...)`，并传入完整账单数据。不要把完整正文放进 `subject`。

### 标题格式

由 `send_bill_email(...)` 自动生成：

PacificLight Electricity Bill {Invoice No.} - {Billing Period}

示例：PacificLight Electricity Bill PL-R-202606-002 - 2026-06

### send_bill_email 参数必须覆盖

- Greeting
- 发送原因：例如 “Here is your requested PacificLight electricity bill.”
- Customer Name / Company
- Account No.
- Billing Period
- Invoice No.
- Bill Date
- Due Date
- Payment Status
- Meter No.
- Previous Reading
- Current Reading
- Consumption
- Energy Charge
- MSS Charge
- Metering Charge
- Carbon Tax
- Subtotal
- GST 9%
- Late Payment Charge
- Total Amount Due
- PDF Link：https://espreview.s4.udesk.cn/onlinePreview?url=RDZDQUNBQ0VDRDg0OTE5MURGRDJENzkzQ0Q4QjkzRDVEMzkzQ0VDQkRDOTNDRENBREE5MENCREFEQkNERDVERENEOTBEREQxRDM5MUZBREZDQURGOTE4RjhCOTE4QURCOEY4RURCRERERjg4OTM4NjhEOEI4RTkzOEE4Qjg4REY5Mzg2OEU4NjhDOTNEQURBREE4RjhBOEU4ODg5OEREQkQ4OEQ5MUVFREZEREQ3RDhEN0RERjJEN0Q5RDZDQUUxRkJEMkRCRERDQUNDRDdEREQ3Q0FDN0UxRkNEN0QyRDJFMUVDOTNFRUYyOTM4RjhFOEU4RkUxOEM4RThDODg5MzhFODg5MENFREFEODgxREREMUQwQ0FEQkQwQ0E4Mw%3D%3D
- 如果账单状态为 Paid / 已支付，明确说明无需再次付款。
- 如果账单状态为 Outstanding / 未支付，提醒在到期日前付款。
- Sign-off：PacificLight Customer Service / PacificLight Energy

### 禁止

- 不要只写“请提供邮箱”后停止，如果用户已要求发送且系统已有客户邮箱，应继续生成邮件正文并调用发送工具。
- 不要使用泛泛标题，例如 PacificLight Invoice 或 Bill Information。
- 不要把正文、账单明细、PDF Link 或 HTML 传入 `subject`。
- 不要遗漏 PDF Link。
## 常用邮件类型

### 商业报价摘要

Subject 示例：`PacificLight Commercial Electricity Quote Summary`

正文应包含公司名、套餐、参考电价、月均用电量、合同期限、预估月费、预估合同总额、非绑定报价说明和销售跟进说明。

### 服务事项确认

Subject 示例：`PacificLight Service Request Confirmation`

正文应包含请求类型、账户号、客户/公司、关键诉求、后续处理说明。

### 续约跟进

Subject 示例：`PacificLight Renewal Follow-up Confirmation`

正文应包含当前套餐、合同到期日、期望续约期限、后续销售跟进说明。


## 多语言规则

英文邮件禁止出现中文状态或中文连接词，例如 `未支付`、`已支付`、`至`、`账期`。如账单数据来自中文工具结果，调用 `send_bill_email(..., language="en")`，由工具归一化为 `Outstanding`、`Paid`、`to` 等英文表达。


客户使用什么语言提问，智能体最终就使用同一种语言回复。工具返回内容、`FINAL_ANSWER`、技能描述或历史消息不得覆盖客户最后一句语言；如语言不一致，必须翻译为客户最后一句语言后再回复。工具返回内容可由智能体翻译，但账户号、发票号、日期、金额、URL、套餐名、邮箱地址和指令必须保持原样。如工具函数提供 `language` 参数，英文客户传 `en`，中文客户传 `zh`。




## 邮件收件邮箱规则

邮件默认发送到账户登记邮箱 `sunlin@udesk.cn`。

- 无论客户临时输入的邮箱是什么，当前账户登记邮箱为 `sunlin@udesk.cn`，邮件发送时使用该登记邮箱。
- 如果用户提供其他邮箱，回复时说明“系统将发送到账户登记邮箱 sunlin@udesk.cn；如需变更收件邮箱，可为您转接人工顾问处理”。
- 不要声称已经发送到其他邮箱。

