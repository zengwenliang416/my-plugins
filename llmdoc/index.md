# CCG-Workflows Documentation

LLM-optimized documentation for the CCG-Workflows plugin ecosystem - a local plugin marketplace for Claude Code CLI with 7 specialized workflow plugins.

## Quick Start

| Goal                        | Start Here                                                         |
| --------------------------- | ------------------------------------------------------------------ |
| Understand the project      | [Project Overview](overview/project-overview.md)                   |
| Use the commit workflow     | [How to Commit](guides/how-to-commit.md)                           |
| Use the TPD workflow        | [How to Use TPD](guides/how-to-use-tpd.md)                         |
| Create a new plugin         | [How to Create a Plugin](guides/how-to-create-a-plugin.md)         |
| Understand plugin structure | [Plugin Architecture](architecture/plugin-architecture.md)         |
| Use external models         | [How to Use External Models](guides/how-to-use-external-models.md) |

---

## Overview

Project-level context and summaries.

- [Project Overview](overview/project-overview.md) - Identity, purpose, plugin catalog, and tech stack

---

## Architecture

Technical deep-dives and LLM retrieval maps for system components.

### Core Systems

- [Plugin Architecture](architecture/plugin-architecture.md) - 4-layer modular architecture (Commands, Agents, Skills, Hooks)
- [Plugin System](architecture/plugin-system.md) - Discovery, loading, and registration flow
- [Workflow Orchestration](architecture/workflow-orchestration.md) - Sequential/parallel execution patterns and state management
- [Multi-Model Collaboration](architecture/multi-model-collaboration.md) - Codex/Gemini integration patterns and role-based delegation
- [Hooks System](architecture/hooks-system.md) - 5 lifecycle points, 11 hooks, cross-cutting automation

### Workflow Architectures

- [Commit Workflow](architecture/commit-workflow.md) - 10-phase automated commit with parallel semantic/symbol analysis
- [TPD Workflow](architecture/tpd-workflow.md) - Three-phase (Thinking-Plan-Dev) development with multi-model collaboration

---

## Guides

Step-by-step operational instructions for specific tasks.

### Using Workflows

- [How to Commit](guides/how-to-commit.md) - Execute the 10-phase commit workflow
- [How to Use TPD](guides/how-to-use-tpd.md) - Execute Thinking, Plan, and Dev phases
- [How to Use External Models](guides/how-to-use-external-models.md) - Invoke Codex/Gemini via codeagent-wrapper CLI

### Creating Extensions

- [How to Create a Plugin](guides/how-to-create-a-plugin.md) - Build a new workflow plugin from scratch
- [How to Create a Hook](guides/how-to-create-a-hook.md) - Add lifecycle hooks for cross-cutting concerns
- [How to Design a Workflow](guides/how-to-design-a-workflow.md) - Design multi-phase command workflows

---

## Reference

Factual lookup information and source-of-truth pointers.

### Conventions

- [Coding Conventions](reference/coding-conventions.md) - File naming, directory structure, TypeScript/Shell standards
- [Git Conventions](reference/git-conventions.md) - Commit format, branch naming, emoji mapping

### Component Catalogs

- [Plugin Metadata](reference/plugin-metadata.md) - JSON/YAML schema summaries for plugin configuration
- [Workflow Inventory](reference/workflow-inventory.md) - Complete catalog of 7 workflows across 6 plugins
- [TPD Agents](reference/tpd-agents.md) - Registry of 10 TPD agents across 4 categories
- [Hook Scripts](reference/hook-scripts.md) - Registry of 11 hook scripts across 6 categories

---

**Document Count:** 20 files (1 overview, 7 architecture, 6 guides, 6 reference)

Generated: 2026-02-02
