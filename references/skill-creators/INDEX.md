# Skill Creator References

本目录用于沉淀“生成/创建/治理 Skill”的参考材料，供后续设计 UAgent Skill Copilot / Skill Studio 使用。

## Local Codex / OMX references

- `codex-system-skill-creator/`：Codex 系统内置 skill-creator。重点看：`SKILL.md`、`scripts/init_skill.py`、`scripts/quick_validate.py`、`references/openai_yaml.md`。
- `omx-writing-skills/`：OMX 的 writing-skills 工作流，强调“用 TDD 写 Skill”，重点看：`SKILL.md`、`anthropic-best-practices.md`、`testing-skills-with-subagents.md`。
- `template-creator-plugin/`：Codex artifact-template skill 创建器，重点看：如何从参考文件生成可复用模板、预览、校验与打包流程。
- `codex-plugin-creator/`：Codex plugin 脚手架，重点看：manifest、脚手架、校验、marketplace/install 流程。

## Upstream repositories

- `upstream/anthropics-skills/`：Anthropic skills 官方示例仓库。
  - `skills/skill-creator/`：Claude Skill Creator，包含 eval/iterate/description improver 等机制。
  - `skills/mcp-builder/`：从需求生成 MCP server 的复杂生成器参考。
  - `template/SKILL.md`：最小模板。
  - `README.md`：skills 定义与仓库说明。
- `upstream/openai-skills/`：OpenAI skills 示例仓库（README 标注 deprecated，但系统 skills 仍有参考价值）。
  - `skills/.system/skill-creator/`：Codex Skill Creator 上游版本。
  - `skills/.system/plugin-creator/`：Plugin 创建器。

## Initial product takeaways

1. Skill Creator 不是“一键生成即上线”，而是“draft -> eval/test -> iterate -> validate -> package”的生产线。
2. Anthropic skill-creator 明确把 eval、benchmark、description trigger 优化作为创建闭环的一部分。
3. Codex skill-creator 强调 token economy、自由度控制、资源目录、脚本化脚手架和快速校验。
4. 对 UAgent 来说，应把这些改造成企业版 Skill Studio：材料输入、业务理解确认、结构化 Skill 草稿、Tool/变量映射、Lint、测试集、审核、发布、运行观测。
