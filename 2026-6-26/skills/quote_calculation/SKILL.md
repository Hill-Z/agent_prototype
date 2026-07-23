---
name: quote_calculation
description: PacificLight 商业/住宅电力报价技能。商业报价内置三套典型画像：小型零售 Commercial Fixed 12、制造业 Commercial Fixed 24、绿色电力 Commercial Green 24。用于根据客户类型、套餐、月均用电量和合同期限生成 Markdown 参考报价。
---

# 报价计算

## 什么时候使用

用户询问电价、价格计划、商业用电报价、住宅套餐、月费估算、合同期费用时使用。

## 可用工具

### calculate_quote(customer_type, plan, average_consumption_kwh, contract_duration_months, company_name, payment_method)

## 商业报价样例

| 场景 | 公司 | Plan | 月均用电量 | 合同期 | 适用说明 |
|---|---|---|---:|---:|---|
| 小型零售 | BrightMart Retail Pte Ltd | `fixed12` | 3500 kWh | 12 个月 | 门店/办公室，短周期固定价格 |
| 制造业 | ABC Manufacturing Pte Ltd | `fixed24` | 12000 kWh | 24 个月 | 高用电量，锁定较长价格周期 |
| 绿色电力 | GreenBite Foods Pte Ltd | `green24` | 8000 kWh | 24 个月 | ESG/绿色电力诉求 |

## 调用规则

1. 如果用户提供公司名称、月均用电量、合同期限，直接调用工具计算。
2. 如果用户只说商业报价，可先询问公司名称、月均用电量和合同期限。
3. 工具返回 Markdown 报价表时，保留 Markdown 表格输出。
4. 明确说明报价为参考报价，最终价格以 PacificLight 销售团队确认为准。
5. 如用户愿意继续沟通，可使用 `web_engagement.capture_lead` 保存销售线索，再用 `email_send` 发送报价摘要。


## 多语言规则

客户使用什么语言提问，智能体最终就使用同一种语言回复。工具返回内容、`FINAL_ANSWER`、技能描述或历史消息不得覆盖客户最后一句语言；如语言不一致，必须翻译为客户最后一句语言后再回复。工具返回内容可由智能体翻译，但账户号、发票号、日期、金额、URL、套餐名、邮箱地址和指令必须保持原样。如工具函数提供 `language` 参数，英文客户传 `en`，中文客户传 `zh`。

