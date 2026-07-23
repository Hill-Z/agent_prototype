# Agent 主流设计深度研究计划

目标：从商业化、顶层架构、实现细节、Prompt/Skill/Tool/Eval 等层面，系统总结当前主流 Agent 产品与开源 Harness 设计，形成可指导新人 PM/工程从 0 搭建顶级 Agent 的材料。

并行分工：
1. 商业产品与商业化/UX：ChatGPT Agent、Claude/Claude Code、Gemini、Microsoft Copilot Studio、Salesforce Agentforce、ServiceNow/Intercom/Zendesk/Coze/Dify 等。
2. 开源 Agent/Harness 架构：OpenAI Agents SDK、LangGraph、AutoGen、CrewAI、Dify、Coze Studio、Qwen-Agent、AgentScope、OpenHands/SWE-agent、OpenClaw/Hermes/OpenHarness 等。
3. Prompt/Skill/Tool/Memory/Eval 细节：Agent Skills、Claude Skills、Codex Skills、MCP、tool schema、guardrails、human-in-loop、trace、eval、prompt/skill generator。

输出：
- subagent_reports/*.md：三个子研究报告
- final/agent_design_master_guide.md：综合总指南
- final/agent_platform_prd_blueprint.md：平台产品方案/PRD 蓝图
- final/new_pm_engineer_onboarding.md：新人上手指南
