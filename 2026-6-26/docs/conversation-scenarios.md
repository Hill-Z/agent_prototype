# 业务对话剧本

以下剧本按真实业务验证设计：不依赖隐藏变量，不要求平台自动提供页面 URL、客户 ID 或会话摘要。所有业务结果由用户话术触发 skill toolcall。

## 多语言演示规则

客户使用中文时，Agent 回复中文；客户使用英文时，Agent 回复英文；客户中英混合时，优先使用客户主要语言。账户号、发票号、金额、日期、URL 和指令保持原样。

## 可用业务数据

| 场景        | 账户号         | 邮编       | 客户                        | 类型          | 账单状态        | 关键看点                           |
| --------- | ----------- | -------- | ------------------------- | ----------- | ----------- | ------------------------------ |
| 住宅未支付账单   | `R-PL-1001` | `238888` | Tan Mei Ling              | Residential | Outstanding | 完整 Markdown 账单、应付总额 SGD 134.89 |
| 住宅已支付账单   | `R-PL-1002` | `520201` | Nur Aisyah Binte Rahman   | Residential | Paid        | 已支付账单、不同地址和用电量                 |
| 商业客户账单/续约 | `C-PL-2001` | `609999` | ABC Manufacturing Pte Ltd | Commercial  | Outstanding | 商业高用电量、续约、销售跟进                 |

***

## 1. WhatsApp - 住宅未支付账单查询

**目标：** 展示 WhatsApp 自助服务、账户校验、完整 Markdown 电费账单展示。

**用户：** 我要查一下我的电费账单。

**Agent：** 请提供您的账户号和邮编，我帮您查询账单。

**用户：** R-PL-1001，238888。

**Toolcall：** `query_bill(account_no="R-PL-1001", postal_code="238888", period="latest")`

**工具返回要点：** `FINAL_ANSWER`，客户 Tan Mei Ling，账期 2026-06，发票号 PL-R-202606-001，本期用电量 452 kWh，应付总额 SGD 134.89，到期日 2026-07-15，状态未支付。

**Agent：** 直接输出 `FINAL_ANSWER` 后的 Markdown 账单，不再继续调用工具。

***

## 2. WhatsApp - 住宅已支付账单查询

**目标：** 展示第二组住宅客户数据，状态为已支付，避免所有案例都显示未支付。

**用户：** Can you check my latest electricity bill?

**Agent：** Sure. Please provide your account number and postal code so I can retrieve your bill.

**用户：** R-PL-1002, 520201.

**Toolcall：** `query_bill(account_no="R-PL-1002", postal_code="520201", period="latest")`

**工具返回要点：** `FINAL_ANSWER`，客户 Nur Aisyah Binte Rahman，账期 2026-06，发票号 PL-R-202606-002，本期用电量 314 kWh，应付总额 SGD 93.48，状态已支付。

**Agent：** 直接输出 `FINAL_ANSWER` 后的 Markdown 账单。由于账单状态为已支付，温馨提示应说明“已支付，无需再次付款”，不要提醒及时付款。

***

## 3. WhatsApp - 发票发送

**目标：** 展示账单查询后发送发票。

**用户：** 请把我的 6 月账单发票发到邮箱。

**Agent：** 请提供您的账户号和邮编，我帮您确认后发送。

**用户：** R-PL-1001，238888。

**Toolcall：** `query_bill(account_no="R-PL-1001", postal_code="238888", period="latest")`

**Agent：** 我查到您的 2026 年 6 月发票号为 PL-R-202606-001。请问发送到系统邮箱 <sunlin@udesk.cn> 可以吗？

**用户：** 可以。

**Toolcall：** `send_invoice(account_no="R-PL-1001", invoice_no="PL-R-202606-001", channel="email")`

