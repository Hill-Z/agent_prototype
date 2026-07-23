# PacificLight Website Agent 真实客服对话剧本（15+轮版）

> 说明：本文件是新增剧本，旧版 `conversation-scenarios-bilingual.md` 保留不动。  
> 使用方式：客户不需要逐字照读，可按相近意图自然表达；验收重点是 Agent 是否按 SOP 补齐信息、调用对应能力、结构化展示结果，并按客户语言回复。

---

## 场景 1：新家庭客户开户注册 / 固定价格计划 / 发送开户链接（中文）

| 轮次 | 角色 | 对话 |
|---:|---|---|
| 1 | 客户 | 你好，我刚搬到新加坡，想了解 PacificLight 的家用电计划。 |
| 1 | Agent | 您好，欢迎了解 PacificLight。我先帮您看适合的住宅计划。请问您是新搬入首次开户，还是从其他电力零售商切换过来呢？ |
| 2 | 客户 | 我是刚搬进来，还没正式注册。 |
| 2 | Agent | 好的。为了推荐更合适的计划，我再确认一下：<br>1. 您的住宅类型是 HDB、公寓还是有地住宅？<br>2. 您更看重价格稳定、短合约，还是绿色电力？ |
| 3 | 客户 | HDB 四房式，主要想电费稳定一点。 |
| 3 | Agent | 明白，HDB 四房式且希望电费更稳定的话，通常会优先看较长期固定价格计划。我先为您整理几个可选计划。 |
| 4 | Agent | ## 住宅固定价格计划参考<br><br>| 计划 | 合同期 | 参考电价 | 适合客户 |<br>|---|---:|---:|---|<br>| Residential Fixed 12 | 12 个月 | SGD 0.279/kWh | 希望先短期锁价的家庭客户 |<br>| Residential Fixed 24 | 24 个月 | SGD 0.272/kWh | 希望月度费用更可预测、愿意较长期锁价的家庭客户 |<br>| Residential Green 24 | 24 个月 | SGD 0.289/kWh | 关注绿色电力属性的家庭客户 |<br><br>按您目前的情况，我会优先推荐 **Residential Fixed 24**，价格稳定性更好，单位电价也更低。 |
| 5 | 客户 | 12个月和24个月主要区别是什么？ |
| 5 | Agent | 简单说，12 个月更灵活，适合先试用；24 个月锁价时间更长，月度电费更容易预估。您已经明确想要稳定一点，所以 24 个月会更贴合。 |
| 6 | 客户 | 如果我之后搬家怎么办？ |
| 6 | Agent | 如果后续搬家，一般可以提交搬家/账户转移申请，PacificLight 会根据新地址供电情况和原合约条款确认是否可转移；如果提前终止当前合约，可能需要再确认是否有 Early Termination Charges。 |
| 7 | 客户 | 那开户注册需要准备什么？ |
| 7 | Agent | 通常需要您在开户链接里填写住址、身份和联系方式等资料，最终以线上注册页确认的信息为准。我可以把开户链接和计划说明发到您的邮箱。 |
| 8 | 客户 | 能直接在这里给我链接吗？ |
| 8 | Agent | 可以的。我会提供开户链接，同时建议您也留一个邮箱，方便保存计划说明和后续继续注册。 |
| 9 | 客户 | 邮箱是 sunlin@udesk.cn。 |
| 9 | Agent | 好的，我来为您整理开户链接和 Residential Fixed 24 的说明，并发送到这个邮箱。 |
| 10 | Agent | 已发送，请留意邮箱 `sunlin@udesk.cn` 查收。邮件里包含开户链接、推荐计划和注册注意事项。 |
| 11 | 客户 | 邮件里会有价格吗？ |
| 11 | Agent | 会的，邮件里会包含当前参考电价、合约期和适合人群说明。最终可选计划、资格和价格以线上注册页确认为准。 |
| 12 | 客户 | 这个价格含 GST 吗？ |
| 12 | Agent | 当前展示的是参考电价，账单最终金额会根据实际用电量、适用费用和 GST 计算。注册页和后续账单会展示更完整的费用信息。 |
| 13 | 客户 | 我还没确定入住日期，可以先注册吗？ |
| 13 | Agent | 可以先查看并开始填写，但建议在注册时填写预计开始供电日期，这样系统能更准确处理开户安排。 |
| 14 | 客户 | 如果注册链接打不开怎么办？ |
| 14 | Agent | 如果链接打不开，您可以稍后重试，或把遇到的问题告诉我。我也可以帮您转接专属顾问继续处理。 |
| 15 | 客户 | 好的，我先看看邮件。 |
| 15 | Agent | 好的，您先查看邮件。如果后面不确定选哪个计划，直接回来告诉我住宅类型和偏好，我可以继续帮您对比。 |
| 16 | 客户 | 谢谢。 |
| 16 | Agent | 不客气，很高兴帮到您。 |

