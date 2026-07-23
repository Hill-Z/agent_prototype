---
name: service_case
description: PacificLight 服务事项创建技能。用于商业用电报告、投诉、复杂账单问题、商业报价 callback 回电工单、Additional Recipient Ticket、账户关闭或需要团队后续处理的请求。
---

# 服务事项 / 商业用电报告

## 何时使用

- 商业客户要 consumption report、季度用电、财务/ESG 报告、PDF/Excel。
- 客户需要销售跟进、callback 回电、投诉处理、复杂账单或人工团队后续。
- 客户要求把报告发给额外邮箱，需要创建 Additional Recipient Ticket。中文模板 `template_id=2924`，英文模板 `template_id=2925`。

## 商业报告调用前检查

商业用电报告不要使用 `billing_query`。必须先完成身份验证，并确认：

- `account_no`
- 报告周期，例如 `2026-04 to 2026-06`
- 报告格式：PDF / Excel / Both

## 工具使用

- 创建报告请求：`create_consumption_report_request(...)`
- 准备报告邮件：`prepare_consumption_report_email(...)`
- 发送报告邮件：继续调用 `email_send.send_email(subject, email_content)`
- 通用服务事项 / 商业报价 callback 回电工单：`create_case(...)`

## 返回后处理

- `create_consumption_report_request(...)` 返回 Markdown 卡片和 PDF 链接。
- 客户回复“PDF / 要PDF / pdf / 只要 PDF”只代表报告格式选择为 PDF；不得理解为客户已确认发送邮件。
- 创建报告请求后只展示报告请求事实和 PDF 链接；不要在同一轮继续调用 `prepare_consumption_report_email(...)` 或 `email_send.send_email(...)`，也不要主动追加邮箱发送追问。
- 只有客户明确说“发送邮箱 / 发到邮箱 / 帮我发邮件 / yes, send it / send to email”时，才准备并发送报告邮件。
- 报告邮件必须先用 `prepare_consumption_report_email(...)` 生成模板，不要手写正文。
- 客户要求发送到额外邮箱时，只能创建 Additional Recipient Ticket，不要承诺已直接发送。只有客户明确提供真实邮箱地址时才传 `additional_recipient`；不要传“暂未提供 / 未提供 / not provided / none”等占位值。工具会按语言选择工单模板：中文 template_id=2924，英文 template_id=2925。


- 额外邮箱分支只返回 Additional Recipient Ticket 审核结果，不重复输出用电报告请求、报告链接或账户登记邮箱信息。


## Commercial quote callback

客户要求销售联系、顾问跟进或回电时，使用 `create_case(case_type="commercial_quote", title=..., description=..., language=...)` 创建 callback 回电工单。`description` 必须包含客户提供的联系人姓名、邮箱或电话、公司/店铺、预估用电量、合同期、开始日期等已知信息。
