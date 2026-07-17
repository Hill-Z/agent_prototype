# Agent 运行过程与类人回复节奏设计

## 1. 目标与范围

本需求只建设两项能力：

1. 高级智能体右侧调试区实时展示可审计的思考摘要与执行过程。
2. 正式客户 IM 提供“模拟真人回复节奏”开关，打开后使用渠道原生输入状态并在答案完成后整条发送。

以下能力不在本需求范围，后续独立设计：消息语义分段、长任务安抚话术、用户插话与并发消息处理。

## 2. 产品原则

- 调试透明，客户自然：调试视图展示 Skill、知识库、工具、护栏和耗时；客户视图不接收这些内部数据。
- 不展示原始思维链：只展示可审计的阶段摘要、输入输出摘要和 Trace 事件。
- 同一个 Run，两套渲染：后端只产生一套标准运行事件，前端按调试权限和渠道策略分别渲染。
- 客户侧默认使用渠道原生 typing action，不把“正在输入”作为聊天消息发送。
- 类人模式关闭时保留平台现有流式回复；打开时禁止 Token 流直接发送到客户渠道。

## 3. 前端功能设计

### 3.1 配置区：回复体验

- `模拟真人回复节奏`：Agent 级开关。
- `输入状态节奏`：自然停顿、持续显示。
- `首次出现延迟`：避免短回复产生一闪而过的输入状态，默认 500ms。
- `最短展示时间`：输入状态出现后最少展示时长，默认 800ms。
- 固定契约：整条发送、使用渠道原生输入状态、不展示内部过程。

### 3.2 右侧预览区

提供两个视图：

- 调试视图：按时间顺序展示理解请求、护栏、Skill、知识库、工具、生成回复等事件；显示运行中、完成、等待状态和步骤耗时。
- 客户视图：模拟正式 IM。类人模式打开时只显示输入状态，Run 完成后一次性出现完整消息；关闭时展示平台默认流式回复。

### 3.3 前端状态模型

```ts
interface RuntimeEvent {
  eventId: string;
  runId: string;
  sequence: number;
  type: string;
  status: 'started' | 'completed' | 'failed';
  title: string;
  summary?: string;
  durationMs?: number;
  occurredAt: string;
}
```

前端按 `runId + sequence` 去重和排序。断线重连后使用最后收到的 `sequence` 续传，事件不得重复渲染。

## 4. 后端设计

### 4.1 Run 事件流

建议采用 SSE；已有 WebSocket 基础设施时可以复用。事件至少包含：

- `run.started`
- `analysis.started/completed`
- `guardrail.completed`
- `skill.started/completed/failed`
- `knowledge.started/completed/failed`
- `tool.started/completed/failed`
- `generation.started/completed`
- `run.completed/failed/cancelled`

原始 Prompt、模型思维链、密钥、完整工具参数和未经脱敏的返回值不得进入前端事件。

### 4.2 客户回复协调器

类人模式开启后：

1. Run 开始，但不立即发送 typing action。
2. 超过 `initialDelayMs` 仍未完成时，向渠道适配层发送 `typing.start`。
3. 自然停顿模式允许根据策略发送一次或两次 `typing.stop -> typing.start`，但不得影响 Run。
4. Run 完成且 typing 展示达到 `minTypingMs` 后，先发送 `typing.stop`。
5. 等待 100～300ms，再把完整答案作为一条消息发送。
6. 渠道不支持 typing action 时直接降级为整条发送，不发送“正在输入”文本消息。

类人模式关闭后，保持现有 Token/Chunk 流式输出链路。

### 4.3 建议接口

```http
PATCH /api/agents/{agentId}/response-experience
GET   /api/agents/{agentId}/response-experience
POST  /api/agents/{agentId}/debug-runs
GET   /api/debug-runs/{runId}/events?afterSequence=12
GET   /api/debug-runs/{runId}/events/stream
```

配置示例：

```json
{
  "humanizedTimingEnabled": true,
  "typingStyle": "natural",
  "initialDelayMs": 500,
  "minTypingMs": 800
}
```

### 4.4 数据与权限

- 配置保存到 Agent 发布版本，运行时绑定本次 Run 的配置快照。
- 调试事件保存周期和正文日志一致；客户会话只保存最终消息，不保存 typing action。
- 仅 Agent 编辑者和有日志权限的用户可订阅调试事件。
- 客户渠道网关不得收到 `analysis`、`tool`、`skill` 等调试事件正文。

## 5. 异常与降级

- SSE 断线：使用 `Last-Event-ID` 或 `afterSequence` 续传。
- Run 失败：调试视图显示失败步骤和错误码；客户侧停止输入状态并使用现有错误兜底回复。
- typing action 失败：不影响最终消息发送。
- 客户离线或会话关闭：停止 typing 心跳，Run 是否继续由现有取消策略决定。
- 页面切换到客户视图不改变 Run，只改变展示层。

## 6. 验收标准

1. 调试区在 Run 结束前持续出现阶段事件，不再表现为无反馈等待。
2. 调试事件顺序稳定，可显示运行中、完成、失败和耗时。
3. 不展示模型原始思维链、密钥、完整工具参数或未脱敏结果。
4. 类人模式开启时，客户视图不流式展示 Token，只显示输入状态和最终完整消息。
5. 类人模式关闭时，客户视图恢复平台默认流式回复。
6. 客户视图不出现工具名、Skill 名称、知识库召回数量和内部错误。
7. 不支持 typing 的渠道可以正常收到最终消息。
8. 配置、事件流和最终回复均可通过 Trace 的 `runId` 关联。