**Agent：** 发票发送已提交，收件邮箱为 <sunlin@udesk.cn>。邮件标题应为 `PacificLight Electricity Bill PL-R-202606-001 - 2026-06`，邮件正文需包含完整账单数据和 PDF Link：https://espreview.s4.udesk.cn/onlinePreview?url=RDZDQUNBQ0VDRDg0OTE5MURGRDJENzkzQ0Q4QjkzRDVEMzkzQ0VDQkRDOTNDRENBREE5MENCREFEQkNERDVERENEOTBEREQxRDM5MUZBREZDQURGOTE4RjhCOTE4QURCOEY4RURCRERERjg4OTM4NjhEOEI4RTkzOEE4Qjg4REY5Mzg2OEU4NjhDOTNEQURBREE4RjhBOEU4ODg5OEREQkQ4OEQ5MUVFREZEREQ3RDhEN0RERjJEN0Q5RDZDQUUxRkJEMkRCRERDQUNDRDdEREQ3Q0FDN0UxRkNEN0QyRDJFMUVDOTNFRUYyOTM4RjhFOEU4RkUxOEM4RThDODg5MzhFODg5MENFREFEODgxREREMUQwQ0FEQkQwQ0E4Mw%3D%3D

***

## 4. WhatsApp - Consent 退订

**目标：** 展示 WhatsApp opt-out / PDPA consent 管理。

**用户：** 我不想再收到 WhatsApp 营销消息。

**Agent：** 可以，我会帮您更新 WhatsApp 营销消息偏好。请提供您的账户号或手机号用于确认。

**用户：** R-PL-1002。

**Toolcall：** `manage_consent(account_no="R-PL-1002", channel="whatsapp", action="opt_out", consent_type="whatsapp")`

**Agent：** 已为您更新 WhatsApp 消息偏好：当前状态为已退订。账户通知类必要消息不受营销退订影响。

***

## 6. Website - 商业报价 + 潜客捕获 + 邮件发送

**目标：** 展示网站商业报价、三类 rate card、lead capture、邮件发送。

### 5.1 小型零售商业报价 - Commercial Fixed 12

**用户：** I run a small retail shop and would like to know the commercial electricity rate.

**Toolcall：** `get_web_context(trigger="commercial_quote_retail")`

**Agent：** Sure. For a small retail shop, I can estimate a 12-month fixed-rate plan. May I have your company name and average monthly consumption?

**用户：** BrightMart Retail, around 3500 kWh per month, 12 months.

**Toolcall：** `calculate_quote(customer_type="commercial", plan="fixed12", average_consumption_kwh="3500", contract_duration_months="12", company_name="BrightMart Retail Pte Ltd")`

**工具返回要点：** Commercial Fixed 12，SGD 0.255/kWh，月均 3500 kWh，Estimated Monthly Total SGD 1002.42，Estimated Contract Total SGD 12029.04。

**Agent：** 保留工具返回的 Markdown 报价表，并说明最终价格以 PacificLight 销售团队确认为准。随后询问是否留下邮箱或电话。

**用户：** <sunlin@udesk.cn>.

**Toolcall：** `capture_lead(company_name="BrightMart Retail Pte Ltd", email="sunlin@udesk.cn", enquiry_type="commercial_quote_retail")`

**Toolcall：** `send_email(subject="PacificLight Commercial Fixed 12 Quote Summary", email_content="<p>Dear Customer,</p><p>Here is your PacificLight commercial quote summary...</p><table>...</table><p>Best regards,<br><strong>PacificLight Customer Service</strong><br>PacificLight Energy</p>")`

**Agent：** Your quote request has been recorded, and the Commercial Fixed 12 quote summary has been sent to <sunlin@udesk.cn>.

### 5.2 制造业商业报价 - Commercial Fixed 24

**用户：** I would like to know the commercial electricity rate for our factory.

**Toolcall：** `get_web_context(trigger="commercial_quote_manufacturing")`

**Agent：** Sure. For a manufacturing site, I can estimate a 24-month commercial fixed plan. May I have your company name and average monthly consumption?

**用户：** ABC Manufacturing, around 12000 kWh per month, 24 months.

**Toolcall：** `calculate_quote(customer_type="commercial", plan="fixed24", average_consumption_kwh="12000", contract_duration_months="24", company_name="ABC Manufacturing Pte Ltd")`

**工具返回要点：** Commercial Fixed 24，SGD 0.245/kWh，月均 12000 kWh，Estimated Monthly Total SGD 3288.86，Estimated Contract Total SGD 78932.64。

**Agent：** 保留工具返回的 Markdown 报价表，并说明最终价格以 PacificLight 销售团队确认为准。随后询问是否留下邮箱或电话。

**用户：** <sunlin@udesk.cn>.

