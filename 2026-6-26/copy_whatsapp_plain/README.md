# PacificLight WhatsApp Plain Agent 配置说明

本目录是收口版副本，不影响上一级当前工作版本。

## 目标范围

只覆盖：

1. New Residential 新家庭客户开户注册与固定价格计划推荐
2. Existing Residential 老家庭客户搬家 / 转移账户
3. New Commercial 新商业客户商业报价
4. Existing Commercial 老商业客户用电报告
5. Residential 个人账单查询 / PDF 账单发送

## WhatsApp 主提示词

平台部署使用：

- `agents/whatsapp_plain_agent_prompt.md`：WhatsApp 纯文本收口版，可直接粘贴到平台
- `agents/website_live_chat_agent_prompt.md`：与 WhatsApp 主提示词保持内容同步的兼容副本
- `agents/website_live_chat_agent_prompt.original.md`：原始版本备份

## 建议挂载 skills

上传 `packages/skills` 下这些 zip：

- `residential_signup_whatsapp.zip`
- `identity_verification_whatsapp.zip`
- `account_update_whatsapp.zip`
- `quote_calculation_whatsapp.zip`
- `service_case_whatsapp.zip`
- `billing_query_whatsapp.zip`
- `invoice_send_whatsapp.zip`
- `email_send_whatsapp.zip`

## 暂时不要挂载

- `web_engagement`
- `consent_management`
- `renewal_handling`
- `crm_query`

说明：当前副本优先保障 Word 里的 4 个场景和个人账单场景稳定运行。

## 剧本

- `docs/conversation-scenarios-bilingual.md`：中英双语收口版剧本

## 注意事项

- 新家庭客户先问客户希望接收邮件的邮箱。
- 老客户/商业客户涉及账户信息前需要身份验证。
- 用户同时提供账户号和 6 位邮编时，直接调用验证或查询，不要重复确认。
- 服务请求类结果要转成自然客服话术，不要裸输出字段清单。

