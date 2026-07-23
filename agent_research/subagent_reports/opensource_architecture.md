# 开源 Agent / Harness 架构与源码级调研

## 调研结论

这一批开源项目的共同趋势很清楚：**顶级 Agent 平台不是“一个 prompt + 一堆 tools”**，而是一个可持久化、可观测、可恢复、可权限控制、可插件化的 **Agent Harness**。  

对于 UAgent 这类企业客服平台，最重要的不是继续堆 Prompt，而是把能力拆成九层：`Agent`、`Tool/Skill`、`Workflow/Graph`、`Memory/Session/State`、`Trace`、`Guardrail`、`Handoff/HITL`、`Sandbox/Workspace`、`Eval`。  

我这轮重点深读了 6 个项目源码：OpenAI Agents SDK、LangGraph、AutoGen、OpenHands、Qwen-Agent、AgentScope；另外对 CrewAI、Dify、Coze Studio、SWE-agent、MetaGPT 做了官方入口级确认。  

## 研究范围

### 深读源码样本

| 项目 | 本地路径 | 说明 |
| --- | --- | --- |
| OpenAI Agents SDK | `C:/Users/13609/.codex/workbase/chat_agent/agent_research/sources/openai-agents-python` | 重点看 `agent.py`、`tool.py`、`guardrail.py`、`run_state.py`、`mcp/server.py`、`sandbox/session/*` |
| LangGraph | `C:/Users/13609/.codex/workbase/chat_agent/agent_research/sources/langgraph` | 重点看 `graph/state.py`、`pregel/main.py`、`stream/*`、`checkpoint/*` |
| AutoGen | `C:/Users/13609/.codex/workbase/chat_agent/agent_research/sources/autogen` | 重点看 `autogen-core`、`autogen-agentchat`、`autogen-ext`、`autogen-studio` |
| OpenHands | `C:/Users/13609/.codex/workbase/chat_agent/agent_research/sources/openhands` | 重点看 `app_server/app_conversation/skill_loader.py`、`event/event_store.py`、`sandbox/sandbox_service.py` |
| Qwen-Agent | `C:/Users/13609/.codex/workbase/chat_agent/agent_research/sources/qwen-agent` | 重点看 `agent.py`、`agents/group_chat.py`、`tools/base.py`、`memory/memory.py` |
| AgentScope | `C:/Users/13609/.codex/workbase/chat_agent/agent_research/sources/agentscope` | 重点看 `skill/_base.py`、`workspace/_base.py`、`tool/_base.py`、`permission/_engine.py`、`event/_event.py` |

### 官方入口级确认

| 项目 | 官方入口 | 本轮状态 |
| --- | --- | --- |
| CrewAI | `https://github.com/crewAIInc/crewAI`，`https://docs.crewai.com/` | clone 中途 SSL EOF，中止；仅官方入口确认 |
| Dify | `https://github.com/langgenius/dify`，`https://docs.dify.ai/` | 仅官方入口确认 |
| Coze Studio | `https://github.com/coze-dev/coze-studio` | 仅官方入口确认 |
| SWE-agent | `https://github.com/princeton-nlp/SWE-agent` | 仅官方入口确认 |
| MetaGPT | `https://github.com/FoundationAgents/MetaGPT`，`https://docs.deepwisdom.ai/` | 仅官方入口确认 |

## 顶层架构抽象对照

