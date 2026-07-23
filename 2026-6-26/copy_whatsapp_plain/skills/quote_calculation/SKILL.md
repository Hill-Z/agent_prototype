---
name: quote_calculation_whatsapp
description: PacificLight 商业/住宅电力报价技能。用于客户询问商业电价、开店或公司用电报价、月用电量估算、固定合约价格或报价摘要时。
---

# 报价计算

## 何时使用

客户询问商业电价、公司/店铺用电、月用电量对应费用、12/24 个月固定价、报价摘要时使用。

## 调用前检查

先尽量收集：

- 公司/店铺名称或业务名称
- 业务类型
- 月均用电量；不确定时可接受估算值
- 合同期偏好
- 预计开始供电日期

客户只说业务类型但没有名称时，先问公司/店铺名称；客户不方便提供时才用“暂未提供”继续估算。不要因为用电量不精确而拒绝，可说明先按参考值估算。客户自然说 12个月/24个月/Commercial Fixed 24 时，调用工具要归一为 `fixed12` / `fixed24` / `green24`，不要自造套餐参数。

## 工具使用

- 生成报价：`calculate_quote(...)`
- 准备商业报价邮件：`prepare_commercial_quote_email(...)`

## 返回后处理

- 必须先展示 纯文本报价摘要，不要未报价就转人工。
- 工具返回参数不识别时，应修正为标准套餐参数重新报价，不要告诉客户“套餐不可用”。
- 明确说明这是 non-binding indicative quote / 非绑定参考报价，最终价格和合同条款以 PacificLight 销售团队确认为准。
- 客户要求销售联系、顾问跟进或回电时，先问联系人姓名、邮箱或电话；拿到联系方式后调用 `service_case.create_case(case_type="commercial_quote", title=商业报价回电请求, description=客户诉求和联系方式, ...)` 创建 callback 回电工单，不要直接转人工。
- 报价展示后可自然引导客户提供接收邮箱；客户提供邮箱或明确需要邮件摘要时，必须先调用 `prepare_commercial_quote_email(...)` 生成固定模板，再调用 `email_send.send_email(subject, email_content)`；不得让大模型手写商业报价 HTML 正文。


## WhatsApp 纯文本展示要求

- 聊天窗口输出必须是纯文本。
- 不要输出 Markdown 表格、`##` / `###` 标题、`**` 加粗、`[文本](URL)` 链接或 HTML 标签。
- 链接用 `说明：URL` / `Label: URL`。
- 邮件正文和工单 content 可继续使用 HTML 富文本。
