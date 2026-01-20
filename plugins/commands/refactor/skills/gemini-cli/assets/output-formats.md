# Gemini CLI Output Formats

## 标准输出结构

```json
{
  "success": true,
  "SESSION_ID": "uuid-xxx-xxx",
  "agent_messages": "..."
}
```

---

## 组件气味检测输出

### JSON 格式

```json
[
  {
    "type": "god_component",
    "severity": "high",
    "location": {
      "file": "src/components/Dashboard.tsx",
      "line": 1,
      "component": "Dashboard"
    },
    "metrics": {
      "lines": 450,
      "responsibilities": 6,
      "props_count": 12
    },
    "suggestion": "Split into DashboardHeader, DashboardStats, DashboardChart components"
  },
  {
    "type": "prop_drilling",
    "severity": "medium",
    "location": {
      "file": "src/components/UserProfile.tsx",
      "line": 25,
      "component": "UserProfile"
    },
    "metrics": {
      "drilling_depth": 4,
      "props_drilled": ["user", "onUpdate", "theme"]
    },
    "suggestion": "Use Context API or state management library"
  },
  {
    "type": "css_bloat",
    "severity": "low",
    "location": {
      "file": "src/components/Card.tsx",
      "line": 80,
      "component": "Card"
    },
    "metrics": {
      "duplicate_rules": 15,
      "unused_classes": 5
    },
    "suggestion": "Extract shared styles to theme variables"
  }
]
```

---

## Extract Component 输出

### 代码格式

```tsx
// ===== NEW COMPONENT: DashboardStats.tsx =====

import React from "react";

interface DashboardStatsProps {
  totalUsers: number;
  activeUsers: number;
  revenue: number;
  onRefresh: () => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  totalUsers,
  activeUsers,
  revenue,
  onRefresh,
}) => {
  return (
    <div className="dashboard-stats">
      <StatCard title="Total Users" value={totalUsers} />
      <StatCard title="Active Users" value={activeUsers} />
      <StatCard title="Revenue" value={`$${revenue}`} />
      <button onClick={onRefresh}>Refresh</button>
    </div>
  );
};

// ===== MODIFIED: Dashboard.tsx =====

import { DashboardStats } from "./DashboardStats";

export const Dashboard: React.FC = () => {
  const { totalUsers, activeUsers, revenue, refresh } = useStats();

  return (
    <div className="dashboard">
      <DashboardHeader />
      <DashboardStats
        totalUsers={totalUsers}
        activeUsers={activeUsers}
        revenue={revenue}
        onRefresh={refresh}
      />
      <DashboardChart />
    </div>
  );
};
```

---

## CSS 优化输出

### 格式

```css
/* ===== BEFORE ===== */
.card {
  padding: 16px;
  background: #fff;
  border-radius: 8px;
}

.profile-card {
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #eee;
}

/* ===== AFTER ===== */

/* Variables */
:root {
  --spacing-md: 16px;
  --bg-surface: #fff;
  --border-radius-md: 8px;
  --border-subtle: 1px solid #eee;
}

/* Base Card */
.card {
  padding: var(--spacing-md);
  background: var(--bg-surface);
  border-radius: var(--border-radius-md);
}

/* Profile Card - extends Card */
.profile-card {
  composes: card;
  border: var(--border-subtle);
}

/* ===== CHANGES =====
 * 1. Extracted common values to CSS variables
 * 2. Used composes to extend base card
 * 3. Reduced duplication by 60%
 */
```

---

## 可访问性审查输出

### JSON 格式

```json
{
  "compliance_level": "partial",
  "target_level": "WCAG 2.1 AA",
  "issues": [
    {
      "type": "missing_aria_label",
      "severity": "high",
      "element": "button",
      "line": 45,
      "description": "Icon button without accessible name",
      "wcag_criterion": "1.1.1 Non-text Content",
      "fix": "Add aria-label=\"Close dialog\""
    },
    {
      "type": "insufficient_contrast",
      "severity": "medium",
      "element": ".muted-text",
      "line": 12,
      "description": "Text color #999 on #fff has contrast ratio 2.85:1",
      "wcag_criterion": "1.4.3 Contrast (Minimum)",
      "fix": "Change to #767676 for 4.54:1 ratio"
    },
    {
      "type": "missing_focus_indicator",
      "severity": "high",
      "element": ".custom-button",
      "line": 78,
      "description": "Button has outline: none without custom focus style",
      "wcag_criterion": "2.4.7 Focus Visible",
      "fix": "Add :focus-visible style with visible outline"
    }
  ],
  "fixes_applied": [
    {
      "file": "src/components/Dialog.tsx",
      "changes": 3
    }
  ],
  "code_changes": "..."
}
```

---

## 遗留前端分析输出

### JSON 格式

```json
{
  "framework": "angularjs",
  "framework_version": "1.6.10",
  "component_maturity": "partial",
  "state_management": "mixed",
  "build_system": "gulp",
  "css_architecture": "global",
  "migration_complexity": "high",
  "analysis": {
    "total_files": 150,
    "js_files": 80,
    "template_files": 45,
    "css_files": 25,
    "loc": 25000
  },
  "issues": [
    {
      "type": "deprecated_api",
      "count": 12,
      "examples": ["$scope", "$rootScope"]
    },
    {
      "type": "global_state",
      "count": 8,
      "examples": ["window.APP_CONFIG", "window.USER"]
    }
  ],
  "migration_recommendations": [
    {
      "phase": 1,
      "action": "Introduce module bundler",
      "effort": "2 weeks"
    },
    {
      "phase": 2,
      "action": "Migrate to component architecture",
      "effort": "4 weeks"
    },
    {
      "phase": 3,
      "action": "Introduce React/Vue for new features",
      "effort": "ongoing"
    }
  ]
}
```

---

## 错误输出

### 格式

```json
{
  "success": false,
  "error": {
    "type": "context_exceeded",
    "message": "Input exceeds 32k token limit",
    "details": "Current input: 45000 tokens. Consider splitting the request.",
    "suggestions": [
      "Process one component at a time",
      "Remove implementation details, keep interfaces",
      "Use multi-turn conversation"
    ]
  }
}
```

### 常见错误类型

| 类型                    | 描述          | 处理         |
| ----------------------- | ------------- | ------------ |
| `context_exceeded`      | 超过 32k 限制 | 拆分输入     |
| `timeout`               | 执行超时      | 简化任务     |
| `parse_error`           | 输出格式错误  | 检查提示词   |
| `unsupported_framework` | 不支持的框架  | 使用通用模式 |