**Toolcall：** `capture_lead(company_name="ABC Manufacturing Pte Ltd", email="sunlin@udesk.cn", enquiry_type="commercial_quote_manufacturing")`

**Toolcall：** `send_email(subject="PacificLight Commercial Fixed 24 Quote Summary", email_content="<p>Dear Customer,</p><p>Here is your PacificLight commercial quote summary...</p><table>...</table><p>Best regards,<br><strong>PacificLight Customer Service</strong><br>PacificLight Energy</p>")`

**Agent：** Your quote request has been recorded, and the Commercial Fixed 24 quote summary has been sent to <sunlin@udesk.cn>.

### 5.3 绿色电力商业报价 - Commercial Green 24

**用户：** We are looking for a greener electricity plan for our business.

**Toolcall：** `get_web_context(trigger="commercial_quote_green")`

**Agent：** Sure. I can estimate a Commercial Green 24 plan. May I have your company name and average monthly consumption?

**用户：** GreenBite Foods, around 8000 kWh per month, 24 months.

**Toolcall：** `calculate_quote(customer_type="commercial", plan="green24", average_consumption_kwh="8000", contract_duration_months="24", company_name="GreenBite Foods Pte Ltd")`

**工具返回要点：** Commercial Green 24，SGD 0.262/kWh，月均 8000 kWh，Estimated Monthly Total SGD 2343.17，Estimated Contract Total SGD 56236.08。

**Agent：** 保留工具返回的 Markdown 报价表，并说明最终价格以 PacificLight 销售团队确认为准。随后询问是否留下邮箱或电话。

**用户：** <sunlin@udesk.cn>.

**Toolcall：** `capture_lead(company_name="GreenBite Foods Pte Ltd", email="sunlin@udesk.cn", enquiry_type="commercial_quote_green")`

**Toolcall：** `send_email(subject="PacificLight Commercial Green 24 Quote Summary", email_content="<p>Dear Customer,</p><p>Here is your PacificLight commercial quote summary...</p><table>...</table><p>Best regards,<br><strong>PacificLight Customer Service</strong><br>PacificLight Energy</p>")`

**Agent：** Your quote request has been recorded, and the Commercial Green 24 quote summary has been sent to <sunlin@udesk.cn>.

***

## 7. Website - 商业账单 + 续约跟进

**目标：** 展示商业客户高用电量账单、CRM/续约、销售跟进。

**用户：** We want to check our company electricity bill and renewal options.

**Agent：** Please provide your commercial account number and postal code so I can retrieve the account information.

**用户：** C-PL-2001, 609999.

**Toolcall：** `query_bill(account_no="C-PL-2001", postal_code="609999", period="latest")`

**工具返回要点：** `FINAL_ANSWER`，ABC Manufacturing Pte Ltd，账期 2026-06，用电量 12000 kWh，应付总额 SGD 3288.86，到期日 2026-07-20，状态未支付。

**Agent：** 先输出 Markdown 账单。用户继续问续约时，再进入续约流程。

**用户：** The contract is also expiring soon. Please arrange renewal follow-up.

**Toolcall：** `handle_renewal(account_no="C-PL-2001", postal_code="609999", contract_duration_months="24")`

**Toolcall：** `create_case(title="Commercial renewal follow-up", account_no="C-PL-2001", case_type="renewal", priority="normal")`

**Agent：** Your renewal request has been recorded and submitted to the relevant team for follow-up.

***

## 8. Website - 注册中断转 WhatsApp

**目标：** 展示 Web engagement、注册中断、WhatsApp 跳转。

### 8.1 一轮直达触发

**用户：** 我刚才注册到一半，不知道怎么继续，可以发我 WhatsApp 链接吗？

**Toolcall：** `launch_whatsapp_link(trigger="signup_abandoned", language="zh")`

**Agent：** 直接输出 `FINAL_ANSWER` 后的 WhatsApp 链接和有效期。

### 8.2 两轮确认触发

**用户：** 我刚才注册到一半，不知道怎么继续。

**Toolcall：** `get_web_context(trigger="signup_abandoned", language="zh")`

**Agent：** 我可以协助您继续开户注册。您也可以切换到 WhatsApp 继续咨询，我可以为您生成继续咨询链接。需要我发送 WhatsApp 链接吗？

