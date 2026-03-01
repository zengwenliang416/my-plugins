# Claude Code 插件迁移到 Codex CLI 官方方案（TPD + Docflow）

## 1) 背景与目标

本指南用于将本仓库中的 Claude Code 插件资产，迁移到 Codex CLI 官方推荐
结构，形成可持续维护的两条工作流路径：

- TPD（Thinking → Plan → Dev）
- Docflow（文档优先调研与执行）

迁移目标：

1. 统一目录与配置：`[agents] + role TOML + .agents/skills`。
2. 保持协议一致：消息契约、修复轮次上限、校验门禁不退化。
3. 清理 legacy 重复资产，避免双份来源导致漂移。
4. 提供可执行安装与验证命令，方便新同事快速落地。

---

## 2) 官方原则（为什么这样迁移）

> 每个关键决策都附官方来源，避免“经验流”口口相传。

1. **配置采用分层治理（基础 + 参考）**
   - 先用基础配置建立可运行最小集，再按参考文档补齐字段与约束。
   - 官方链接：
     - Config basics: https://developers.openai.com/codex/config-basic
     - Configuration Reference:
       https://developers.openai.com/codex/config-reference

2. **多 Agent 采用显式角色注册**
   - 通过 `config.toml` 统一声明 role，再映射到独立 TOML，保证可审计和
     可替换。
   - 官方链接：
     - Multi-agents: https://developers.openai.com/codex/multi-agent

3. **Skills 采用官方可发现路径**
   - 统一放在 `.agents/skills/*`，减少私有目录约定带来的歧义。
   - 官方链接：
     - Agent Skills: https://developers.openai.com/codex/skills

4. **团队规则通过 AGENTS.md 固化**
   - 将执行协议、消息类型、风险升级规则写入 `AGENTS.md`，而不是口头约定。
   - 官方链接：
     - Custom instructions with AGENTS.md:
       https://developers.openai.com/codex/guides/agents-md

5. **外部能力统一通过 MCP 扩展**
   - 对代码检索、文档查询、外部模型调用等能力采用 MCP 接入，降低耦合。
   - 官方链接：
     - Model Context Protocol: https://developers.openai.com/codex/mcp

---

## 3) 迁移映射（Claude Code → Codex CLI 官方）

### 3.1 通用映射

- 旧：插件内隐式代理/技能组织
- 新：
  - 角色注册：`.codex/config.toml`
  - 角色配置：`.codex/agents/*.toml`
  - 技能目录：`.agents/skills/*/SKILL.md`
  - 工作流入口：`.codex/prompts/*.md`
  - 契约校验：`.codex/{tpd,docflow}/evals/*.py`

### 3.2 TPD 路径映射

- Prompts：`tpd-init / tpd-thinking / tpd-plan / tpd-dev`
- Agents：`tpd-context-explorer / tpd-codex-core / tpd-gemini-core`
- Skills：14 个 `tpd-*` 技能迁移到 `.agents/skills/`
- 校验：`check_tpd_assets.py` 校验文件存在、协议覆盖、角色注册、模型配置

### 3.3 Docflow 路径映射

- Prompts：`docflow-init-doc / docflow-with-scout / docflow-what`
- Agents：`docflow-investigator / docflow-scout / docflow-recorder /
  docflow-worker`
- Skills：5 个 `docflow-*` 技能迁移到 `.agents/skills/`
- 校验：`check_docflow_assets.py` 校验协议、角色、模型与路径一致性

---

## 4) 分步迁移流程（可直接执行）

1. **盘点资产**
   - 列出现有 prompts / agents / skills / evals，标记“保留、迁移、删除”。

2. **先建官方骨架**
   - 先写 `.codex/config.toml` 的 `[agents]` 与 `[[skills.config]]`。
   - 再创建 `.codex/agents/*.toml` 与 `.agents/skills/*/SKILL.md`。

3. **迁移两条主路径**
   - TPD：先迁移 role，再迁移 skill，再接入 manifest/eval。
   - Docflow：先迁移 role，再迁移 skill，再对齐消息契约。

4. **接入静态校验门禁**
   - TPD 与 Docflow 的 eval 脚本必须能 PASS。

5. **清理 legacy 副本**
   - 删除 `.codex/agents/*.md` 与 `.codex/skills/*` 中对应 legacy 副本。

6. **安装演练与回归**
   - 先 dry-run，再 user/project 安装，再执行校验。

---

## 5) 安装与验证（可复制命令）

### 5.1 仓库内直接校验

```bash
python3 codex/.codex/tpd/evals/check_tpd_assets.py
python3 codex/.codex/docflow/evals/check_docflow_assets.py
```

### 5.2 安装 dry-run（推荐先跑）

```bash
# 用户级 dry-run
./codex/install-codex-bundle.sh --scope user --dry-run

# 项目级 dry-run（以当前仓库为目标）
./codex/install-codex-bundle.sh --scope project --project-root . --dry-run
```

### 5.3 实际安装

