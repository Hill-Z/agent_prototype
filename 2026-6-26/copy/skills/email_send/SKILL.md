---
name: email_send
description: PacificLight 邮件发送技能。用于客户明确要求接收账单、发票、PDF 链接、报价摘要、开户注册链接、用电报告或服务确认邮件时。
---

# 邮件发送

## 何时使用

客户明确要求发送邮件，或在开户链接、报价摘要、账单、商业报告等场景中确认需要邮件时使用。

## 收件规则

- 新客户开户注册 / 新商业报价：先问客户希望接收的邮箱。
- 老客户账单 / 商业报告：默认账户登记邮箱 `sunlin@udesk.cn`。
- 老客户要求发送到其他邮箱时，不要直接承诺；按主提示词创建额外收件人审批或转人工。

## 固定模板路由

四类核心邮件不能手写正文：

- 个人账单 / PDF bill：调用 `send_bill_email(...)`，由工具生成标题和 HTML 正文。
- 老商业客户用电报告：先调用 `service_case.prepare_consumption_report_email(...)`，再调用 `send_email(subject, email_content)`。
- 新家庭客户开户注册链接：先调用 `residential_signup.prepare_signup_email(...)`，再调用 `send_email(subject, email_content)`。
- 新商业客户报价摘要：先调用 `quote_calculation.prepare_commercial_quote_email(...)`，再调用 `send_email(subject, email_content)`。

只有普通服务确认等非上述核心邮件，才可自行整理 HTML 后调用通用 `send_email(subject, email_content)`。

## 字段要求

- `subject` 必须是简短标题，不得放入正文、表格、PDF Link 或 HTML。
- `email_content` 使用 HTML 富文本，包含关键业务信息、下一步说明、署名和可点击链接。

## 返回后处理

发送成功后自然告知客户“已发送，请留意邮箱查收”。发送失败时按主提示词转人工。

## 固定模板发送规则

- 如果上一步工具返回 `SUBJECT:` / `RECIPIENT:` / `EMAIL_HTML:`，调用 `send_email(subject, email_content)` 时，`subject` 使用 `SUBJECT`，`email_content` 只使用 `EMAIL_HTML` 后面的 HTML 内容。
- 如果固定模板输出被包在 JSON 的 `result` 字段或字符串化 JSON 中，必须先逐层解包，再提取 `SUBJECT:` 和 `EMAIL_HTML:`。
- `email_content` 必须保留原始 HTML 标签；`<`、`>`、`&` 不得转换为 `&lt;`、`&gt;`、`&amp;`，也不要使用 Markdown 代码块或 JSON 再次包裹 HTML。
- 不要把 `SUBJECT:`、`RECIPIENT:`、`EMAIL_HTML:` 这些字段名一起放进邮件正文。
- 商业报价邮件必须使用 `quote_calculation.prepare_commercial_quote_email(...)` 的固定模板输出。