**用户：** 好，发我 WhatsApp 链接。

**Toolcall：** `launch_whatsapp_link(trigger="signup_abandoned", language="zh")`

**Agent：** 直接输出 `FINAL_ANSWER` 后的 WhatsApp 链接和有效期。

***

## 9. 转人工

**目标：** 展示固定指令转人工。

**用户：** 我要找人工客服。

**Agent：** 好的，正在为您转接专属顾问。#instruct\[human]




### 邮件正文完整字段示例

当用户要求把账单发到邮箱时，应优先调用 `send_bill_email(...)`，由工具生成标题和 HTML 正文。传参至少包含：

```text
send_bill_email(
  customer_name="Tan Mei Ling",

Here is your requested PacificLight electricity bill.

Customer Name / Company: Tan Mei Ling
Account No.: R-PL-1001
Billing Period: 2026-06-01 to 2026-06-30
Invoice No.: PL-R-202606-001
Bill Date: 2026-07-01
Due Date: 2026-07-15
Payment Status: Outstanding
Meter No.: MTR-884219
Previous Reading: 12,458 kWh
Current Reading: 12,910 kWh
Consumption: 452 kWh
Energy Charge: SGD 118.85
MSS Charge: SGD 2.90
Metering Charge: SGD 0.90
Carbon Tax: SGD 1.10
Subtotal: SGD 123.75
GST 9%: SGD 11.14
Late Payment Charge: SGD 0.00
Total Amount Due: SGD 134.89
PDF Link: https://espreview.s4.udesk.cn/onlinePreview?url=RDZDQUNBQ0VDRDg0OTE5MURGRDJENzkzQ0Q4QjkzRDVEMzkzQ0VDQkRDOTNDRENBREE5MENCREFEQkNERDVERENEOTBEREQxRDM5MUZBREZDQURGOTE4RjhCOTE4QURCOEY4RURCRERERjg4OTM4NjhEOEI4RTkzOEE4Qjg4REY5Mzg2OEU4NjhDOTNEQURBREE4RjhBOEU4ODg5OEREQkQ4OEQ5MUVFREZEREQ3RDhEN0RERjJEN0Q5RDZDQUUxRkJEMkRCRERDQUNDRDdEREQ3Q0FDN0UxRkNEN0QyRDJFMUVDOTNFRUYyOTM4RjhFOEU4RkUxOEM4RThDODg5MzhFODg5MENFREFEODgxREREMUQwQ0FEQkQwQ0E4Mw%3D%3D

Please make payment by 2026-07-15 to avoid late payment charges.

Regards,
PacificLight Customer Service
```

如果 Payment Status 为 Paid，最后一句应改为：

```text
This bill has been paid. No further payment is required.
```

***

## 10. Website - 新家庭客户固定价格计划 + 开户注册链接

**目标：** 展示注册中断挽回、Residential/New 识别、固定价格计划推荐、开户链接发送。新客户不需要身份验证。

**用户：** I’m not sure which electricity plan to choose for my flat.

**Agent：** No problem. Are you moving in soon, or switching from another retailer?

**用户：** Switching from another retailer.

**Toolcall：** `get_residential_fixed_plans(customer_scenario="switching from another retailer", dwelling_type="flat", switching_from_retailer="yes", language="en")`

**工具返回要点：** Residential Fixed 12、Residential Fixed 24、Residential Green 24；推荐 Residential Fixed 24；Markdown 表格。

**Agent：** 保留 Markdown 计划表，说明 Residential Fixed 24 适合切换零售商且希望月费稳定的家庭客户。

**用户：** Okay, send me the link by SMS.

**Toolcall：** `send_signup_link(channel="sms", plan="fixed24", customer_scenario="switching from another retailer", language="en")`

**Agent：** 直接输出 `FINAL_ANSWER` 后的开户注册链接，不继续调用工具。

### 中文版本

**用户：** 我刚才注册到一半，不确定应该选哪个家用电计划。

**Agent：** 没问题。您是准备搬新家，还是从其他电力零售商转过来？

**用户：** 从别的电力公司转过来，HDB 四房式。

**Toolcall：** `get_residential_fixed_plans(customer_scenario="从其他电力零售商切换", dwelling_type="HDB 四房式", switching_from_retailer="是", language="zh")`