---

## 场景 2：Existing Residential Customer Move-house / Address Change / Ticket Creation（English）

| Round | Speaker | Dialogue |
|---:|---|---|
| 1 | Customer | Hi, I’m moving house and need to transfer my electricity account. |
| 1 | Agent | Sure, I can help with that. I’ll first verify your account before submitting the move-house request. Please provide your account number and billing postal code. |
| 2 | Customer | R-PL-1001, 238888. |
| 2 | Agent | Thanks, your account has been verified. To submit the move-house request, please share:<br>1. New address or new postal code<br>2. Move-out date from your current address<br>3. Electricity supply start date at the new address |
| 3 | Customer | I’ll move out on 25 July 2026 and need supply at the new place from 26 July 2026. |
| 3 | Agent | Got it, I have the dates. Could you also provide the new address or new postal code? I’ll need that before submitting the request. |
| 4 | Customer | The new postal code is 530123. |
| 4 | Agent | Thank you. I’ll submit the move-house request for account R-PL-1001 with the new postal code 530123 and the requested dates. |
| 5 | Agent | ## Move-house Service Ticket Created<br><br>| Item | Details |<br>|---|---|<br>| Ticket ID | 18469570 / generated ticket ID |<br>| Account No. | R-PL-1001 |<br>| Current Plan | Residential Saver 24 |<br>| Current Service Address | Orchard Road, Singapore 238888 |<br>| New Address / Postal Code | 530123 |<br>| Move-out / New Supply Date | 25 July 2026 / 26 July 2026 |<br>| Status | Submitted |<br><br>The Care Team will check the new supply address and review your contract terms. If the current contract ends early, Early Termination Charges may apply. |
| 6 | Customer | Does that mean my old address will stop automatically? |
| 6 | Agent | The request has been submitted for review. The Care Team will confirm the stop date for your current address and the start date for the new address before final processing. |
| 7 | Customer | Will I lose my current plan? |
| 7 | Agent | Not necessarily. The team will review whether your existing plan can be transferred to the new address. It depends on supply availability and your current contract terms. |
| 8 | Customer | I’m worried about early termination charges. |
| 8 | Agent | That’s understandable. Early Termination Charges may apply if the current contract is ended before the agreed contract end date, but the Care Team will confirm this based on your account terms. |
| 9 | Customer | Can someone email me the confirmation? |
| 9 | Agent | Yes, the follow-up will be sent to your registered email after the request is reviewed. |
| 10 | Customer | Can I change the start date later? |
| 10 | Agent | If the request has not been finalized yet, you can usually request an update. Please contact us as early as possible if the date changes. |
| 11 | Customer | What if the new address cannot be supplied? |
| 11 | Agent | If supply is not available at the new address, the Care Team will advise the next available option or follow-up arrangement. |
| 12 | Customer | Do I need to submit documents now? |
| 12 | Agent | Not at this step. If documents are required, the Care Team will let you know during follow-up. |
| 13 | Customer | Okay, please keep this request under my account. |
| 13 | Agent | Sure, the request is already linked to account R-PL-1001. |
| 14 | Customer | How long will the review take? |
| 14 | Agent | You’ll receive a confirmation after review. The exact timing depends on supply checks and contract review. |
| 15 | Customer | Alright, thanks. |
| 15 | Agent | You’re welcome. I’ve submitted the move-house request and the team will follow up with the confirmation. |
| 16 | Customer | That’s all for now. |
| 16 | Agent | Happy to help. Have a good day. |

