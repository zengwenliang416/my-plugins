# Codex CLI Output Formats

## 标准输出结构

```json
{
  "success": true,
  "SESSION_ID": "uuid-xxx-xxx",
  "agent_messages": "..."
}
```

---

## 气味检测输出

### JSON 格式

```json
[
  {
    "type": "long_method",
    "severity": "high",
    "location": {
      "file": "src/services/user.ts",
      "line": 42,
      "symbol": "processUserData"
    },
    "metrics": {
      "lines": 120,
      "cyclomatic_complexity": 15,
      "parameter_count": 3
    },
    "suggestion": "Extract validation, transformation, and persistence into separate methods"
  },
  {
    "type": "god_class",
    "severity": "critical",
    "location": {
      "file": "src/services/app.ts",
      "line": 1,
      "symbol": "AppService"
    },
    "metrics": {
      "method_count": 25,
      "lines": 800,
      "responsibilities": 6
    },
    "suggestion": "Split into UserService, AuthService, DataService"
  }
]
```

---

## 重构 Patch 输出

### Unified Diff 格式

```diff
--- a/src/services/user.ts
+++ b/src/services/user.ts
@@ -42,50 +42,20 @@
-  async processUserData(user: User, options: Options, context: Context) {
-    // 100+ lines of mixed logic
-    const validated = this.validate(user);
-    const transformed = this.transform(validated);
-    const result = await this.persist(transformed);
-    return result;
-  }
+  async processUserData(user: User, options: Options, context: Context) {
+    const validated = this.validateUser(user, options);
+    const transformed = this.transformUser(validated, context);
+    return this.persistUser(transformed);
+  }
+
+  private validateUser(user: User, options: Options): ValidatedUser {
+    // Extracted validation logic
+  }
+
+  private transformUser(user: ValidatedUser, context: Context): TransformedUser {
+    // Extracted transformation logic
+  }
+
+  private async persistUser(user: TransformedUser): Promise<User> {
+    // Extracted persistence logic
+  }
```

---

## 安全审查输出

### JSON 格式

```json
{
  "safe": false,
  "risk_level": "medium",
  "issues": [
    {
      "type": "behavior_change",
      "severity": "medium",
      "location": "src/services/user.ts:55",
      "description": "Error handling changed - original threw, now returns null",
      "fix": "Maintain original throw behavior or update all callers"
    },
    {
      "type": "missing_test",
      "severity": "low",
      "location": "src/services/user.ts:60",
      "description": "New private method lacks unit test coverage",
      "fix": "Add tests for validateUser method"
    }
  ],
  "recommendations": [
    "Add integration test before applying changes",
    "Review error handling consistency",
    "Consider adding JSDoc comments to new methods"
  ]
}
```

---

## 影响分析输出

### JSON 格式

```json
{
  "target": {
    "file": "src/services/user.ts",
    "symbol": "processUserData",
    "type": "method"
  },
  "references": [
    {
      "file": "src/controllers/userController.ts",
      "line": 25,
      "type": "call"
    },
    {
      "file": "src/services/authService.ts",
      "line": 80,
      "type": "call"
    }
  ],
  "call_chain": {
    "depth": 3,
    "callers": ["UserController.create", "AuthService.register"],
    "callees": ["Database.save", "Logger.info"]
  },
  "risk_assessment": {
    "reference_count": 2,
    "call_depth": 3,
    "test_coverage": "partial",
    "is_public_api": false,
    "cross_module": true,
    "total_score": 5,
    "risk_level": "medium"
  }
}
```

---

## 遗留系统分析输出

### JSON 格式

```json
{
  "architecture_pattern": "monolithic",
  "coupling_hotspots": [
    {
      "module": "src/services",
      "coupling_score": 8.5,
      "dependencies": 15,
      "dependents": 8
    }
  ],
  "migration_seams": [
    {
      "name": "AuthModule",
      "priority": 1,
      "risk": "low",
      "dependencies": 2,
      "effort": "2 weeks"
    }
  ],
  "technical_debt": [
    {
      "type": "outdated_dependency",
      "item": "express@3.x",
      "severity": "high",
      "fix": "Upgrade to express@4.x"
    }
  ],
  "recommended_strategy": "strangler_fig"
}
```

---

## 错误输出

### 格式

```json
{
  "success": false,
  "error": {
    "type": "timeout",
    "message": "Codex CLI timed out after 120s",
    "details": "Consider breaking down the task"
  }
}
```

### 常见错误类型

| 类型                | 描述         | 处理                |
| ------------------- | ------------ | ------------------- |
| `timeout`           | 执行超时     | 拆分任务重试        |
| `parse_error`       | 输出格式错误 | 检查提示词          |
| `sandbox_violation` | 沙箱违规     | 检查 --sandbox 参数 |
| `file_not_found`    | 文件不存在   | 验证文件路径        |
