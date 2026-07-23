# PacificLight RFP Text Agent Configuration Package

本目录提供两个文本 Agent、逐个上传的 Skills 压缩包，以及每个 Skill 内置的 `scripts/tool.py` 工具函数。当前方案采用平台真实配置形态：

```text
Agent -> Skill -> scripts/tool.py 顶层函数 toolcall
```

## 交付物

| Path | Purpose |
| --- | --- |
| `agents/whatsapp_business_agent_prompt.md` | WhatsApp Business & Chats Agent 主提示词 |
| `agents/website_live_chat_agent_prompt.md` | Website Live Chat & Web Engagement Agent 主提示词 |
| `skills/*/SKILL.md` | Skill 说明与调用规则 |
| `skills/*/scripts/tool.py` | 平台可注册的业务工具函数 |
| `packages/skills/*.zip` | 平台可逐个上传的 skill 压缩包，包含 `SKILL.md` 和 `scripts/tool.py` |
| `docs/conversation-scenarios.md` | 业务对话剧本 |
| `docs/rfp-traceability.md` | RFP d/e 覆盖矩阵 |
| `docs/platform-tool-binding.md` | 平台绑定说明 |
| `docs/tool-schema-overview.md` | 工具函数说明 |

## Upload Steps

1. 创建 WhatsApp Agent，复制 `agents/whatsapp_business_agent_prompt.md` 作为主提示词。
2. 创建 Website Agent，复制 `agents/website_live_chat_agent_prompt.md` 作为主提示词。
3. 在平台 Skills 上传页，逐个上传 `packages/skills/*.zip`。
4. 将对应 skills 绑定到 Agent。
5. 平台应自动注册每个 skill 包中 `scripts/tool.py` 的顶层函数为可 toolcall 工具。
6. 按 `docs/conversation-scenarios.md` 进行业务验证。

## Skills And Script Tools

| Skill | Script tools |
| --- | --- |
| `identity_verification` | `verify_identity` |
| `crm_query` | `query_crm` |
| `billing_query` | `query_bill` |
| `invoice_send` | `send_invoice` |
| `quote_calculation` | `calculate_quote` |
| `renewal_handling` | `handle_renewal` |
| `consent_management` | `manage_consent` |
| `email_send` | `send_email_163` |
| `service_case` | `create_case` |
| `web_engagement` | `get_web_context`, `capture_lead`, `launch_whatsapp_link` |
| `human_handoff` | no script tool; output fixed instruction |

## Recommended Binding

### WhatsApp Business Agent

- `identity_verification`
- `crm_query`
- `billing_query`
- `invoice_send`
- `quote_calculation`
- `renewal_handling`
- `consent_management`
- `human_handoff`
- `email_send`
- `service_case`

### Website Live Chat Agent

- `web_engagement`
- `identity_verification`
- `crm_query`
- `billing_query`
- `invoice_send`
- `quote_calculation`
- `renewal_handling`
- `consent_management`
- `human_handoff`
- `email_send`
- `service_case`

## Variable Assumption

当前提示词不依赖平台未确认存在的隐藏变量。业务验证时通过用户输入、明确页面/场景触发词和工具函数触发业务流程。

## Handoff Rule

固定输出：

```text
好的，正在为您转接专属顾问。#instruct[human]
```

上线前需要确认 SaaS 平台支持“话术 + `#instruct[human]` 同行触发”。如果平台只支持独立指令行，应将输出格式调整为平台要求。

## Service Case Creation

`service_case` 用于记录客户服务事项。对用户推荐说：

```text
我已记录您的问题，并提交对应团队继续跟进。
```

拿到真实工单接口后，替换 `skills/service_case/scripts/tool.py` 内的 `create_case` 实现。

## Email Sending

`email_send/scripts/tool.py` 支持两种运行方式：

- 未配置 SMTP 环境变量时，返回邮件已提交的业务结果，便于完成端到端业务验证。
- 配置 `SMTP_HOST`、`SMTP_PORT`、`SMTP_USER`、`SMTP_AUTH_CODE`、`SMTP_FROM` 后，通过 163 SMTP 发送邮件。

## Rebuild Skill Packages

```powershell
.\packages\skills\package-skills.ps1
```

## Verification

```text
Python script tools: import and sample calls passed
skills packages: all zip files contain SKILL.md and scripts/tool.py where applicable
external wording scan: no customer-facing internal implementation wording remains
```

