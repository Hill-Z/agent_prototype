---
name: renewal_handling
description: PacificLight 续约处理技能。验证后查询合同到期日、续约资格和下一步销售跟进。
---

# 续约处理

## 什么时候使用

用户询问续约、合同到期、renewal、extension、升级/降级套餐时使用。

## 可用工具

### handle_renewal(account_no, postal_code, requested_plan, contract_duration_months)

返回续约资格、当前套餐、到期日和下一步。

## 调用规则

1. 查询续约资格前必须验证身份。
2. 商业客户续约通常需要销售确认，不直接承诺合同已变更。
3. 用户确认续约但没有真实提交接口时，使用 `service_case` 或转人工。




## 多语言规则

客户使用什么语言提问，智能体最终就使用同一种语言回复。工具返回内容、`FINAL_ANSWER`、技能描述或历史消息不得覆盖客户最后一句语言；如语言不一致，必须翻译为客户最后一句语言后再回复。工具返回内容可由智能体翻译，但账户号、发票号、日期、金额、URL、套餐名、邮箱地址和指令必须保持原样。如工具函数提供 `language` 参数，英文客户传 `en`，中文客户传 `zh`。

