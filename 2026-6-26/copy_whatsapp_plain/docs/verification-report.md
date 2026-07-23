# WhatsApp Plain Agent Verification Report

Verification date: 2026-07-17

## Changes verified

- Additional report recipients use `Additional Recipient Ticket` in the prompt, Skill, tool payload, ticket subject/content, scenarios, and packaged Skill.
- Move-house prompts require year-qualified dates and call separate `move_out_date` and `new_supply_date` fields.
- The move-house tool rejects dates before 2026 and month/day-only values, while preserving a strict legacy fallback for two explicit full dates.
- WhatsApp customer-facing results remain plain text; HTML remains limited to ticket and email payloads.

## Checks

- All 9 `skills/*/scripts/tool.py` files compiled from UTF-8 source without writing bytecode.
- Source cache artifacts: 0.
- Legacy additional-recipient wording in source and docs: 0.
- Stale-year literals in source and docs: 0.
- English and Chinese Additional Recipient Ticket smoke tests passed.
- Move-house smoke tests passed for rejected stale-year dates, rejected missing-year dates, structured 2026 dates, and legacy two-date input.
- All 9 ZIP packages contain UTF-8-readable text, matching internal Skill names, and no `__pycache__`, `.pyc`, or `.pyo` entries.
- `account_update_whatsapp.zip` and `service_case_whatsapp.zip` match their source Skill folders byte-for-byte.
