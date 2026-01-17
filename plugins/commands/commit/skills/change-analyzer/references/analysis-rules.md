# Change Analysis Rules Reference

变更分析规则：类型推断、作用域提取、拆分建议。

---

## 1. 类型推断规则

### 1.1 基于文件变更推断

| 文件变更模式 | 推断类型 | 置信度 |
|--------------|----------|--------|
| 新增功能代码文件 | `feat` | high |
| 修改现有功能代码 | `feat` 或 `fix` | medium |
| 删除代码文件 | `refactor` | high |
| 修改测试文件 | `test` | high |
| 修改文档文件 | `docs` | high |
| 修改配置文件 | `chore` 或 `build` | medium |
| 修改 CI/CD 文件 | `ci` | high |
| 修改样式文件 | `style` | high |

### 1.2 基于语义分析推断

| 语义特征 | 推断类型 |
|----------|----------|
| 添加新接口/API | `feat` |
| 修复错误处理 | `fix` |
| 优化性能 | `perf` |
| 重构代码结构 | `refactor` |
| 添加/更新依赖 | `build` |
| 格式化代码 | `style` |

### 1.3 类型优先级（冲突时）

```
feat > fix > perf > refactor > style > docs > test > chore
```

---

## 2. 作用域提取规则

### 2.1 LSP 符号优先

**优先使用 LSP 提取的符号作为作用域**：

```typescript
// 变更集中在单个类
class AuthService { ... }  → scope: "auth-service"

// 变更集中在单个函数
function validateToken() { ... }  → scope: "auth/validate"

// 变更涉及多个相关符号
AuthService + TokenManager  → scope: "auth"
```

### 2.2 语义分析次优先

**使用 auggie-mcp 识别的功能模块**：

```
"用户认证流程" → scope: "auth"
"支付处理" → scope: "payment"
"数据库连接" → scope: "db"
```

### 2.3 路径推断（降级）

**当 LSP 和语义分析不可用时**：

| 路径模式 | 推断作用域 |
|----------|------------|
| `src/components/*` | `components` |
| `src/services/*` | `services` |
| `src/utils/*` | `utils` |
| `src/api/*` | `api` |
| `packages/core/*` | `core` |
| `apps/web/*` | `web` |

---

## 3. 复杂度评估

### 3.1 评估维度

| 维度 | 低 | 中 | 高 |
|------|----|----|-----|
| 文件数 | ≤3 | ≤10 | >10 |
| 变更行数 | ≤50 | ≤300 | >300 |
| 作用域数 | 1 | 2-3 | >3 |
| 类型数 | 1 | 2 | >2 |

### 3.2 综合评分

```
low: 文件数 ≤3 且 行数 ≤50 且 作用域数 =1
medium: 文件数 ≤10 且 行数 ≤300
high: 文件数 >10 或 行数 >300 或 作用域数 >3
```

---

## 4. 拆分建议规则

### 4.1 触发拆分条件

| 规则 | 触发条件 | 建议操作 |
|------|----------|----------|
| 多作用域 | 涉及 2+ 个不同作用域 | 按作用域拆分 |
| 大变更 | 文件数 >10 或行数 >300 | 按功能拆分 |
| 混合类型 | 同时有 feat + fix | 分别提交 |
| 新增+删除 | 同时有新增和删除 | 考虑拆分 |
| 语义不相关 | auggie-mcp 判断变更语义不相关 | 按语义拆分 |

### 4.2 拆分优先级

```
1. feat 类型优先
2. fix 类型次之
3. refactor/perf 再次
4. docs/test/chore 最后
```

### 4.3 拆分建议格式

```json
{
  "should_split": true,
  "split_recommendation": {
    "reason": "包含多个独立功能，建议拆分为 2 个提交",
    "commits": [
      {
        "type": "feat",
        "scope": "auth-service",
        "files": ["src/auth/AuthService.ts"],
        "description": "新增 token 刷新功能",
        "priority": 1
      },
      {
        "type": "docs",
        "scope": "docs",
        "files": ["docs/README.md"],
        "description": "更新认证文档",
        "priority": 2
      }
    ]
  }
}
```

---

## 5. 置信度评估

### 5.1 评估因素

| 因素 | high | medium | low |
|------|------|--------|-----|
| 作用域 | 单一 | 2 个 | 3+ 个 |
| 类型 | 单一 | 2 个 | 3+ 个 |
| 复杂度 | low | medium | high |
| 语义一致性 | 高度一致 | 部分相关 | 不相关 |

### 5.2 综合置信度

```
high: 单一作用域 + 单一类型 + low 复杂度 + 语义一致
medium: 单一作用域 或 medium 复杂度
low: 多作用域 + high 复杂度 + 语义不一致
```
