---
name: consent_management
description: PacificLight Consent 管理技能。处理 WhatsApp、SMS、邮件营销、账户通知和隐私授权的查询、订阅与退订。
---

# Consent 管理

## 什么时候使用

用户表达订阅、退订、不想收到消息、同意营销、更新通知偏好、WhatsApp opt-in/out、PDPA consent 时使用。

## 可用工具

### manage_consent(account_no, phone, email, channel, action, consent_type)

`action` 可为 `query`、`opt_in`、`opt_out`。`consent_type` 可为 `whatsapp`、`sms`、`email_marketing`、`account_notifications`。

## 调用规则

1. 变更账户级通知前需要确认客户身份。
2. 用户退订时不得阻拦。
3. 必须明确说明更新后的状态。




## 多语言规则

客户使用什么语言提问，智能体最终就使用同一种语言回复。工具返回内容、`FINAL_ANSWER`、技能描述或历史消息不得覆盖客户最后一句语言；如语言不一致，必须翻译为客户最后一句语言后再回复。工具返回内容可由智能体翻译，但账户号、发票号、日期、金额、URL、套餐名、邮箱地址和指令必须保持原样。如工具函数提供 `language` 参数，英文客户传 `en`，中文客户传 `zh`。