**Agent：** 输出住宅固定价格计划表，并推荐 Residential Fixed 24。

**用户：** 好，发开户链接给我。

**Toolcall：** `send_signup_link(channel="chat", plan="fixed24", customer_scenario="从其他电力零售商切换", language="zh")`

**Agent：** 直接输出 `FINAL_ANSWER` 后的开户注册链接。

***

## 11. WhatsApp / Website - 老家庭客户搬家转移账户

**目标：** 展示现有客户身份验证、CRM/账户资料、搬家服务请求、ETC 提醒。

**用户：** Hi, I’m moving house next month. Can I transfer my electricity plan?

**Agent：** Yes, I can help check that. Please provide your account number and billing postal code for verification.

**用户：** R-PL-1001, 238888.

**Toolcall：** `verify_identity(account_no="R-PL-1001", postal_code="238888", language="en")`

**Agent：** 验证成功后询问新地址或新邮编、搬出日期、新地址开始供电日期。

**用户：** Move-out date is 20 July 2026. New start date should be 21 July 2026. New postal code is 460888.

**Toolcall：** `submit_account_update(account_no="R-PL-1001", update_type="move_house", new_value="New postal code 460888", effective_date="2026-07-21", notes="Move-out date 2026-07-20", language="en")`

**Agent：** 直接输出 `FINAL_ANSWER` 后的搬家服务请求结果，包含 Case ID 和 Early Termination Charges 提醒。

***

## 12. Website - 老客户修改联系电话 / 邮箱 / 账单接收方式

**目标：** 展示老客户资料变更能力。

**用户：** 我想改一下账户手机号。

**Agent：** 可以，请提供您的账户号和账单邮编，我先帮您完成身份验证。

**用户：** R-PL-1002，520201。

**Toolcall：** `verify_identity(account_no="R-PL-1002", postal_code="520201", language="zh")`

**Agent：** 验证成功后询问新的手机号。

**用户：** 新手机号是 +6588001122。

**Toolcall：** `submit_account_update(account_no="R-PL-1002", update_type="phone", new_value="+6588001122", language="zh")`

**Agent：** 直接输出 `FINAL_ANSWER` 后的变更提交结果。

***

## 13. Website - 老商业客户用电报告请求

**目标：** 展示现有商业客户验证、PDF/Excel 用电报告请求、账户登记邮箱发送、额外财务邮箱审批。

**用户：** Hi, can I get our electricity consumption report for Apr to Jun 2026?

**Agent：** Sure. Please provide your commercial account number and billing postal code for verification.

**用户：** C-PL-2001, 609999.

**Toolcall：** `verify_identity(account_no="C-PL-2001", postal_code="609999", language="en")`

**Agent：** Verified. Do you want the report as Excel, PDF, or both?

**用户：** Both, and send it to our finance team too: finance@abcmanufacturing.sg.

**Toolcall：** `create_consumption_report_request(account_no="C-PL-2001", period="2026-04 to 2026-06", report_format="both", send_to_registered_email=True, additional_recipient="finance@abcmanufacturing.sg", language="en")`

**Agent：** 直接输出 `FINAL_ANSWER` 后的报告请求结果，说明主要发送到账户登记账单邮箱 `sunlin@udesk.cn`，额外收件人需账户管理员审批。

***

# 当前推荐演示剧本 v2：自然多轮 + 邮件闭环

## A. Website - 新家庭客户固定价格计划 + 邮箱开户链接

**目标：** 展示开户注册中断挽回、自然问询、Residential/New 识别、计划推荐、开户注册邮件发送。新客户不需要身份验证。正式演示中不主动使用 SMS 或 WhatsApp。

**用户：** 你好，我刚才注册到一半，不确定应该选哪个家用电计划。

**Agent：** 您好，没问题，我可以帮您快速判断一下。请问这是家里用电的账户对吗？您是准备搬新家，还是从其他电力零售商转过来？

**用户：** 家用，从别的电力公司转过来。

**Agent：** 明白。您大概是什么住宅类型？例如 HDB、Condo，或者可以简单说几房式。

**用户：** HDB 四房式。

**Toolcall：** `get_residential_fixed_plans(customer_scenario="从其他电力零售商切换", dwelling_type="HDB 四房式", switching_from_retailer="是", language="zh")`

