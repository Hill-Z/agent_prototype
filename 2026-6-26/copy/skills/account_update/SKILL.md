---
name: account_update
description: PacificLight 老客户账户资料变更技能。用于已验证客户修改联系方式、账单接收方式、服务地址、搬家、转移账户或新增报告/账单收件人审批。
---

# 账户资料变更 / 搬家

## 何时使用

客户提出搬家、转地址、账户转移、修改手机号/邮箱/账单接收方式、增加报告或账单收件人时使用。

## 调用前检查

必须先完成身份验证。

搬家场景必须收集：

- 新地址或新邮编
- 带年份的搬出日期（`YYYY-MM-DD`）
- 带年份的新地址开始供电日期（`YYYY-MM-DD`）

客户只给日期、没给新地址/新邮编时，先追问新地址或新邮编，不能提交请求。
客户只提供月日、没有年份时，先确认年份；不要自行补充年份。

## 工具使用

- 查询可变更资料：`get_customer_update_profile(account_no, language)`
- 提交变更/创建工单：`submit_account_update(account_no=..., update_type=..., new_value=..., move_out_date=..., new_supply_date=..., notes=..., language=...)`；搬家场景使用两个独立日期参数，不要把日期合并到 `effective_date`。
- 通用工单：`create_ticket(subject, content, language)`

## 返回后处理

搬家信息齐全后会创建 Udesk 工单，工单请求体使用 `subject` 和 HTML 富文本 `content`，模板按语言选择：英文 `template_id=2895`，中文 `template_id=2897`，`custom_fields={}`。返回时展示 Ticket ID。搬家不是即时完成：中文说明“客服团队会确认新地址供电、合约条款和可能的提前解约费”，英文说明 “Care Team / Early Termination Charges”。

## 工单内容要求

- `subject` 必须简短清晰：中文用中文标题并走模板 2897，英文用英文标题并走模板 2895。
- `content` 必须是 HTML 富文本，分别包含账户号、客户、当前服务地址、新地址/新邮编、搬出日期、新地址开始供电日期、当前套餐、合同到期日、联系电话、登记邮箱和客户备注。
- 不要把空字段或“暂未提供”作为已确认信息写入工单；缺少新地址/新邮编或日期时先追问。
