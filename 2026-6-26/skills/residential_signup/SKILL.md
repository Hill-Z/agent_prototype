---
name: residential_signup
description: PacificLight 新家庭客户开户注册与固定价格计划技能。用于住宅新客咨询 fixed price plan、开户注册、注册中断、发送邮箱开户注册链接等场景。
---

# Residential Signup

## 什么时候使用

用户是新家庭客户，咨询住宅固定价格计划、开户注册、注册做到一半、从其他电力零售商切换、想要开户链接或开户注册入口时使用。

## 可用工具

### get_residential_fixed_plans(customer_scenario, dwelling_type, switching_from_retailer, language)

查询住宅固定价格计划，并根据客户场景给出推荐。

### send_signup_link(channel, contact, plan, customer_scenario, language)

准备开户注册链接。当前正式服务默认使用邮件发送，收件邮箱为 `sunlin@udesk.cn`。该函数只准备链接，不代表邮件已经发送。

### prepare_signup_email(plan, recipient_email, customer_scenario, dwelling_type, language)

生成开户注册邮件的 `SUBJECT`、`RECIPIENT`、`SIGNUP_LINK` 和 `EMAIL_HTML`。生成后必须继续调用 `email_send.send_email(subject, email_content)` 完成发送。

## 调用规则

1. 新客户咨询开户注册、固定价格计划或注册中断时，不要要求账户号或邮编。
2. 如果用户已说明住宅/家用/HDB/flat/home，直接按 residential 处理。
3. 用户不确定选哪个计划时，先寒暄并询问一个关键问题：搬新家还是从其他零售商切换；如已说明，则直接调用 `get_residential_fixed_plans`。
4. 新家庭客户要求开户链接、继续注册链接或把链接发给我时，默认发送到账户联系邮箱 `sunlin@udesk.cn`；不要主动建议 SMS 或 WhatsApp，除非用户明确要求。
5. 邮件发送闭环：先调用 `send_signup_link(...)` 或 `prepare_signup_email(...)` 获取链接和邮件内容，再调用 `email_send.send_email(subject, email_content)`；最后告知用户已发送至 `sunlin@udesk.cn`。
6. 不要提及模拟、mock、演示、测试或内部配置。

## 多语言规则

客户使用什么语言提问，最终就使用同一种语言回复。工具函数有 `language` 参数时，英文传 `en`，中文传 `zh`。计划名、金额、日期、URL、邮箱不翻译。