```bash
# 用户级安装（写入 ~/.codex 与 ~/.agents）
./codex/install-codex-bundle.sh --scope user

# 项目级安装（写入指定项目根目录）
./codex/install-codex-bundle.sh --scope project --project-root /path/to/project
```

### 5.4 安装后校验（在目标项目根目录执行）

```bash
python3 .codex/tpd/evals/check_tpd_assets.py
python3 .codex/docflow/evals/check_docflow_assets.py
```

---

## 6) 本仓库证据（已落地）

### 6.1 TPD 迁移证据

- 迁移动机与范围：
  `openspec/changes/refactor-tpd-codex-adapter/proposal.md:5`
  `openspec/changes/refactor-tpd-codex-adapter/proposal.md:15`
- 官方对齐任务完成：
  `openspec/changes/refactor-tpd-codex-adapter/tasks.md:33`
  `openspec/changes/refactor-tpd-codex-adapter/tasks.md:48`
- 规范要求（官方路径 + 无 legacy）：
  `openspec/changes/refactor-tpd-codex-adapter/specs/tpd-codex-workflow-assets/spec.md:11`
  `openspec/changes/refactor-tpd-codex-adapter/specs/tpd-codex-workflow-assets/spec.md:36`

### 6.2 Docflow 迁移证据

- 迁移动机与目标结构：
  `openspec/changes/refactor-docflow-codex-official-adapter/proposal.md:5`
  `openspec/changes/refactor-docflow-codex-official-adapter/proposal.md:16`
- 官方路径与校验任务完成：
  `openspec/changes/refactor-docflow-codex-official-adapter/tasks.md:7`
  `openspec/changes/refactor-docflow-codex-official-adapter/tasks.md:32`
- 规范要求（roles + skills + 无 legacy）：
  `openspec/changes/refactor-docflow-codex-official-adapter/specs/docflow-codex-workflow-assets/spec.md:10`
  `openspec/changes/refactor-docflow-codex-official-adapter/specs/docflow-codex-workflow-assets/spec.md:46`

### 6.3 当前运行证据

- 统一配置与技能注册：`codex/.codex/config.toml:4`
  `codex/.codex/config.toml:115`
- TPD manifest 与协议：`codex/.codex/tpd/manifest.yaml:6`
  `codex/.codex/tpd/manifest.yaml:67`
- Docflow manifest 与协议：`codex/.codex/docflow/manifest.yaml:6`
  `codex/.codex/docflow/manifest.yaml:47`
- 安装器行为（merge / dry-run / verify）：
  `codex/install-codex-bundle.sh:21`
  `codex/install-codex-bundle.sh:399`

---

## 7) 常见坑与排错（含已识别风险）

### 风险 1：agent role 命名连接符不一致（**已识别**）

- 现象：文档/manifest 用 `tpd-context-explorer`，config 注册是
  `[agents.tpd_context_explorer]`。
- 根因：显示名（`-`）与 TOML key（`_`）语义不同，需要映射。
- 证据：
  - `codex/.codex/config.toml:8`
  - `codex/.codex/tpd/manifest.yaml:28`
  - `codex/.codex/tpd/evals/check_tpd_assets.py:92`
  - `codex/.codex/docflow/evals/check_docflow_assets.py:88`
- 处理：
  1. 统一维护一份“显示名 ↔ role_key”映射表。
  2. 在校验脚本中强制检查映射，不靠人工记忆。

### 风险 2：`skills.config.path` 目录语义与安装脚本写入 `SKILL.md` 差异
（**已识别**）

- 现象：源配置中 `path` 指向目录；安装脚本追加时会归一化到绝对
  `.../SKILL.md`。
- 根因：两种表示都可工作，但混用会让 diff 与排障变复杂。
- 证据：
  - 目录语义声明：`codex/.codex/config.toml:39`
  - 安装后写入 `SKILL.md` 说明：`codex/README.md:30`
  - 脚本归一化逻辑：`codex/install-codex-bundle.sh:263`
    `codex/install-codex-bundle.sh:314`
- 处理：
  1. 团队约定“仓库内用目录语义，安装后允许绝对 SKILL.md”。
  2. 排障时先确认“运行环境最终 config”为准。

### 其他高频问题

- 校验脚本在错误目录执行：请在仓库根目录或目标项目根目录执行。
- `replace` 模式误删文件：默认用 `merge`，仅在明确清理时使用 `replace`。
- legacy 文件未删干净：按 spec 要求复查 `.codex/agents/` 与 `.codex/skills/`
  是否还有 `tpd-*` / `docflow-*` 旧副本。

---

## 8) 给新同事的执行清单

- [ ] 阅读本指南与官方文档（config/multi-agent/skills/agents-md/mcp）。
- [ ] 先跑 dry-run，确认安装影响范围。
- [ ] 执行 user 或 project 安装。
- [ ] 安装后跑 TPD 与 Docflow 两套 eval，必须 PASS。
- [ ] 检查 `config.toml` 中 roles 与 skills 是否齐全。
- [ ] 检查是否仍存在 legacy 重复资产。
- [ ] 若遇到 role 或 skill 路径问题，优先按“风险 1/2”排查。
- [ ] Update project documentation using docflow-recorder

