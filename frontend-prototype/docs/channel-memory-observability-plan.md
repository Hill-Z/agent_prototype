# 渠道、长期记忆、监控与报表实施计划

## 目标

在高级智能体平台增加四个相互独立但共享 Trace 事件的数据面：

1. 渠道：负责接入协议、统一消息模型、原生消息渲染和降级。
2. 长期记忆：负责跨渠道身份统一、时序记忆、冲突与遗忘。
3. 监控：回答“现在是否正常”，提供实时健康状态、告警和链路定位。
4. 报表：回答“过去效果如何”，提供运营、效果、渠道、成本和版本分析。

## 官方渠道调研结论

### WhatsApp Cloud API

- 统一发送入口：`POST /{Phone-Number-ID}/messages`。
- 官方 Meta Postman 集合明确提供模板消息、Webhook 订阅和 WABA/电话号码配置。
- 平台能力模型按 WhatsApp Cloud API 的原生类型建模：文本、图片、音频、视频、文档、贴纸、位置、联系人、Reaction、模板和 Interactive。
- Interactive 不是任意 JSON 卡片，需要区分 Reply Button、List、Product、Product List、Catalog 与 Flow；超出能力时降级成文本、编号选项或链接。
- 媒体输入统一支持 `media_id` 或受控 URL，进入 Agent 前转换成平台 `asset_id`。
- 官方参考：https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
- Meta 官方 Postman：https://www.postman.com/meta/whatsapp-business-platform/documentation/wlk6lh4/whatsapp-cloud-api

### X Direct Messages

- 官方 v2 Lookup 支持按参与者、会话或账号查询 DM events，事件包含 `MessageCreate`、`ParticipantsJoin` 和 `ParticipantsLeave`。
- 查询窗口以官方当前说明为准，现有 Lookup 文档明确最近 30 天与 OAuth User Context 要求。
- Demo 保守建模为文本、媒体附件和链接，不声明支持按钮、列表、模板或任意卡片。
- 发送能力需按实际开发者账号权限和当前 API 套餐验证，未获权限时渠道状态标记为“待授权”。
- 官方参考：https://developer.x.com/en/docs/x-api/direct-messages/lookup

### Udesk IM 与网页插件

- 分成两个能力档案：`udesk_im` 与 `udesk_web_plugin`。
- Udesk IM 以文本、图片、文件、音频和会话状态为基线。
- 网页插件可通过受控前端组件承载卡片、按钮、表单、进度等增强消息。
- 最终字段需要使用当前 Udesk SDK 和线上账号进行契约核对，不能把网页插件能力默认等同于所有 Udesk 渠道。

## 统一消息契约

```ts
type CanonicalMessage = {
  id: string
  channel: string
  conversationId: string
  senderId: string
  parts: Array<TextPart | AssetPart | LocationPart | ActionPart>
  replyTo?: string
  rawPayloadRef: string
}

type AssetRef = {
  assetId: string
  sourceType: 'url' | 'provider_file_id' | 'binary'
  mimeType: string
  storageUri?: string
  expiresAt?: string
  scanStatus: 'pending' | 'passed' | 'blocked'
}
```

渠道原始 URL、文件 ID 或二进制不直接进入 Prompt。平台完成鉴权下载、安全扫描和临时存储后，只向 Runtime 提供 `asset_id`。

## 渠道渲染与降级

每个渠道拥有独立 Renderer，不共享所谓“万能卡片 JSON”。统一响应只表达业务语义：文本、媒体、字段、动作和引用。

降级顺序：

```text
原生结构化消息
→ 原生按钮或列表
→ 图片 + 文本
→ 文本 + 链接
→ 纯文本编号选项
```

每次降级写入 Trace：原始类型、目标渠道、失败原因、最终类型和消息 ID。

## 渠道行为规则

规则条件：渠道、渠道账号、会话类型、用户标签、语言、时间、隐私授权、消息类型和能力标记。

规则动作：Prompt 片段、Skill、Tool 白名单、知识库、语言、消息格式、降级策略、主动消息、隐私协议和 Memory Key。

渠道上下文变量默认不全部注入 Prompt。每项分别配置 Prompt、Tool、Memory 和日志可见性。

## 跨渠道长期记忆

实现顺序：

1. 用 `tenant_id + namespace + custom_identity_key` 定位记忆主体。
2. 支持系统客户 ID、手机号、邮箱、渠道用户 ID、CRM ID 和自定义变量。
3. 区分事实、偏好、任务、关系和状态记忆。
4. 保存 `observed_at`、`valid_from`、`valid_to` 与来源证据。
5. 冲突优先级：业务系统 > 用户确认 > 人工修改 > 多次确认 > 单次模型抽取 > 推断。
6. 支持 TTL、任务完成后过期、用户删除、管理员删除、协议撤回和渠道解绑。
7. 高风险字段不允许模型自动覆盖，进入人工确认队列。

## 监控

实时事件：消息接收、资产处理、模型调用、Tool 调用、护栏、记忆读写、渠道渲染、降级、消息发送和转人工。

核心视图：

- 渠道健康度与最近错误。
- 运行中 Run、首字节延迟、完整耗时和失败率。
- Tool、模型、ASR、多模态与记忆服务状态。
- 告警列表与 Trace 跳转。

## 报表

独立于实时监控，按时间范围聚合：

- 运营：会话、用户、解决率、转人工率、满意度。
- Agent：任务完成率、追问率、兜底率、知识命中率。
- 渠道：消息量、发送成功率、原生结构化消息率、降级率。
- 成本：Token、模型、ASR、多模态、Tool 与单解决成本。
- 版本：Agent、Prompt、Skill、模型和策略版本对比。

## Demo 交付切片

1. 新增渠道工作区：能力矩阵、行为规则、上下文变量、消息预览。
2. 新增长期记忆工作区：身份 Key、抽取/遗忘策略、时间线和冲突处理。
3. 重做监控工作区：实时健康、告警和服务链路。
4. 新增报表工作区：筛选、趋势、渠道分布和版本对比。
5. Mock 数据与 UI 分离，后续可直接替换成 API。
6. 自动化测试覆盖导航、渠道切换、规则配置、记忆冲突和报表筛选。
