---
name: account_update
description: PacificLight 老客户账户资料变更技能。用于已验证客户修改手机号、邮箱、账单接收方式、服务地址、搬家转移账户、商业财务收件人审批等场景。
---

# Account Update

## 什么时候使用

用户是现有客户，提出修改账户资料、联系方式、账单邮箱、通讯偏好、搬家、转移账户、增加报告/账单收件人等诉求时使用。

## 可用工具

### get_customer_update_profile(account_no, language)

查询已验证客户当前可变更资料和账户状态。

### submit_account_update(account_no, update_type, new_value, effective_date, notes, language)

提交账户资料变更或服务请求。

## 调用规则

1. 修改账户资料前必须先完成身份验证；未验证时先要求账户号和邮编。
2. 用户请求搬家/转移账户时，收集新地址或新邮编、搬出日期、新地址开始供电日期，再提交 `move_house`。
3. 用户修改邮箱、手机号、账单接收方式时，提交对应 update type。
4. 商业客户要求增加财务邮箱或额外报告收件人时，提交 `additional_recipient`，并说明需要账户管理员审批。
5. 工具返回 `FINAL_ANSWER:` 时，直接输出其后的内容，不要继续调用工具。
6. 不要提及模拟、mock、演示、测试或内部配置。

## 多语言规则

客户使用什么语言提问，最终就使用同一种语言回复。工具函数有 `language` 参数时，英文传 `en`，中文传 `zh`。账户号、日期、邮箱、地址、Case ID 不翻译。