**Agent：** 输出住宅固定价格计划 Markdown 表格，并推荐 `Residential Fixed 24`。随后自然确认：

> 按您的情况，Residential Fixed 24 会比较适合，因为它可以锁定 24 个月固定价格，月度费用更容易预估。需要我把开户链接和计划说明发送到您的联系邮箱 `sunlin@udesk.cn` 吗？

**用户：** 好，发邮箱。

**Toolcall：** `prepare_signup_email(plan="fixed24", recipient_email="sunlin@udesk.cn", customer_scenario="从其他电力零售商切换", dwelling_type="HDB 四房式", language="zh")`

**Toolcall：** `send_email(subject="PacificLight Residential Fixed 24 开户注册链接", email_content="<HTML from prepare_signup_email>")`

**Agent：** 已发送至 `sunlin@udesk.cn`。邮件中包含 Residential Fixed 24 的推荐说明、参考电价和开户链接，您可以稍后通过邮件继续完成开户注册。

### English Version

**User:** Hi, I paused halfway through the sign-up and I’m not sure which home electricity plan to choose.

**Agent:** Hi, no problem — I can help you narrow it down. Is this for a home electricity account? Are you moving in soon, or switching from another retailer?

**User:** Switching from another retailer. It’s for an HDB 4-room flat.

**Toolcall：** `get_residential_fixed_plans(customer_scenario="switching from another retailer", dwelling_type="HDB 4-room flat", switching_from_retailer="yes", language="en")`

**Agent:** 输出英文计划表并推荐 `Residential Fixed 24`，然后询问是否发送到 `sunlin@udesk.cn`。

**User:** Yes, please email it to me.

**Toolcall：** `prepare_signup_email(plan="fixed24", recipient_email="sunlin@udesk.cn", customer_scenario="switching from another retailer", dwelling_type="HDB 4-room flat", language="en")`

**Toolcall：** `send_email(subject="PacificLight Residential Fixed 24 Sign-up Link", email_content="<HTML from prepare_signup_email>")`

**Agent:** I’ve sent it to `sunlin@udesk.cn`. The email includes the Residential Fixed 24 recommendation, indicative rate and sign-up link so you can continue the application later.

***

## B. Website - 老商业客户用电报告 PDF + 邮件发送

**目标：** 展示商业老客验证、报告周期/格式问询、用电报告请求、PDF 链接、发送到账户登记邮箱、额外财务邮箱审批。

**User:** Hi, can I get our electricity consumption report for last quarter? We need it for finance and ESG reporting.

**Agent:** Sure, I can help with that. May I have your commercial account number and billing postal code for verification?

**User:** C-PL-2001, 609999.

**Toolcall：** `verify_identity(account_no="C-PL-2001", postal_code="609999", language="en")`

**Agent:** Verified. Which period do you need? For example, Apr to Jun 2026. And would you like the report as PDF, Excel, or both?

**User:** Apr to Jun 2026, both PDF and Excel.

**Toolcall：** `create_consumption_report_request(account_no="C-PL-2001", period="2026-04 to 2026-06", report_format="both", send_to_registered_email=True, additional_recipient="", language="en")`

**Agent:** 简要说明报告请求已创建，并继续确认邮件：

> I can send the report summary and PDF link to the registered billing email `sunlin@udesk.cn`. Shall I send it now?

**User:** Yes, send it.

**Toolcall：** `prepare_consumption_report_email(account_no="C-PL-2001", period="2026-04 to 2026-06", report_format="both", language="en")`

**Toolcall：** `send_email(subject="PacificLight Consumption Report C-PL-2001 - 2026-04 to 2026-06", email_content="<HTML from prepare_consumption_report_email>")`

**Agent:** The report request has been created, and the report summary with the PDF link has been sent to the registered billing email `sunlin@udesk.cn`.

**User:** Can you also send it to our finance team at finance@abcmanufacturing.sg?

**Toolcall：** `create_consumption_report_request(account_no="C-PL-2001", period="2026-04 to 2026-06", report_format="both", send_to_registered_email=True, additional_recipient="finance@abcmanufacturing.sg", language="en")`

**Agent:** I’ve submitted the additional recipient approval request. The report will only be sent to `finance@abcmanufacturing.sg` after account administrator approval.

