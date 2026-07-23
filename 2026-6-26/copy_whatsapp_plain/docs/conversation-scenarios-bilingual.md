# PacificLight Website Agent 对话与期望回答（中英版）

## 场景 1：新家庭客户开户注册 / 住宅固定价格计划

### 中文

| 客户对话                                     | 期望回答                                                                                                                                                                         |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 你好，我刚才注册 PacificLight 到一半，不知道应该选哪个家用电计划。 | 您好，没问题，我可以帮您快速判断一下。请问这是家里用电的账户对吗？您是准备搬新家，还是从其他电力零售商转过来？                                                                                                                      |
| 是家用账户，从别的电力公司转过来。                        | 了解了。为了推荐更合适的计划，请问您的住宅类型是 HDB、Condo 还是 landed？如果是 HDB，也可以告诉我是几房式。                                                                                                             |
| HDB 四房式，主要想电费稳定一点。                       | 好的，HDB 四房式并且希望电费稳定，通常可以优先看固定价格计划。我帮您整理一下可选计划。                                                                                                                                |
| 好的。                                      | 应以 Markdown 表格展示住宅固定价格计划，包括 Residential Fixed 12、Residential Fixed 24、Residential Green 24，并推荐 Residential Fixed 24，说明适合 HDB 或从其他零售商切换、希望月度费用稳定的家庭客户。结尾询问是否需要发送开户链接和计划说明到邮箱。 |
| 12 个月和 24 个月主要区别是什么？                     | 12 个月相对灵活，适合不想锁定太久的客户；24 个月价格稳定性更强，适合希望较长时间内电费更可预估的客户。按您当前情况，Residential Fixed 24 会更匹配。                                                                                      |
| 这个价格是最终价格吗？                              | 这是参考电价，最终计划详情、价格和适用资格会以在线开户注册页面确认为准。                                                                                                                                         |
| 可以，把开户链接发我邮箱吧。                           | 可以的，请问您希望发送到哪个邮箱？                                                                                                                                                            |
| <sunlin@udesk.cn>。                       | 应生成开户注册邮件并发送。回复：好的，开户链接和推荐计划已发送到 <sunlin@udesk.cn>，请留意邮箱查收。邮件中包含 Residential Fixed 24 的推荐说明、参考电价和开户链接。                                                                       |

### English

| Customer Dialogue                                                                                       | Expected Response                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hi, I stopped halfway through PacificLight sign-up. I’m not sure which home electricity plan to choose. | Hi, no problem — I can help you narrow it down. Is this for a home electricity account? Are you moving in soon, or switching from another electricity retailer?                                                                                                                                                             |
| It’s for my home, and I’m switching from another retailer.                                              | Thanks for confirming. May I know your home type — HDB, Condo, or landed? If it is HDB, the flat type would help as well.                                                                                                                                                                                                   |
| HDB 4-room flat. I mainly want stable bills.                                                            | Got it. For a HDB 4-room flat and a customer switching from another retailer, a fixed-price plan is usually a good starting point. I’ll summarise the available plans for you.                                                                                                                                              |
| Sure.                                                                                                   | The agent should show a Markdown table with Residential Fixed 12, Residential Fixed 24 and Residential Green 24, recommend Residential Fixed 24, and explain that it suits HDB flats or customers switching retailers who want predictable monthly costs. End by asking whether to email the sign-up link and plan details. |
| What’s the main difference between 12 months and 24 months?                                             | The 12-month option is more flexible if you prefer a shorter commitment. The 24-month option gives longer price certainty and is usually better if you want your monthly electricity costs to be more predictable. Based on your situation, Residential Fixed 24 looks more suitable.                                       |
| Is that the final price?                                                                                | It is an indicative rate. Final plan details, pricing and eligibility will be confirmed during the online sign-up process.                                                                                                                                                                                                  |
| Please email me the sign-up link.                                                                       | Sure. Which email address should I send it to?                                                                                                                                                                                                                                                                              |
| <sunlin@udesk.cn>.                                                                                      | The agent should prepare and send the sign-up email. Reply: Done — I’ve sent the sign-up link and plan recommendation to <sunlin@udesk.cn>. Please check your inbox. The email includes the Residential Fixed 24 recommendation, indicative rate and sign-up link.                                                          |

***

## 场景 2：老家庭客户搬家 / 账户转移

### 中文

