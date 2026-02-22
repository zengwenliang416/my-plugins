---
name: tech-stack-adapter
description: "Load framework-specific code generation conventions for the target tech stack"
allowed-tools:
  - Read
  - Glob
arguments:
  - name: stack
    type: string
    required: true
    description: "Target tech stack: react or vue"
---

# Tech Stack Adapter

Loads framework-specific conventions and rules for UI and logic code generation.

## Usage

```
Skill(skill="d2c:tech-stack-adapter", args="stack=react")
```

## Behavior

1. Read `references/${stack}.md` for the specified tech stack
2. Return the framework conventions as context for code generation agents
3. If the requested stack is not supported, return an error with available options

## Available Stacks (v1)

- `react` — React functional components, JSX, CSS Modules
- `vue` — Vue 3 SFC, Composition API, scoped styles

## Future Stacks (v2)

- `react-native` — React Native, StyleSheet.create
- `taro` — Taro cross-platform framework
