# 海外 IM 渠道对接能力调研

调研时间：2026-07-20

以下能力以官方 API 文档为依据。能力矩阵应由连接器、账号权限和 API 版本检测生成，不能让用户自由勾选。

| 渠道 | 入站 | 出站 | 原生交互 | 鉴权/连接 | 关键限制 |
| --- | --- | --- | --- | --- | --- |
| WhatsApp Cloud API | Webhook | Graph API Messages | Template、Interactive | Meta App、WABA、Phone Number、Token | 模板、会话窗口和业务账号权限影响发送 |
| Telegram | getUpdates 或 HTTPS Webhook | Bot API | Inline Keyboard、Reply Keyboard | Bot Token | 机器人不能向从未建立关系的用户主动私聊 |
| LINE | HTTPS Webhook | Reply、Push、Broadcast API | Template、Imagemap、Flex | Channel Access Token、Webhook 签名 | Reply Token 单次使用；单次请求最多 5 个消息对象 |
| Slack | Events API 或 Socket Mode | Web API `chat.postMessage` | Block Kit、按钮、线程 | OAuth 2.0、Bot Token、Scopes | 只能接收应用有权限访问的会话事件 |
| Discord | Gateway WebSocket 或 Webhook Events | REST Create Message、Webhook | Embed、Components、按钮、选择器 | Bot Token、OAuth 2.0、Webhook Token | 消息内容读取受 Intent 和频道权限控制 |
| Microsoft Teams | Bot Messaging Endpoint Activity | Bot Framework Connector、Teams SDK | Adaptive Card、按钮、Dialogs | Entra ID、Bot Registration | 群聊和频道通常要求应用已安装 |
| Viber | Webhook Callback | REST `send_message` | Keyboard、媒体、位置 | `X-Viber-Auth-Token` | 通常只能向已订阅用户发送 |
| X Direct Messages | DM 事件/回调 | X API DM API | 文本、媒体、Quick Reply | OAuth 2.0 | 用户关系、响应窗口和速率限制影响发送 |
| Intercom | Webhook/Conversation API | Messages API | In-app 消息、Email | Bearer Token、OAuth、Version Header | 当前创建消息类型主要是 in-app 和 email |
| Zendesk Sunshine Conversations | Webhook | Conversations REST API | 文本、媒体及渠道特定消息 | App/Account Token | 消息有大小限制，部分大消息异步处理 |
| Twilio Conversations | Webhook/SDK 事件 | Conversations REST API | 文本、媒体 | Account SID、Auth Token、Service 配置 | 返回 queued/sent/delivered/failed 等状态 |

## 产品建模结论

1. 连接器类型必须从平台支持列表选择；自定义渠道单独走 Webhook/API 连接器。
2. 连接状态由鉴权检测、Webhook 校验和平台回调维护，只读展示。
3. 渠道能力由适配器返回，按消息类型记录文本、媒体、文件、卡片、按钮、线程、主动推送等能力。
4. 回复、主动推送、群发、广播不能合并成一个发送开关。
5. 降级策略按消息类型和失败错误码执行，不使用一个渠道级字符串覆盖所有情况。
6. 统一消息模型只负责内部表达，实际发送必须经过渠道渲染器和能力校验。

## 官方来源

- https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
- https://core.telegram.org/bots/api
- https://developers.line.biz/en/docs/messaging-api/sending-messages/
- https://docs.slack.dev/apis/events-api/
- https://api.slack.com/methods/chat.postMessage
- https://docs.discord.com/developers/events/gateway
- https://docs.discord.com/developers/resources/message
- https://learn.microsoft.com/en-us/microsoftteams/platform/bots/build-conversational-capability
- https://developers.viber.com/docs/api/rest-bot-api/
- https://docs.x.com/x-api/direct-messages/create-dm-message-by-participant-id
- https://developers.intercom.com/docs/references/rest-api/api.intercom.io/messages
- https://developer.zendesk.com/documentation/conversations/getting-started/api-quickstart/
- https://www.twilio.com/docs/conversations/api/conversation-message-resource
