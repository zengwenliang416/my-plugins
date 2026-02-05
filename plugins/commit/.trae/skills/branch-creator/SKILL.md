---
name: branch-creator
description: |
  【触发】Commit 工作流 Phase 3.5：创建功能分支
  【输出】${run_dir}/branch-info.json + 新分支
  【询问】如果在功能分支上，询问是复用还是创建新分支
---

# Branch Creator

## 输入/输出

| 项目 | 值                                                    |
| ---- | ----------------------------------------------------- |
| 输入 | `${run_dir}/changes-analysis.json` + 可选 branch_name |
| 输出 | `${run_dir}/branch-info.json` + 新分支                |

## 参数

- **run_dir** (必需): 运行目录（包含 changes-analysis.json）
- **branch_name** (可选): 自定义分支名（省略则自动生成）
- **skip_branch** (可选): 跳过分支创建

## 命名规范

格式: `<type>/<scope>-<description>`

| Type | Scope  | Branch                     |
| ---- | ------ | -------------------------- |
| feat | auth   | `feat/auth-add-login`      |
| fix  | button | `fix/button-style-issue`   |
| docs | readme | `docs/readme-update-guide` |

规则: 小写, 连字符, 最多 50 字符, 仅字母数字

## 执行

### 1. 检查当前分支

```bash
git branch --show-current
```

| 当前分支            | 操作                              |
| ------------------- | --------------------------------- |
| main/master/develop | 创建新分支                        |
| 功能分支            | 询问: 复用 / 创建新 / 切换到 main |
| Detached HEAD       | 错误                              |

### 2. 读取分析

从 changes-analysis.json: primary_type, primary_scope, summary

### 3. 生成名称

如果没有自定义名称: `${type}/${scope}-${keywords}`

### 4. 检查冲突

```bash
git show-ref --verify --quiet refs/heads/${name}
```

如果存在 → 询问用户:

- (a) 切换到现有分支
- (b) 重命名 (-v2)
- (c) 删除现有并创建新分支
- (d) 取消

### 5. 创建分支

```bash
git checkout -b ${branch_name}
```

### 6. 写入 branch-info.json

```json
{
  "previous_branch": "main",
  "new_branch": "feat/auth-add-login",
  "branch_type": "created|switched|reused",
  "status": "success"
}
```

## 返回

```
🌿 Branch: ${new_branch}
Previous: ${previous} | Type: ${type} | Scope: ${scope}
Output: ${run_dir}/branch-info.json
```