| 客户对话                                   | 期望回答                                                                      |
| -------------------------------------- | ------------------------------------------------------------------------- |
| 你好，我下个月搬家，现在的 PacificLight 账户还能转到新地址吗？ | 可以的，我先帮您核验账户信息。请提供您的账户号和账单邮编。                                             |
| R-PL-1001，238888。                      | 应完成身份验证。回复：谢谢，身份验证已通过。我可以继续帮您提交搬家 / 账户转移请求。请问您预计什么时候搬出旧地址？新地址希望从哪一天开始供电？  |
| 旧地址 7 月 25 日搬出，新地址 7 月 26 日开始。         | 收到。还需要您提供新地址或新地址邮编，我会一并记录到请求里。                                            |
| 新地址邮编是 460888。                         | 好的，我已记录搬出日期、新地址开始供电日期和新邮编。搬家转移需要 Care Team 确认新地址供电情况和现有合约安排。              |
| 会不会有提前终止费？                             | 如果当前合约提前结束，可能会涉及 Early Termination Charges，最终是否产生费用需要 Care Team 根据合约条款确认。 |
| 那你帮我提交吧。                               | 应创建搬家服务请求，并以 Markdown 卡片展示请求编号、账户号、当前套餐、当前服务地址、新地址/邮编、期望生效日期和状态。          |
| 这个是不是马上就生效？                            | 不是即时生效。Care Team 会继续确认新地址供电和合约条款，如需补充信息会联系您。                              |
| 好的。                                    | 客服式收尾：好的，您的搬家服务请求已提交。后续团队会按您提供的日期继续处理，请留意联系方式。                            |

### English

| Customer Dialogue                                                                     | Expected Response                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hi, I’m moving next month. Can I transfer my PacificLight account to the new address? | Sure, I can help with that. Please provide your account number and billing postal code for verification.                                                                                                                                                         |
| R-PL-1001, 238888.                                                                    | The agent should complete verification. Reply: Thank you, verification is complete. I can help submit a move-house / account transfer request. When will you move out from the current address, and when would you like electricity to start at the new address? |
| Move out on 25 July 2026, start at the new place on 26 July 2026.                     | Thanks. May I have the new service address or new postal code as well?                                                                                                                                                                                           |
| New postal code is 460888.                                                            | Got it. I’ve noted the move-out date, new supply start date and new postal code. The Care Team will need to check the new supply address and your existing contract arrangement.                                                                                 |
| Will there be early termination charges?                                              | If the current contract ends early, Early Termination Charges may apply. The final confirmation will be made by the Care Team after checking your contract terms.                                                                                                |
| Please submit the request.                                                            | The agent should create the move-house request and show a Markdown card with case reference, account number, current plan, current service address, new address/postal code, preferred effective date and status.                                                |
| Will it take effect immediately?                                                      | Not immediately. The Care Team will review the new supply address and contract terms, and contact you if any additional information is needed.                                                                                                                   |
| Okay.                                                                                 | Natural closing: Your move-house service request has been submitted. The team will proceed based on the dates you provided. Please keep an eye on your contact channels.                                                                                         |

***

## 场景 3：新商业客户商业用电报价

### 中文

| 客户对话                                    | 期望回答                                                                                                  |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 你好，我们准备开一家 bakery，想了解商业电价。              | 您好，很高兴为您介绍。为了给您一个更贴近情况的参考报价，请问您是新商业客户吗？大概每月用电量是多少？如果不确定，也可以先给一个估算值。                                   |
| 是新客户，预计每月 8000 kWh 左右，但不太确定。            | 没关系，可以先按 8000 kWh 做参考估算。请问公司或店名是什么？您倾向 12 个月还是 24 个月合约？预计什么时候开始用电？                                    |
| Sunrise Bakery Pte Ltd，24 个月，9 月 1 日开始。 | 好的，我先根据公司名称、预计用电量、合约期和开始日期，为您生成一份商业用电参考报价。                                                            |
| 好。                                      | 应以 Markdown 展示商业用电参考报价，包括公司、业务类型、月均用电量、推荐计划、参考电价、月度费用估算、预估合约金额，并说明是非绑定参考报价。结尾询问是否需要发送报价摘要或安排销售顾问跟进。   |
| 如果实际用电量和 8000 kWh 不一样，价格会变吗？            | 用电量会影响预估月度费用；正式价格、合同条款和适用条件需要 PacificLight 销售团队根据实际资料确认。当前报价适合作为预算参考。                                 |
| 24 个月是不是比较划算？                           | 24 个月通常更适合希望锁定较长价格周期、让预算更稳定的客户；如果您更重视灵活性，也可以考虑较短合约。                                                   |
| 可以让销售联系我吗？                              | 当然可以。请问方便留下联系人姓名、邮箱或电话吗？                                                                              |
| David，<sunlin@udesk.cn>，91234567。       | 应创建商业报价销售跟进请求。回复：好的，我已经帮您提交商业用电报价跟进请求。销售顾问会根据您提供的用电量、合约期和开始日期进一步确认正式报价，并通过 <sunlin@udesk.cn> 或电话与您联系。 |

