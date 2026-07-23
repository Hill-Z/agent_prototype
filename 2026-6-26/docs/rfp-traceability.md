# RFP d/e Traceability Matrix

This matrix maps the RFP requirements for **d. WhatsApp Business & Chats** and **e. Website Live Chat & Web Engagement** to the delivered prompts, skills, and executable script tools.

## d. WhatsApp Business & Chats

| RFP requirement | Delivered coverage | Prompt / Skill | Script tools |
| --- | --- | --- | --- |
| Automated self-service via WhatsApp Business | WhatsApp Agent handles self-service intents and routes to business skills | `agents/whatsapp_business_agent_prompt.md` | `verify_identity`, `query_bill`, `send_invoice`, `query_crm`, `handle_renewal`, `manage_consent` |
| AI chatbot answers customer queries | Agent prompt plus skills for billing, invoice, CRM, renewal, quote and consent | `billing_query`, `invoice_send`, `crm_query`, `renewal_handling`, `quote_calculation`, `consent_management` | `query_bill`, `send_invoice`, `query_crm`, `handle_renewal`, `calculate_quote`, `manage_consent` |
| Retrieve invoices | Invoice skill queues invoice delivery and returns reference | `invoice_send` | `send_invoice` |
| Support renewal and onboarding | Renewal skill and quote/customer profile support | `renewal_handling`, `quote_calculation`, `crm_query` | `handle_renewal`, `calculate_quote`, `query_crm` |
| Improve responses over time | Prompts require using tool results and not inventing account values; trace strings enable review | Both agent prompts | Script result strings contain status wording where relevant |
| Handle WhatsApp opt-in/opt-out | Consent skill manages WhatsApp consent | `consent_management` | `manage_consent` |
| Escalate to live agent with history preserved | Handoff skill asks agent to summarize context, then output fixed platform instruction | `human_handoff` | no function; `#instruct[human]` |
| Preserve language-specific context | Agent replies in the user's language and does not rely on hidden platform variables | WhatsApp Agent prompt | N/A |
| PDPA-compliant consent capture | Consent skill requires explicit consent and audit-safe reply | `consent_management` | `manage_consent` |
| Consent expiry and renewal handling | Consent skill includes query/update/audit flow | `consent_management` | `manage_consent` |
| Audit trail for marketing consent updates | Consent function returns Tool audit/reference text | `consent_management` | `manage_consent` |

## e. Website Live Chat & Web Engagement

| RFP requirement | Delivered coverage | Prompt / Skill | Script tools |
| --- | --- | --- | --- |
| Embedded website chat widget | Website Agent prompt is scoped to website live chat sessions | `agents/website_live_chat_agent_prompt.md` | N/A |
| AI engagement based on browsing behavior | Web engagement skill can be triggered by context such as commercial quote / abandoned signup | `web_engagement` | `get_web_context` |
| Identify returning visitors | Website agent asks for account/contact details when needed; it does not assume hidden visitor variables | Website Agent prompt, `crm_query` | `query_crm` |
| Proactive chat invitations | Website prompt and script show proactive help based on explicit trigger/context | Website Agent prompt, `web_engagement` | `get_web_context` |
| Escalation from chatbot to live agent | Handoff skill and fixed instruction | `human_handoff` | no function; `#instruct[human]` |
| Preserve browsing context during handover | Handoff prompt includes current conversation summary; web engagement tool can provide page-like context for | `web_engagement`, `human_handoff` | `get_web_context` |
| Launch WhatsApp from website | Web engagement skill generates WhatsApp continuation link | `web_engagement` | `launch_whatsapp_link` |
| Integration to lead capture forms | Web engagement skill captures lead details | `web_engagement` | `capture_lead` |
| Track customer journey across website and chat | context is supplied through explicit trigger or user-provided details, not hidden variables | `web_engagement` | `get_web_context` |
| Commercial quote from rate card | Quote skill generates non-binding quote from rate card | `quote_calculation` | `calculate_quote` |
| Pricing maintained in knowledge/rate base | Script Tool data represents centrally maintained rate cards | `quote_calculation` | `calculate_quote` |
| Further enquiries emailed to sales group/person | Email skill can simulate or send through 163 SMTP | `email_send`, `crm_query` | `send_email_163`, `query_crm` |
| Commercial renewal requests | Renewal skill validates and routes sales follow-up | `renewal_handling` | `handle_renewal` |
| Account closure / move-house / novation guidance | Prompts guardrail these as service requests; service case or handoff handles escalation | Website prompt, `service_case`, `human_handoff` | `create_case` |

## Known Boundaries

- `create_case` can be replaced with the production ticket API when it is provided.
- `send_email_163` simulates sending unless SMTP environment variables are fully configured.
- Human handoff depends on the SaaS platform parsing `#instruct[human]` in the configured output format.