---

## 场景 3：新商业客户报价 / 展示参考报价 / 邮件摘要 / 销售跟进（中文）

| 轮次 | 角色 | 对话 |
|---:|---|---|
| 1 | 客户 | 你好，我们准备开一家 bakery，想了解商业电价。 |
| 1 | Agent | 您好，很高兴为您提供商业用电报价参考。为了估算更贴近实际，我先确认一下店铺或公司名称，以及预计月用电量大概是多少？ |
| 2 | 客户 | 公司叫 Sunrise Bakery Pte Ltd。用电量还不太确定，可能每月 8000 kWh 左右。 |
| 2 | Agent | 好的，我先按每月 8000 kWh 为您估算。请问您偏好的合约期是 12 个月还是 24 个月？预计什么时候开始供电？ |
| 3 | 客户 | 想看 24 个月，预计 2026 年 9 月 1 日开始。 |
| 3 | Agent | 明白。我会按 Sunrise Bakery Pte Ltd、每月 8000 kWh、24 个月合约、2026-09-01 开始供电来估算参考报价。 |
| 4 | Agent | ## 商业用电参考报价<br><br>| 项目 | 内容 |<br>|---|---|<br>| 公司 | Sunrise Bakery Pte Ltd |<br>| 业务类型 | Bakery / food service |<br>| 参考计划 | Commercial Fixed 24 |<br>| 合同期 | 24 个月 |<br>| 月均用电量 | 8,000 kWh |<br>| 参考电价 | SGD 0.245/kWh |<br>| 预计开始供电日期 | 2026-09-01 |<br><br>### 预估月度费用<br><br>| 项目 | 金额 |<br>|---|---:|<br>| Energy Charge | SGD 1,960.00 |<br>| MSS Charge | SGD 28.00 |<br>| Metering Charge | SGD 6.50 |<br>| Carbon Tax | SGD 19.20 |<br>| GST 9% | SGD 181.23 |<br>| **预估月度总额** | **SGD 2,194.93** |<br><br>这是非绑定参考报价，最终价格和合约条款需由 PacificLight 销售团队确认。 |
| 5 | 客户 | 如果实际用量不是 8000 kWh，价格会变吗？ |
| 5 | Agent | 费用会按实际用电量结算；如果合同里确认的是固定单价，单价本身在合约期内通常保持不变，但总账单会随实际用量变化。 |
| 6 | 客户 | 这个报价能发我邮箱吗？ |
| 6 | Agent | 可以的，请提供接收报价摘要的邮箱。 |
| 7 | 客户 | 发到 sunlin@udesk.cn。 |
| 7 | Agent | 好的，我会把商业用电参考报价摘要发送到 `sunlin@udesk.cn`。 |
| 8 | Agent | 已发送，请留意邮箱查收。邮件里包含公司信息、参考计划、月均用电量、预计开始日期和非绑定报价说明。 |
| 9 | 客户 | 邮件里是正式合同吗？ |
| 9 | Agent | 不是正式合同，是参考报价摘要。正式报价、合同条款和适用资格需要销售团队进一步确认。 |
| 10 | 客户 | 那能不能安排销售联系我？ |
| 10 | Agent | 可以的。请提供联系人姓名，以及邮箱或电话，我为您提交销售跟进请求。 |
| 11 | 客户 | 联系人是 Daniel，电话 +65 9123 4567。 |
| 11 | Agent | 好的，我来提交销售跟进请求，说明您希望确认 Sunrise Bakery 的 24 个月商业固定电价方案。 |
| 12 | Agent | ## 商业用电报价跟进请求已提交<br><br>| 项目 | 内容 |<br>|---|---|<br>| 请求事项 | Sunrise Bakery Pte Ltd 商业用电报价跟进 |<br>| 联系人 | Daniel |<br>| 电话 | +65 9123 4567 |<br>| 参考用电量 | 8,000 kWh/月 |<br>| 合同期 | 24 个月 |<br>| 状态 | 已提交 |<br><br>PacificLight 销售顾问会根据您提供的信息进一步确认正式报价。 |
| 13 | 客户 | 如果我之后想改成 12 个月可以吗？ |
| 13 | Agent | 可以，销售团队确认正式报价前可以一起比较 12 个月和 24 个月方案。12 个月更灵活，24 个月价格稳定性通常更好。 |
| 14 | 客户 | 绿色电力有商业方案吗？ |
| 14 | Agent | 有相关绿色电力属性方案可咨询，但具体适用价格和条款需要销售团队根据您的用电情况确认。 |
| 15 | 客户 | 好的，那先让销售联系我。 |
| 15 | Agent | 好的，跟进请求已提交。销售顾问会按您提供的联系方式联系您。 |
| 16 | 客户 | 谢谢。 |
| 16 | Agent | 不客气，祝您的 bakery 开业顺利。 |