| 抽象 | OpenAI Agents SDK | LangGraph | AutoGen | OpenHands | Qwen-Agent | AgentScope | 对 UAgent 的启发 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agent | `Agent` 绑定 instructions/tools/guardrails/handoffs | `StateGraph` 不是 Agent，而是运行图 | `AssistantAgent` / `BaseGroupChat` | conversation + agent server + sandbox 驱动 | `Agent` / `BasicAgent` / `Assistant` | `Agent` + team/workspace 层 | UAgent 当前更像“Agent 配置层”，应向“运行时对象”演进 |
| Tool | `FunctionTool`、MCP、hosted tools、computer/apply_patch | node/edge 本身承载动作，prebuilt 里有 ToolNode | 工具通过 ext / workbench / agent tool 注入 | `scripts/tool.py` 顶层函数被加载成 skill tool | `BaseTool`、内建 web/search/python/mcp | `ToolBase`、内建 Bash/Read/Write/Edit/Skill | 工具必须有 schema、权限和 trace，不只是函数列表 |
| Skill | SDK 更偏“tool + prompt”能力包，sandbox agents 也像 capability bundle | 无显式 skill 概念 | 没有统一 skill 抽象，更多是 tool/agent/team | `SKILL.md + scripts/tool.py` 是平台级 skill 形态 | `knowledge_files`、agents、tools 组合 | `Skill` 是显式一等公民，支持本地加载 | UAgent 的 skill 包已经接近平台形态，应补 manifest/版本/依赖元数据 |
| Workflow / Graph | 以 runner / handoff / sandbox 形成流程，但不是图式 DSL | 核心就是图：`StateGraph -> compile -> Pregel` | `GroupChat`、`GraphFlow`、`Magentic-One` | app-server 驱动 conversation / sandbox / event flow | `group_chat` / `router` / `hub` | team、session、schedule、workspace 构成工作流 | 客服平台建议把“业务流”与“Agent prompt”分层，不要全塞进系统提示词 |
| Memory | `Session`、`run_state`、sandbox session state | short-term memory via checkpoint + store | `Memory` 接口与 `ListMemory` | event store + conversation state + sandbox workspace | `Memory` agent | workspace offload + session state | 客服场景要区分短期会话、长期画像、工单记录三种记忆 |
| State / Session | `run_state.py` 里可序列化 session/trace/guardrail/handoff 状态 | `Checkpoint` + `thread_id` 是状态主轴 | `session`、message/event 驱动 | `conversation`、`sandbox`、`event_store` | `message` 列表 + memory state | `session_id`、workspace_id、permission context | 必须有可恢复的会话主键，否则无法断点续跑 |
| Trace | 内建 tracing、run_state 可序列化 trace | stream/debug/checkpoint 体系适合观测 | core logging + agent events | event store + app server 级事件 | 日志与消息流 | event system 直接面向 UI/HITL | Trace 应与 session 绑定，方便审计与回放 |
| Guardrail | input/output guardrail 一等公民 | 通过 interrupt / validate / error handling 部分实现 | 通过事件、消息层和外围控制 | 主要靠平台业务约束与权限 | 比较弱，更多是 prompt 与工具选择 | permission system 是强约束 | 客服平台需要输入、输出、工具三级 guardrail |
| Handoff | 专门的 `Handoff` 对象与工具化转交 | graph 分支 / subgraph / command 机制更像路由 | team / group chat / speaker selection | 人工转接和技能转交 | group chat router | team tool、leader-worker、session routing | 人工转接必须保留上下文、动作和审计轨迹 |
| HITL | 原生支持 human-in-the-loop | `interrupt` / resume / checkpoint 是核心机制 | `UserInputRequestedEvent` 等事件 | 平台操作员与工单/转人工流程 | 以用户输入与会话驱动 | event + permission + session 组合 | 企业客服必须有明确的人工接管状态机 |
| Eval | tracing / debug / examples 为主 | 与 LangSmith / deploy 结合 | AgentBench / Studio | 产品级测试与业务验证 | examples / benchmark | 事件与权限可用于评估 | 新平台要把 eval 当一等系统，而不是事后脚本 |

## Runtime 机制对照