### English

| Customer Dialogue                                                      | Expected Response                                                                                                                                                                                                                                                                                                                    |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Hi, we would like to understand commercial electricity pricing.        | Hi, I’d be happy to help. To provide a more relevant indicative quote, may I confirm if you are a new commercial customer, and what your estimated monthly electricity usage is? If you are not sure, an estimate is fine.                                                                                                           |
| Yes, new customer. Around 8,000 kWh per month, but I’m not very sure.  | That’s fine — we can use 8,000 kWh as a reference estimate first. What is the company or shop name? Do you prefer a 12-month or 24-month contract, and when do you expect supply to start?                                                                                                                                           |
| Sunrise Bakery Pte Ltd, 24 months, starting 1 September 2026.          | Got it. I’ll generate an indicative commercial electricity quote based on the company name, estimated usage, contract term and start date.                                                                                                                                                                                           |
| Sure.                                                                  | The agent should show a Markdown commercial quote with company, business type, monthly usage, recommended plan, indicative rate, estimated monthly charges and estimated contract value. It must state that this is a non-binding indicative quote and ask whether the customer wants the quote summary by email or sales follow-up. |
| If our actual usage is different from 8,000 kWh, will the cost change? | Yes, usage affects the estimated monthly charges. Final pricing, contract terms and eligibility will be confirmed by the PacificLight sales team based on the actual business details. This quote is for budget reference.                                                                                                           |
| Is a 24-month contract usually better?                                 | A 24-month contract is usually more suitable if you want longer price certainty and more predictable budgeting. If flexibility is more important, a shorter contract may also be considered.                                                                                                                                         |
| Can someone from sales contact me?                                     | Certainly. May I have the contact person’s name, email address or phone number?                                                                                                                                                                                                                                                      |
| David, <sunlin@udesk.cn>, 91234567.                                    | The agent should create a commercial quote follow-up request. Reply: Done — I’ve submitted your commercial electricity quote follow-up request. A sales consultant will review your usage, contract term and start date, then contact you via <sunlin@udesk.cn> or phone.                                                            |

***

## 场景 4：老商业客户用电报告

### 中文

| 客户对话                                  | 期望回答                                                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 你好，我们财务需要 2026 年 4 月到 6 月的用电报告。       | 可以的。我先帮您核验商业账户信息。请提供账户号和账单邮编。                                                                     |
| C-PL-2001，609999。                     | 应完成身份验证。回复：谢谢，身份验证已通过。请问您需要报告格式是 PDF、Excel，还是两种都需要？                                               |
| 两种都要，主要给财务和 ESG 做记录。                  | 明白。我会为您创建 2026 年 4 月至 6 月的用电报告请求，并记录需要 PDF 和 Excel 两种格式。                                          |
| 好。                                    | 应以 Markdown 卡片展示用电报告请求，包括请求编号、账户号、客户、报告周期、报告格式、发送方式、状态和可点击报告 PDF 链接。结尾询问是否把报告摘要和 PDF 链接发送到账户登记邮箱。 |
| 能不能也发给 <finance@abcmanufacturing.sg>？ | 账户登记邮箱可以直接发送。发送到额外邮箱涉及账户资料安全，需要先创建 Additional Recipient Ticket，不能直接承诺立即发送。                                              |
| 那先发到账户邮箱吧。                            | 应生成商业用电报告邮件并发送。回复：好的，报告摘要和 PDF 查看链接已发送到 <sunlin@udesk.cn>。邮件中包含月度用电汇总、账单金额摘要和 PDF 报告链接。           |
| 额外邮箱也帮我申请一下。                          | 应创建 Additional Recipient Ticket。回复：已为 <finance@abcmanufacturing.sg> 提交 Additional Recipient Ticket。审核通过后，报告才会发送至该邮箱。                    |
| PDF 现在能看吗？                            | 可以，您可以点击这里查看用电报告：\[点击此处查看用电报告]\(商业用电报告 PDF 链接)。                                                   |

### English

