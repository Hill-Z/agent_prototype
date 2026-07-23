# Script Tool Schema Overview

当前 主链路不是 外部 tool 服务，而是你们平台真实可用的 Skill 形态：每个 Skill 压缩包内包含 `SKILL.md` 和可被平台注册为 toolcall 的 `scripts/tool.py` 顶层函数。

```text
Agent 主提示词 -> 触发 Skill -> 调用 scripts/tool.py 顶层函数 -> 根据返回结果回复用户
```

当前业务验证优先使用下表脚本函数。

## Function List

| Skill | Function | Purpose | Typical inputs |
| --- | --- | --- | --- |
| `identity_verification` | `verify_identity` | 验证客户身份 | `account_no`, `postal_code`, `phone`, `email`, `id_last4` |
| `crm_query` | `query_crm` | 查询客户 CRM 概览 | `account_no`, `customer_id`, `phone`, `email` |
| `billing_query` | `query_bill` | 查询账单、金额、状态、到期日 | `account_no`, `customer_id`, `period` |
| `invoice_send` | `send_invoice` | 发送发票 / 回执 | `account_no`, `invoice_no`, `recipient_email`, `channel` |
| `quote_calculation` | `calculate_quote` | 计算非绑定报价 | `customer_type`, `plan`, `average_consumption_kwh`, `contract_duration_months`, `company_name`, `payment_method` |
| `renewal_handling` | `handle_renewal` | 查询/记录续约意向 | `account_no`, `postal_code`, `requested_plan`, `contract_duration_months` |
| `consent_management` | `manage_consent` | 查询或更新 consent | `account_no`, `phone`, `email`, `channel`, `action`, `consent_type` |
| `email_send` | `send_email_163` | 或真实 163 SMTP 发邮件 | `to`, `subject`, `body`, `cc` |
| `service_case` | `create_case` | 创建服务事项，后续可替换为生产工单接口 | `title`, `description`, `account_no`, `case_type`, `priority` |
| `web_engagement` | `get_web_context` | 根据业务验证触发词返回网站上下文 | `trigger` |
| `web_engagement` | `capture_lead` | 捕获网站潜客 | `company_name`, `contact_name`, `email`, `phone`, `enquiry_type` |
| `web_engagement` | `launch_whatsapp_link` | 生成 WhatsApp 继续咨询链接 | `prefill_text` |
| `human_handoff` | 无函数 | 输出平台转人工指令 | 固定话术 `好的，正在为您转接专属顾问。#instruct[human]` |

## Response Contract

脚本函数均返回中文字符串，便于 LLM 直接读取并组织客服回复。中不要求 JSON schema，但函数内部保留了 trace / Tool wording，避免把 Tool 结果包装成真实生产动作。

## Identity And Privacy Rules

- 账单、发票、CRM 详情、续约等账户敏感信息，应先调用 `verify_identity`。
- 未验证前，不回答完整账单金额、联系人、合同状态等敏感信息。
- Consent 变更必须基于用户明确表达，例如 “stop WhatsApp updates”、“unsubscribe marketing”。
- Tool 返回 Tool / simulated 时，面向用户使用“已记录/已提交/已发送给业务验证邮箱”等安全表述，不声称真实生产系统已完成。

## 163 Email Tool

`send_email_163` 默认 simulated，不配置环境变量也能业务验证。若后续要真实发送，配置：

```text
SMTP_HOST=smtp.163.com
SMTP_PORT=465
SMTP_USER=<163邮箱账号>
SMTP_AUTH_CODE=<163授权码，不是登录密码>
SMTP_FROM=<163邮箱账号>
```





