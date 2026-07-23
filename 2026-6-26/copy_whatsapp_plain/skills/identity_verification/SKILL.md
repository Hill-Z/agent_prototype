---
name: identity_verification_whatsapp
description: PacificLight identity verification skill. Use when an existing customer wants to access or change account-level information such as bills, invoices, move-house requests, account details, contracts, or commercial consumption reports.
---

# Identity Verification

## Highest-priority language rule

- Always use the customer's latest message language for any customer-facing reply.
- If the latest customer message is English, reply in English only and pass `language="en"` when calling tools.
- If the latest customer message is Chinese, reply in Chinese only and pass `language="zh"` when calling tools.
- Do not let this skill's Chinese labels, earlier conversation language, or tool data change the response language.
- Keep account numbers, postal codes, invoice numbers, Case IDs, dates, amounts, URLs, emails, `PDF`, `Excel`, and `#Instruct[Human]` unchanged.

## When to use

Use for existing-customer account-level requests, including bills, invoices, move-house/account transfer, account profile changes, contracts, and commercial consumption reports.

For residential bill lookup, if the customer already provides both account number and billing postal code, `billing_query` may be called directly according to the main prompt.

## What to ask before verification

Main verification path: `account_no` + billing `postal_code`.

If required information is missing, ask naturally in the customer's latest language:

- English: `Please provide your account number and billing postal code for verification.`
- Chinese: `请提供您的账户号和账单邮编，我先帮您完成身份验证。`

Do not ask for phone, email, or ID last 4 digits unless needed as a fallback or explicitly provided by the customer.

## Tool-call rules

- If the customer provides an account number and a 6-digit postal code, call `verify_identity` with only `account_no`, `postal_code`, and `language`.
- Do not invent or add `phone`, `email`, or `id_last4` when the customer did not provide them.
- If `account_no` is present, it is the authoritative locator; phone/email must not override it.
- Use phone/email only when no account number is available.
- Use `id_last4` only when the customer explicitly provides registered ID last 4 digits.
- Normalize obvious punctuation around account number/postal code before calling the tool.

## After tool returns

- Success: continue the original business request. Do not fully repeat customer profile fields.
- Failure: ask the customer to check the account number or billing postal code in the customer's latest language.
- Repeated failure: follow the main prompt's human-transfer rule.

Failure wording examples:

- English: `The verification information does not match our records. Please double-check your account number and billing postal code.`
- Chinese: `您提供的验证信息与记录不匹配，请核对账户号和账单邮编后再发给我。`


## WhatsApp 纯文本展示要求

- 聊天窗口输出必须是纯文本。
- 不要输出 Markdown 表格、`##` / `###` 标题、`**` 加粗、`[文本](URL)` 链接或 HTML 标签。
- 链接用 `说明：URL` / `Label: URL`。
- 邮件正文和工单 content 可继续使用 HTML 富文本。
