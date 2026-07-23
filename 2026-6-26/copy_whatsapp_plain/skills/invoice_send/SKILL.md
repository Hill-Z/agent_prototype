---
name: invoice_send_whatsapp
description: PacificLight 发票/PDF 账单链接技能。用于已验证客户索取发票、PDF bill、账单副本、下载账单或查看账单 PDF 链接时。
---

# 发票 / PDF 账单

## 何时使用

客户要求发票、PDF bill、账单副本、下载链接或查看 PDF 文档时使用。

## 调用前检查

需要账户已验证，或客户已通过账单查询提供账户号和邮编。未指定发票号时发送最新账单发票。

## 工具使用

调用 `send_invoice(account_no, invoice_no, recipient_email, channel, language)`。

## 返回后处理

- PDF 链接必须展示为简洁客服话术 + 纯文本链接，不要裸露长 URL，不要输出发送编号、渠道、内部指引等系统字段。
- 中文：`PDF 文档：PDF_URL`
- 英文：`PDF document: PDF_URL`
- 如果客户要求发送完整账单邮件，优先使用 `email_send.send_bill_email(...)`。


## WhatsApp 纯文本展示要求

- 聊天窗口输出必须是纯文本。
- 不要输出 Markdown 表格、`##` / `###` 标题、`**` 加粗、`[文本](URL)` 链接或 HTML 标签。
- 链接用 `说明：URL` / `Label: URL`。
- 邮件正文和工单 content 可继续使用 HTML 富文本。
