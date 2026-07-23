---
name: residential_signup
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

如果客户已经明确是住宅用电，并提供 HDB / Condo / landed / flat 等住宅类型，或明确表示从其他电力零售商切换，则视为计划推荐所需信息已足够，必须先调用 `get_residential_fixed_plans(...)` 展示套餐和推荐理由。不要在展示套餐前询问邮箱或注册链接。

## 工具使用

- 计划推荐：`get_residential_fixed_plans(...)`
- 准备邮件：`prepare_signup_email(plan, recipient_email, customer_scenario, dwelling_type, language)`
- 客户在看到计划结果后明确要求邮件或链接时，先问邮箱，再用 `email_send.send_email(subject, email_content)` 发送。

## 返回后处理

计划工具结果必须在当前轮完整展示，不能概括成“以上是推荐计划”或延迟到客户追问后再展示。工具结果只包含套餐卡片和推荐计划，不追加总结、免责声明或邮箱引导。只有客户后续明确要求邮件或链接时，才询问收件邮箱；不得代替客户回复“是的”或编造邮箱。邮件发送成功后自然告知客户查收。

