---
name: residential_signup_whatsapp
description: PacificLight 新家庭客户开户注册与住宅固定价格计划技能。用于开户注册、注册中断、住宅电价、固定价格计划推荐、从其他电力零售商切换或发送开户链接。
---

# 新家庭客户开户注册

## 何时使用

客户咨询家用电、开户注册、住宅计划、fixed price plan、切换电力零售商、注册做到一半、要开户链接时使用。

## 调用前检查

新客户不需要身份验证。根据客户已提供信息灵活补齐：

- 家用还是商业
- 搬新家还是从其他零售商切换
- 住宅类型：HDB / Condo / landed / 几房式
- 偏好：价格稳定、短合约、绿色电力

信息不足时每轮只问 1-2 个关键问题。

## 工具使用

- 计划推荐：`get_residential_fixed_plans(...)`
- 准备邮件：`prepare_signup_email(plan, recipient_email, customer_scenario, dwelling_type, language)`
- 客户要求邮件或链接时，先问邮箱，再用 `email_send.send_email(subject, email_content)` 发送。

## 返回后处理

计划结果用 纯文本分行展示，说明推荐理由和参考性质。推荐计划后只询问/提示客户提供收件邮箱，不得代替客户回复“是的”或编造邮箱。邮件发送成功后自然告知客户查收。



## WhatsApp 纯文本展示要求

- 聊天窗口输出必须是纯文本。
- 不要输出 Markdown 表格、`##` / `###` 标题、`**` 加粗、`[文本](URL)` 链接或 HTML 标签。
- 链接用 `说明：URL` / `Label: URL`。
- 邮件正文和工单 content 可继续使用 HTML 富文本。
