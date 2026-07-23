---
name: web_engagement
description: PacificLight 网站互动技能。用于网站聊天中的页面上下文、商业报价页触发、注册中断、潜客捕获和跳转 WhatsApp。商业报价上下文支持 retail、manufacturing、green 三类触发。
---

# 网站互动

用于 Website Live Chat & Web Engagement 场景。

## 可用工具

### get_web_context(trigger, language)

返回当前网站咨询上下文。`language` 必须按客户最后一句语言传入：英文传 `en`，中文传 `zh`。

常用 trigger：

| Trigger | 用途 |
|---|---|
| `commercial_quote` | 通用商业报价 |
| `commercial_quote_retail` | 中小企业/门店报价 |
| `commercial_quote_manufacturing` | 高用电量制造业报价 |
| `commercial_quote_green` | 绿色电力/ESG 报价 |
| `signup_abandoned` | 开户注册中断 |
| `returning_customer` | 回访客户账户服务 |
| `termination` | 账户终止咨询 |

### capture_lead(company_name, contact_name, email, phone, enquiry_type, language)

保存销售线索。`language` 必须按客户最后一句语言传入：英文传 `en`，中文传 `zh`。

### launch_whatsapp_link(prefill_text, trigger, language)

生成 WhatsApp 继续咨询链接。`trigger` 可传 `signup_abandoned` 等上下文；`language` 必须按客户最后一句语言传入：英文传 `en`，中文传 `zh`。如果 `prefill_text` 为空，工具会根据 `trigger` 自动生成 WhatsApp 预填文本。工具返回 `FINAL_ANSWER` 时，智能体直接输出其后的内容。

## 使用规则

1. 不假设平台自动提供页面变量；需要上下文时调用 `get_web_context`。
2. 潜客捕获前至少获取邮箱或电话之一。
3. 报价、续约、开户、转名、停用等事项需要根据用户输入收集必要信息。
4. 用户明确希望切换 WhatsApp、继续 WhatsApp、发送 WhatsApp 链接、发链接、link、continue on WhatsApp 时，立即调用 `launch_whatsapp_link`。
5. 用户同时表达“注册/开户注册中断/做到一半/不知道怎么继续”以及“WhatsApp/链接/继续咨询/发我链接”时，不要再二次确认，直接调用 `launch_whatsapp_link(trigger="signup_abandoned", language=...)`。
6. 用户只表达开户注册中断但没有要求 WhatsApp 链接时，先提供继续开户注册协助，并询问是否需要切换到 WhatsApp。


## 多语言规则

客户使用什么语言提问，智能体最终就使用同一种语言回复。工具返回内容、`FINAL_ANSWER`、技能描述或历史消息不得覆盖客户最后一句语言；如语言不一致，必须翻译为客户最后一句语言后再回复。工具返回内容可由智能体翻译，但账户号、发票号、日期、金额、URL、套餐名、邮箱地址和指令必须保持原样。如工具函数提供 `language` 参数，英文客户传 `en`，中文客户传 `zh`。

