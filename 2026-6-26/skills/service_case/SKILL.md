---
name: service_case
description: PacificLight 服务事项创建技能。用于投诉、复杂账单问题、搬家后续、商业续约跟进、商业用电报告、额外收件人审批、账户关闭和需要团队跟进的服务请求。
---

# 服务事项记录

用于创建需要后续团队处理的服务事项。商业用电报告不新增独立 skill，统一在本技能中处理。

## 可用工具

### create_case(title, description, account_no, case_type, priority, language)

创建普通服务事项、续约跟进、投诉、复杂查询等请求。

### create_consumption_report_request(account_no, period, report_format, send_to_registered_email, additional_recipient, language)

为现有商业客户创建用电报告请求。支持 PDF、Excel 或 Both。返回报告 PDF 链接。额外收件人需要账户管理员审批。

### prepare_consumption_report_email(account_no, period, report_format, language)

生成商业用电报告邮件的 `SUBJECT`、`RECIPIENT`、`REPORT_PDF_URL` 和 `EMAIL_HTML`。生成后必须继续调用 `email_send.send_email(subject, email_content)` 完成发送。

## 使用规则

1. 用户要求人工后续、投诉、复杂争议、搬家后续、账户关闭、商业续约、用电报告、额外财务邮箱审批时使用。
2. 商业客户要求 consumption report / electricity consumption report / 用电报告 / 上季度用电汇总 / 财务或 ESG 报告时，先完成身份验证，再使用 `create_consumption_report_request`。
3. 报告支持 PDF、Excel 或 Both；用户未指定格式时先问格式。
4. 用户要求发邮箱时，默认发送到账户登记账单邮箱 `sunlin@udesk.cn`。先调用 `prepare_consumption_report_email(...)`，再调用 `email_send.send_email(subject, email_content)`。
5. 如果用户要求新增财务邮箱或额外收件人，填写 `additional_recipient`；回复必须说明需要账户管理员审批，不要承诺已直接发送到该额外邮箱。
6. 工具返回 `FINAL_ANSWER:` 时，直接输出其后的内容，不要继续调用同一工具；若还需要发邮件，先调用邮件准备函数，再调用 `email_send`。
7. 不要提及模拟、mock、演示、测试或内部配置。

## 多语言规则

客户使用什么语言提问，最终就使用同一种语言回复。工具函数有 `language` 参数时，英文传 `en`，中文传 `zh`。账户号、日期、邮箱、Case ID、URL 不翻译。