| 机制 | 代表项目 | 代码/文档证据 | 结论 |
| --- | --- | --- | --- |
| planner / executor | LangGraph、OpenHands、Qwen-Agent、AutoGen | `langgraph/pregel/main.py`，`openhands/app_server/*`，`qwen_agent/agents/group_chat.py`，`autogen-agentchat/teams/*` | 规划与执行要分离；复杂任务通常不是单次 prompt 完成 |
| graph / checkpoint | LangGraph、AutoGen GraphFlow | `langgraph/graph/state.py` 里 `compile(checkpointer=...)`，`pregel/main.py` 的 stream/interrupt/checkpoint | 图式 runtime 比纯消息循环更适合可恢复任务 |
| tool calling | OpenAI Agents SDK、AutoGen、Qwen-Agent、AgentScope | `tool.py`、`BaseTool`、`ToolBase`、`AgentTool`、MCP 接入 | Tool 需要 schema、权限、错误恢复和 trace 归一化 |
| 事件流 | AutoGen、LangGraph、AgentScope、OpenHands | `messages.py` 的事件类型、`stream/*`、`event/_event.py`、`event_store.py` | 面向 UI 和 HITL 的系统必须有事件总线 |
| 并发 | LangGraph Pregel、AgentScope 工具中间件、OpenHands sandbox / event、AutoGen streaming | `pregel/main.py`、`tool/_base.py`、`sandbox_service.py` | 并发不是细节，是吞吐和长任务恢复能力的前提 |
| 多 agent | AutoGen、CrewAI、Qwen-Agent、AgentScope、OpenHands | `group chat`、`team`、`hub`、`leader-worker`、skill routing | 多 agent 最好以“显式路由 + 明确角色”实现，而不是隐式对话漂移 |
| 错误恢复 | LangGraph checkpoint、OpenAI tracing/session、OpenHands sandbox lifecycle、AgentScope permission/event | checkpoint / resume / retry / resume state / sandbox pause-resume | 生产 harness 的关键不是“能跑”，而是“失败后能续跑” |

## 6 个深样本的源码模式

### 1. OpenAI Agents SDK

