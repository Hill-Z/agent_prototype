# Platform Skill Binding Guide

当前 主方案使用平台真实 skill 形态：每个 skill 压缩包内包含：

```text
SKILL.md
scripts/tool.py
```

平台上传 skill 后，应将 `scripts/tool.py` 中的顶层函数注册为可 toolcall 的工具。

## Upload Order

1. 上传 `packages/skills/*.zip`。
2. 为 WhatsApp Agent 绑定 WhatsApp 相关 skills。
3. 为 Website Agent 绑定 Website 相关 skills。
4. 根据 `docs/conversation-scenarios.md` 进行业务验证。

## Skill To Function Mapping

| Skill | Functions in `scripts/tool.py` |
| --- | --- |
| identity_verification | `verify_identity` |
| crm_query | `query_crm` |
| billing_query | `query_bill` |
| invoice_send | `send_invoice` |
| quote_calculation | `calculate_quote` |
| renewal_handling | `handle_renewal` |
| consent_management | `manage_consent` |
| email_send | `send_email_163` |
| service_case | `create_case` |
| web_engagement | `get_web_context`, `capture_lead`, `launch_whatsapp_link` |
| human_handoff | no function required; output fixed instruction |

## WhatsApp Business Agent Suggested Skills

- identity_verification
- crm_query
- billing_query
- invoice_send
- quote_calculation
- renewal_handling
- consent_management
- human_handoff
- email_send
- service_case

## Website Live Chat Agent Suggested Skills

- web_engagement
- identity_verification
- crm_query
- billing_query
- invoice_send
- quote_calculation
- renewal_handling
- consent_management
- human_handoff
- email_send
- service_case

## Human Handoff

No tool is needed. The Agent replies exactly:

```text
好的，正在为您转接专属顾问。#instruct[human]
```

## 

