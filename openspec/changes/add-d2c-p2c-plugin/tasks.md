# Tasks: Add D2C + P2C Plugin

## 1. Plugin Scaffold
- [x] 1.1 Create `plugins/d2c/.claude-plugin/plugin.json` with metadata
- [x] 1.2 Create `plugins/d2c/CLAUDE.md` with plugin instructions, agent table, phase descriptions, and constraints
- [x] 1.3 Register plugin in `.claude-plugin/marketplace.json`

## 2. D2C Agents
- [x] 2.1 Create `plugins/d2c/agents/design-analyzer.md` — visual analysis agent with image input support, incremental component selection
- [x] 2.2 Create `plugins/d2c/agents/ui-generator.md` — semantic UI code generation agent with React/Vue support, visual fidelity comparison

## 3. P2C Agents
- [x] 3.1 Create `plugins/d2c/agents/prd-analyzer.md` — PRD parsing and intelligent chunking agent
- [x] 3.2 Create `plugins/d2c/agents/logic-generator.md` — logic code generation agent with codebase context enhancement

## 4. PRD Generation
- [x] 4.1 Create `plugins/d2c/agents/prd-generator.md` — generate PRD from design screenshots and/or user descriptions
- [x] 4.2 Create `plugins/d2c/commands/gen-prd.md` — standalone PRD generation command

## 5. Commands
- [x] 5.1 Create `plugins/d2c/commands/d2c.md` — design screenshots to UI code workflow
- [x] 5.2 Create `plugins/d2c/commands/p2c.md` — PRD to logic code workflow
- [x] 5.3 Create `plugins/d2c/commands/full.md` — integrated D2C+P2C pipeline with optional PRD generation

## 6. Skills
- [x] 6.1 Create `plugins/d2c/skills/tech-stack-adapter/SKILL.md` with framework routing logic
- [x] 6.2 Create `plugins/d2c/skills/tech-stack-adapter/references/react.md` — React conventions
- [x] 6.3 Create `plugins/d2c/skills/tech-stack-adapter/references/vue.md` — Vue 3 conventions
- [x] 6.4 Create `plugins/d2c/skills/prd-chunker/SKILL.md` — document chunking logic

## 7. Validation
- [x] 7.1 Verify plugin structure complete (15 files)
- [x] 7.2 OpenSpec validate passes (`--strict --no-interactive`)
- [ ] 7.3 Test `/d2c` command with sample design screenshot
- [ ] 7.4 Test `/p2c` command with sample PRD markdown file
- [ ] 7.5 Test `/gen-prd` command with design screenshot
- [ ] 7.6 Test `/d2c-full` command end-to-end (with and without PRD)