| Customer Dialogue                                                         | Expected Response                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hi, finance needs our electricity consumption report for Apr to Jun 2026. | Sure, I can help with that. Please provide your account number and billing postal code for verification.                                                                                                                                                                                 |
| C-PL-2001, 609999.                                                        | The agent should complete verification. Reply: Thank you, verification is complete. Would you like the report in PDF, Excel, or both formats?                                                                                                                                            |
|  PDF                                                                      | Understood. I’ll create a request for the 2026-04 to 2026-06 consumption report and record that both PDF and Excel formats are needed.                                                                                                                                                   |
| Okay.                                                                     | The agent should show a Markdown report request card with case reference, account number, customer, report period, report format, delivery method, status and clickable PDF report link. End by asking whether to email the report summary and PDF link to the registered billing email. |
| Can you also send it to <finance@abcmanufacturing.sg>?                    | The registered billing email can receive it directly. Sending to an additional email involves account information security, so an Additional Recipient Ticket is required before it can be sent there.                                                                         |
| Can I view the PDF now?                                                   | Yes. You can view the consumption report here: \[Click here to view the consumption report]\(commercial consumption report PDF link).                                                                                                                                                    |

***

## 场景 5：个人账单查询 / 账单邮件 / PDF

### 中文

| 客户对话                     | 期望回答                                                                                                              |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| 你好，我想查一下我的电费账单，感觉这个月有点高。 | 可以的，我帮您查一下。请提供您的账户号和账单邮编。                                                                                         |
| R-PL-1001，238888。        | 应直接查询账单，不要重复要求验证。回复前应保留账单 Markdown 结构。                                                                            |
| 查到了吗？                    | 应展示账单 Markdown，包括账户信息、账单周期、发票号、用电量、费用明细、GST、Late Payment Charge、应付总额、付款状态和付款方式。未支付账单才提醒到期日前付款，并询问是否发送到账户邮箱。       |
| 总额包含 GST 吗？              | 包含。应基于账单字段解释 Subtotal、GST 9% 和 Total Amount Due 的关系，不编造额外费用。                                                      |
| 为什么这个月比较贵？               | 应基于账单字段解释：总额主要由本期用电量、Energy Charge、MSS Charge、Metering Charge、Carbon Tax 和 GST 构成。如果客户认为异常，可以提交账单复核或转人工。不得编造具体原因。 |
| 那帮我发到账户邮箱吧。              | 应调用账单邮件发送能力。回复：好的，账单已发送到您的账户邮箱 <sunlin@udesk.cn>。邮件中包含完整账单明细和可点击 PDF 查看链接，请留意查收。                                  |
| PDF 链接能直接给我吗？            | 可以。应以 Markdown 链接回复：\[点击此处查看 PDF 文档]\(个人账单 PDF 链接)。                                                               |
| 如果账单已经付了，还需要付款吗？         | 如果工具返回 Paid / 已支付，应回复：该账单已支付，无需再次付款，您可以保存账单作为付款记录。不得提醒及时付款。                                                       |

### English

| Customer Dialogue                                                        | Expected Response                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Hi, I want to check my electricity bill. It seems a bit high this month. | Sure, I can help check that. Please provide your account number and billing postal code.                                                                                                                                                                                                         |
| R-PL-1001, 238888.                                                       | The agent should query the bill directly and should not ask for verification again. The bill response should preserve the Markdown structure.                                                                                                                                                    |
| Does the total include GST?                                              | Yes. The agent should explain based on the bill fields: subtotal plus GST 9% equals the total amount due. Do not invent additional charges.                                                                                                                                                      |
| Why is it higher this month?                                             | The agent should explain based on bill fields: the total is affected by consumption, Energy Charge, MSS Charge, Metering Charge, Carbon Tax and GST. If the customer believes it is abnormal, offer to submit a bill review request or transfer to a specialist. Do not invent a specific cause. |
| Please email it to me.                                                   | The agent should send the bill email. Reply: Done — I’ve sent the bill to your account email <sunlin@udesk.cn>. The email includes full bill details and a clickable PDF viewing link.                                                                                                           |
| Can you give me the PDF link directly?                                   | Yes. The agent should reply with a Markdown link: \[Click here to view the PDF document]\(personal bill PDF link).                                                                                                                                                                               |
| If the bill is already paid, do I still need to pay?                     | If the tool result is Paid, reply: This bill has been paid. No further payment is required. You may keep the bill for your records. Do not ask the customer to make payment.                                                                                                                     |