官方入口：
- [README](https://github.com/openai/openai-agents-python)
- [Docs](https://openai.github.io/openai-agents-python/)

版本与时间：
- 本地 `pyproject.toml` 版本是 `0.17.7`。
- README 明确写到 `Sandbox Agents` 在 `0.14.0` 引入。

源码模式：
- `src/agents/agent.py`：`AgentBase`、`Agent`、`handoffs`、`input_guardrails`、`output_guardrails` 都是一级字段。
- `src/agents/tool.py`：工具系统非常完整，含 function tool、custom tool、computer tool、apply_patch tool、MCP tool 相关类型与错误处理。
- `src/agents/guardrail.py`：输入/输出 guardrail 是显式对象，不是提示词习惯。
- `src/agents/run_state.py`：session items、guardrail results、handoff、trace 都可序列化，说明 runtime 需要可恢复状态。
- `src/agents/mcp/server.py`：对 MCP 有会话隔离、重试和 session id 语义。
- `src/agents/sandbox/session/*`：sandbox session 有事件、快照、恢复、挂载与清理。

判断：
- 这是“**产品化 Agent runtime**”而不是简单 SDK。
- 适合学习 `Agent / Tool / Guardrail / Handoff / Session / Trace / Sandbox` 的边界划分。

### 2. LangGraph

官方入口：
- [README](https://github.com/langchain-ai/langgraph)
- [Docs](https://docs.langchain.com/oss/python/langgraph/overview)
- [Reference](https://reference.langchain.com/python/langgraph/)

版本与时间：
- 本地 `pyproject.toml` 版本是 `1.2.7`。

源码模式：
- `langgraph/graph/state.py`：`StateGraph` 是 builder，`compile()` 后才是可执行图；支持 `checkpointer`、`interrupt_before`、`interrupt_after`。
- `langgraph/pregel/main.py`：真正的执行引擎，包含 stream、resume、checkpoint、interrupt、debug、v3 stream 兼容逻辑。
- `langgraph/checkpoint`、`langgraph/stream`、`langgraph/runtime`：把状态、流、运行时上下文拆开。

判断：
- LangGraph 的核心不是“agent”，而是**可恢复状态图**。
- 若 UAgent 以后要做复杂客服流程、审批流、分支流、人工回插，图式 runtime 基本是必需件。

### 3. AutoGen

官方入口：
- [README](https://github.com/microsoft/autogen)
- [Docs](https://microsoft.github.io/autogen/)

版本与时间：
- 本地 `autogen-core` 版本 `0.7.5`。
- README 明确说明项目处于 `maintenance mode`，新项目建议转向 Microsoft Agent Framework。

源码模式：
- `python/packages/autogen-core`：基础 runtime、memory、logging、code executor、message passing。
- `python/packages/autogen-agentchat`：更高层的 agent/team/chat API。
- `python/packages/autogen-ext`：模型与工具扩展层。
- `python/packages/autogen-studio`：可视化 UI、sessions、runs、teams、MCP、validation、eval。
- `messages.py` 中大量 `BaseAgentEvent` 事件类型，说明它偏事件驱动。
- `teams/_group_chat/*`、`_magentic_one_*`、`_graph/_digraph_group_chat.py` 体现 multi-agent team 与 graph flow。

判断：
- AutoGen 的价值是把“多 agent 编排”拆成 core / chat / extension / studio。
- 但它已进入维护模式，新平台不应再把它视作长期主干依赖，只适合借鉴架构与事件模型。

### 4. OpenHands

官方入口：
- [README](https://github.com/OpenHands/OpenHands)
- [Docs](https://docs.openhands.dev/)

版本与时间：
- 本地 `pyproject.toml` 动态版本标记为 `1.8.0`。

源码模式：
- `openhands/app_server/app_conversation/skill_loader.py`：技能不是静态文本，而是会从 agent-server 聚合、按 provider / org / repo / sandbox 组合加载。
- `openhands/app_server/event/event_store.py`：有独立 event store，适合长任务回放与审计。
- `openhands/app_server/sandbox/sandbox_service.py`：sandbox 有 start / resume / pause / delete / archive / wait / health check / limit 管理。
- `skills/**/*`：skill 作为可打包资源，而不是仅 prompt。

判断：
- OpenHands 是“**编码代理平台**”而不是 SDK，关注点是 conversation、sandbox、skills、events、auth、app server。
- 它最值得学的是“业务入口 + agent server + sandbox + event store”的产品化切分。

### 5. Qwen-Agent

官方入口：
- [README](https://github.com/QwenLM/Qwen-Agent)

版本与时间：
- README 提到 2025-03 到 2026-02 的多次功能更新，说明项目活动还在继续。

源码模式：
- `qwen_agent/agent.py`：基础 Agent 抽象。
- `qwen_agent/agents/group_chat.py`：显式多 agent group chat，支持 manual / round_robin / random / auto router。
- `qwen_agent/tools/base.py`：工具基类。
- `qwen_agent/memory/memory.py`：记忆 Agent，默认可走 retrieval / RAG。
- `qwen_agent/multi_agent_hub.py`、`llm/function_calling.py`：多 agent hub + function calling 是主设计。

判断：
- Qwen-Agent 比较像“轻量 agent 框架 + 多模态 / 多工具适配层”。
- 对新人工程师很有价值的点是：`Agent`、`Tool`、`Memory`、`Router`、`LLM adapter` 的边界非常直观。

### 6. AgentScope

官方入口：
- [README](https://github.com/agentscope-ai/agentscope)
- [Docs](https://docs.agentscope.io/)

版本与时间：
- README 标注 `AgentScope 2.0` 在 `2026-05` 发布，`2026-06` 继续增强 RAG、Mem0、Agent Team。

源码模式：
- `skill/_base.py`：Skill 是显式对象，包含 name / description / dir / markdown / updated_at。
- `skill/_local_loader.py`：支持本地 skill 目录发现、缓存、并发加载。
- `workspace/_base.py`：Workspace 是核心抽象，明确分出 resources / tools / offload / lifecycle / add-remove。
- `tool/_base.py`：Tool 具备 middleware onion、permission checks、state injection、MCP 标记等。
- `permission/_engine.py`：权限引擎是独立层，支持 allow / deny / suggestion。
- `event/_event.py`：事件系统细到 reply start/end、model call、tool call、thinking、hint 等。
- `app/_router/_schema_*`：有 session / schedule / team / workspace 的平台级 API 模式。

判断：
- AgentScope 是本轮里最接近“**完整 harness 平台**”的开源实现之一。
- 它的优势不只是 agent，而是 `skill + workspace + permission + event + session + multi-tenancy` 的系统化。

## 生态补充项目

这些项目本轮以官方入口级确认，没有做源码级深读。

| 项目 | 官方入口 | 备注 |
| --- | --- | --- |
| CrewAI | `https://github.com/crewAIInc/crewAI`，`https://docs.crewai.com/` | 值得重点补读 `crews` / `flows` / `tools` / `memory` 体系 |
| Dify | `https://github.com/langgenius/dify`，`https://docs.dify.ai/` | 更偏平台化应用编排、RAG、工作流与发布 |
| Coze Studio | `https://github.com/coze-dev/coze-studio` | 更偏平台产品与插件/工作流体系 |
| SWE-agent | `https://github.com/princeton-nlp/SWE-agent` | 适合看 coding agent 的迭代、repair、环境交互 |
| MetaGPT | `https://github.com/FoundationAgents/MetaGPT`，`https://docs.deepwisdom.ai/` | 适合看 role-based multi-agent 与软件工程分工 |

## 与 UAgent 当前形态的对照

### 已具备

- 你们当前的交付形态已经有清晰的 `Agent -> Skill -> scripts/tool.py` 路径。
- `SKILL.md` + `scripts/tool.py` 的打包和上传方式，已经非常接近“平台级 skill bundle”。
- 已有明确的人工转接话术与业务验证矩阵，说明你们已经在做业务结果导向，而不只是 demo。

### 还应补

- `Session / State / Trace`：现在更像“配置包”，还没有看到与长期会话、恢复、审计、回放绑定的统一 runtime 抽象。
- `Graph / Workflow`：目前更偏 prompt 编排，缺少可恢复的图式流程层。
- `Permission / Guardrail / HITL`：需要从 prompt 规约提升到系统层。
- `Eval / Replay`：需要把对话结果、工具结果、失败路径、人工接管纳入评估闭环。
- `Manifest / Versioning / Dependency metadata`：skill 包最好有版本、依赖、权限、输入输出 schema、兼容性描述。

### 结论

UAgent 当前已经有“能力包分发”了，但还缺“**运行时**”。  
要做下一代企业客服 Agent 平台，建议把现有 `Skill` 层保留，同时补出：

`agent runtime` + `workflow engine` + `session store` + `trace store` + `permission engine` + `sandbox/workspace` + `eval harness`

## 新人从 0 实现 Agent Harness 的拆模块建议

1. 先定义最小消息模型：`UserMessage`、`AssistantMessage`、`ToolCall`、`ToolResult`、`Event`、`Checkpoint`。
2. 再做模型适配层：统一 OpenAI / Anthropic / Qwen / 本地模型的请求与流式返回。
3. 再做工具注册层：工具 schema、权限、超时、重试、错误回退、trace name。
4. 再做 Agent 执行器：planner/executor loop、tool call loop、final answer loop。
5. 再做 State / Session：会话 ID、线程 ID、历史、状态快照、恢复。
6. 再做 Workflow / Graph：分支、子图、interrupt、resume、并发 fan-out / gather。
7. 再做 Guardrail / HITL：输入审查、输出审查、工具审查、人工审批。
8. 再做 Trace / Event：每一步可追踪、可回放、可聚合、可脱敏。
9. 再做 Sandbox / Workspace：代码执行、文件系统、外部系统访问隔离。
10. 最后再做 Eval：回归集、场景集、工具准确率、人工接管率、恢复率、成本与时延。

## 架构图文字描述

```text
UI / API
  -> Session Manager
    -> Agent Runtime
      -> Planner / Router
        -> Tool Registry / Skill Loader
          -> MCP / Built-in Tools / Business Tools
      -> Guardrails / Permission Engine
      -> HITL / Handoff
      -> Workflow Graph / Checkpoint Store
      -> Trace / Event Stream
      -> Sandbox / Workspace
      -> Eval / Replay
```

## 证据索引

### 官方文档 / 仓库

- [OpenAI Agents SDK](https://github.com/openai/openai-agents-python)；[Docs](https://openai.github.io/openai-agents-python/)
- [LangGraph](https://github.com/langchain-ai/langgraph)；[Docs](https://docs.langchain.com/oss/python/langgraph/overview)
- [AutoGen](https://github.com/microsoft/autogen)；[Docs](https://microsoft.github.io/autogen/)
- [OpenHands](https://github.com/OpenHands/OpenHands)；[Docs](https://docs.openhands.dev/)
- [Qwen-Agent](https://github.com/QwenLM/Qwen-Agent)
- [AgentScope](https://github.com/agentscope-ai/agentscope)；[Docs](https://docs.agentscope.io/)
- [CrewAI](https://github.com/crewAIInc/crewAI)；[Docs](https://docs.crewai.com/)
- [Dify](https://github.com/langgenius/dify)；[Docs](https://docs.dify.ai/)
- [Coze Studio](https://github.com/coze-dev/coze-studio)
- [SWE-agent](https://github.com/princeton-nlp/SWE-agent)
- [MetaGPT](https://github.com/FoundationAgents/MetaGPT)；[Docs](https://docs.deepwisdom.ai/)

### 本地源码路径

- `C:/Users/13609/.codex/workbase/chat_agent/agent_research/sources/openai-agents-python/src/agents/agent.py`
- `C:/Users/13609/.codex/workbase/chat_agent/agent_research/sources/openai-agents-python/src/agents/tool.py`
- `C:/Users/13609/.codex/workbase/chat_agent/agent_research/sources/openai-agents-python/src/agents/guardrail.py`
- `C:/Users/13609/.codex/workbase/chat_agent/agent_research/sources/openai-agents-python/src/agents/run_state.py`
- `C:/Users/13609/.codex/workbase/chat_agent/agent_research/sources/langgraph/libs/langgraph/langgraph/graph/state.py`
- `C:/Users/13609/.codex/workbase/chat_agent/agent_research/sources/langgraph/libs/langgraph/langgraph/pregel/main.py`
- `C:/Users/13609/.codex/workbase/chat_agent/agent_research/sources/autogen/README.md`
- `C:/Users/13609/.codex/workbase/chat_agent/agent_research/sources/autogen/python/packages/autogen-core/pyproject.toml`
- `C:/Users/13609/.codex/workbase/chat_agent/agent_research/sources/openhands/pyproject.toml`
- `C:/Users/13609/.codex/workbase/chat_agent/agent_research/sources/openhands/openhands/app_server/app_conversation/skill_loader.py`
- `C:/Users/13609/.codex/workbase/chat_agent/agent_research/sources/openhands/openhands/app_server/event/event_store.py`
- `C:/Users/13609/.codex/workbase/chat_agent/agent_research/sources/openhands/openhands/app_server/sandbox/sandbox_service.py`
- `C:/Users/13609/.codex/workbase/chat_agent/agent_research/sources/qwen-agent/qwen_agent/agent.py`
- `C:/Users/13609/.codex/workbase/chat_agent/agent_research/sources/qwen-agent/qwen_agent/agents/group_chat.py`
- `C:/Users/13609/.codex/workbase/chat_agent/agent_research/sources/qwen-agent/qwen_agent/tools/base.py`
- `C:/Users/13609/.codex/workbase/chat_agent/agent_research/sources/qwen-agent/qwen_agent/memory/memory.py`
- `C:/Users/13609/.codex/workbase/chat_agent/agent_research/sources/agentscope/src/agentscope/skill/_base.py`
- `C:/Users/13609/.codex/workbase/chat_agent/agent_research/sources/agentscope/src/agentscope/workspace/_base.py`
- `C:/Users/13609/.codex/workbase/chat_agent/agent_research/sources/agentscope/src/agentscope/tool/_base.py`
- `C:/Users/13609/.codex/workbase/chat_agent/agent_research/sources/agentscope/src/agentscope/permission/_engine.py`
- `C:/Users/13609/.codex/workbase/chat_agent/agent_research/sources/agentscope/src/agentscope/event/_event.py`