---

## Scenario 4: Existing Commercial Customer Consumption Report / PDF Link / Registered Email / Additional Recipient Ticket（English）

| Round | Speaker | Dialogue |
|---:|---|---|
| 1 | Customer | Hi, finance needs our electricity consumption report for Apr to Jun 2026. |
| 1 | Agent | Sure, I can help with that. Please provide your account number and billing postal code for verification. |
| 2 | Customer | C-PL-2001, 609999. |
| 2 | Agent | Thank you, your account has been verified. For the report, would you like PDF, Excel, or both formats? |
| 3 | Customer | PDF please. |
| 3 | Agent | Got it. I’ll prepare the Apr to Jun 2026 consumption report request in PDF format. |
| 4 | Agent | ## Consumption Report Request Created<br><br>| Item | Details |<br>|---|---|<br>| Case ID | PL-REPORT-A10BA662 |<br>| Account No. | C-PL-2001 |<br>| Company | ABC Manufacturing Pte Ltd |<br>| Report Period | 2026-04 to 2026-06 |<br>| Report Format | PDF |<br>| Primary Delivery | Registered billing email sunlin@udesk.cn |<br>| Status | Submitted |<br><br>### Report Link<br>[Click here to view the consumption report](https://espreview.s4.udesk.cn/onlinePreview?url=RDZDQUNBQ0VDRDg0OTE5MURGRDJENzkzQ0Q4QjkzRDVEMzkzQ0VDQkRDOTNDRENBREE5MENCREFEQkNERDVERENEOTBEREQxRDM5MUZBREZDQURGOTE4RjhCOTE4QkRGREY4RkQ4OEQ4Q0RCOTNEOERCODY4OTkzOEE4Qjg4OEY5M0RGOEM4Njg2OTNEOEQ4REI4QThCREI4OThDREM4N0Q4REY5MUVFREZEREQ3RDhEN0RERjJEN0Q5RDZDQUUxRkREMUQwQ0RDQkQzQ0VDQUQ3RDFEMEUxRUNEQkNFRDFDQ0NBRTFGRDkzRUVGMjkzOEM4RThFOEZFMThDOEU4Qzg4OTNFRjhDOTBDRURBRDg4MURERDFEMENBODM%3D)<br><br>Would you like me to email the report summary and PDF link to the registered billing email `sunlin@udesk.cn` as well? |
| 5 | Customer | Yes, please send it to that email. |
| 5 | Agent | Sure, I’ll send the report summary and PDF link to the registered billing email. |
| 6 | Agent | Sent successfully. Please check `sunlin@udesk.cn` for the consumption report email. |
| 7 | Customer | Does the report include monthly usage? |
| 7 | Agent | Yes, it includes the monthly consumption breakdown for Apr, May and Jun 2026, plus total and average consumption for the period. |
| 8 | Customer | Can you summarize the total usage here? |
| 8 | Agent | For Apr to Jun 2026, the total consumption is **35,990 kWh**, with an average monthly consumption of **11,997 kWh**. |
| 9 | Customer | Is this good for ESG reporting? |
| 9 | Agent | It can support internal usage review and ESG-related preparation, but your ESG reporting team should confirm the exact reporting format and methodology they need. |
| 10 | Customer | Can you also send it to finance@abcmanufacturing.sg? |
| 10 | Agent | For account security, I can’t send the report directly to another email. I can submit an Additional Recipient Ticket for `finance@abcmanufacturing.sg` first. |
| 11 | Customer | Yes, submit it. |
| 11 | Agent | ## Additional Recipient Ticket Submitted<br><br>| Item | Details |<br>|---|---|<br>| Account No. | C-PL-2001 |<br>| Requested Recipient | finance@abcmanufacturing.sg |<br>| Status | Submitted for additional recipient review |<br><br>Once the additional recipient request is approved, the report can be sent to the additional recipient. |
| 12 | Customer | Who approves it? |
| 12 | Agent | The request will be reviewed through the additional recipient process before reports are sent to the additional email. |
| 13 | Customer | Can I get Excel too later? |
| 13 | Agent | Yes. If you need Excel later, you can request the same report period again and choose Excel or both formats. |
| 14 | Customer | Can you send the PDF link in chat again? |
| 14 | Agent | Of course: [Click here to view the consumption report](https://espreview.s4.udesk.cn/onlinePreview?url=RDZDQUNBQ0VDRDg0OTE5MURGRDJENzkzQ0Q4QjkzRDVEMzkzQ0VDQkRDOTNDRENBREE5MENCREFEQkNERDVERENEOTBEREQxRDM5MUZBREZDQURGOTE4RjhCOTE4QkRGREY4RkQ4OEQ4Q0RCOTNEOERCODY4OTkzOEE4Qjg4OEY5M0RGOEM4Njg2OTNEOEQ4REI4QThCREI4OThDREM4N0Q4REY5MUVFREZEREQ3RDhEN0RERjJEN0Q5RDZDQUUxRkREMUQwQ0RDQkQzQ0VDQUQ3RDFEMEUxRUNEQkNFRDFDQ0NBRTFGRDkzRUVGMjkzOEM4RThFOEZFMThDOEU4Qzg4OTNFRjhDOTBDRURBRDg4MURERDFEMENBODM%3D) |
| 15 | Customer | Thanks, that works. |
| 15 | Agent | You’re welcome. The PDF report has been created and the email has been sent to the registered billing email. |
| 16 | Customer | That’s all. |
| 16 | Agent | Happy to help. Have a good day. |

---

## 场景 5：个人账单 / 发票 / PDF / 发送到账户邮箱（中文）

| 轮次 | 角色 | 对话 |
|---:|---|---|
| 1 | 客户 | 我想查一下我的电费账单。 |
| 1 | Agent | 可以的，我来帮您查询。请提供您的账户号和账单邮编。 |
| 2 | 客户 | R-PL-1001，238888。 |
| 2 | Agent | 好的，我来查询您的最新电费账单。 |
| 3 | Agent | ## 电费账单<br><br>| 项目 | 内容 |<br>|---|---|<br>| 客户 | Tan Mei Ling |<br>| 账户号 | R-PL-1001 |<br>| 账期 | 2026-06-01 至 2026-06-30 |<br>| 发票号 | PL-R-202606-001 |<br>| 出账日期 | 2026-07-01 |<br>| 到期日 | 2026-07-15 |<br>| 付款状态 | 未支付 |<br>| 用电量 | 452 kWh |<br>| 应付总额 | **SGD 134.89** |<br><br>请在 2026-07-15 前完成付款，以避免产生滞纳金。 |
| 4 | 客户 | 这个金额怎么来的？ |
| 4 | Agent | 主要由 Energy Charge、MSS Charge、Metering Charge、Carbon Tax、GST 等项目组成。我可以继续展示明细。 |
| 5 | 客户 | 展示一下。 |
| 5 | Agent | ## 费用明细<br><br>| 项目 | 金额 |<br>|---|---:|<br>| Energy Charge | SGD 118.85 |<br>| MSS Charge | SGD 2.90 |<br>| Metering Charge | SGD 0.90 |<br>| Carbon Tax | SGD 1.10 |<br>| Subtotal | SGD 123.75 |<br>| GST 9% | SGD 11.14 |<br>| Late Payment Charge | SGD 0.00 |<br>| **Total Amount Due** | **SGD 134.89** | |
| 6 | 客户 | 有没有 PDF？ |
| 6 | Agent | 有的，您可以点击这里查看 PDF 账单：[点击此处查看 PDF 文档](https://espreview.s4.udesk.cn/onlinePreview?url=RDZDQUNBQ0VDRDg0OTE5MURGRDJENzkzQ0Q4QjkzRDVEMzkzQ0VDQkRDOTNDRENBREE5MENCREFEQkNERDVERENEOTBEREQxRDM5MUZBREZDQURGOTE4RjhCOTE4QjhGOEJERDhEOEM4OEQ4OTM4OTg4REQ4RjkzOEE4OUQ4ODk5M0RDRENEODg5OTM4RDhDREY4RkRBREY4RDhEOEI4RURBOEQ5MUVFREZEREQ3RDhEN0RERjJEN0Q5RDZDQUUxRkJEMkRCRERDQUNDRDdEREQ3Q0FDN0UxRkNEN0QyRDJFMUVDOTNFRUYyOTM4RjhFOEU4RkUxOEM4RThDODg5MzhFODg5MENFREFEODgxREREMUQwQ0FEQkQwQ0E4Mw%3D%3D) |
| 7 | 客户 | 可以发到我的邮箱吗？ |
| 7 | Agent | 可以的，账单会发送到账户登记邮箱 `sunlin@udesk.cn`。我来为您发送。 |
| 8 | Agent | 已发送，请留意账户登记邮箱 `sunlin@udesk.cn` 查收。 |
| 9 | 客户 | 邮件里有 PDF 链接吗？ |
| 9 | Agent | 有的，邮件正文会包含账单明细和可点击的 PDF 文档链接。 |
| 10 | 客户 | 我能发到别的邮箱吗？ |
| 10 | Agent | 为了账户资料安全，账单默认发送到账户登记邮箱。如果您需要变更登记邮箱，我可以为您转接专属顾问协助处理；如果只是重新发送到登记邮箱，我可以继续帮您发送。 |
| 11 | 客户 | 那还是发登记邮箱就行。 |
| 11 | Agent | 好的，账单已发送到账户登记邮箱 `sunlin@udesk.cn`，请留意查收。 |
| 12 | 客户 | 我现在付款，有哪些方式？ |
| 12 | Agent | 您通常可以通过 GIRO 自动扣款、AXS、PayNow、网上银行 Bill Payment 或 PacificLight 客户门户完成付款。 |
| 13 | 客户 | 如果我已经付款了呢？ |
| 13 | Agent | 如果您刚完成付款，系统入账可能需要一点处理时间。您可以稍后再查询付款状态；如果状态仍异常，我可以帮您转人工核查。 |
| 14 | 客户 | 这张账单是 6 月的吗？ |
| 14 | Agent | 是的，这张账单对应 2026-06-01 至 2026-06-30 的用电周期。 |
| 15 | 客户 | 好的，谢谢。 |
| 15 | Agent | 不客气，账单和 PDF 链接已经发送到登记邮箱。 |
| 16 | 客户 | 没问题了。 |
| 16 | Agent | 好的，如后续还需要查询账单或发票，随时告诉我。 |
