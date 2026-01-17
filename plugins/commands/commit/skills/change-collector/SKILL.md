---
name: change-collector
description: |
  【触发条件】commit 工作流第一步：收集 git 变更信息。
  【核心产出】输出 ${run_dir}/changes-raw.json，包含暂存变更、未暂存变更、统计信息。
  【不触发】分析变更（用 change-analyzer）、生成消息（用 message-generator）。
  【先问什么】当前目录不是 Git 仓库时，询问是否初始化
allowed-tools:
  - Bash
  - Write
  - AskUserQuestion
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（由 commit command 传入）
---

# Change Collector - 变更收集原子技能

## 职责边界

- **输入**: `run_dir`
- **输出**: `${run_dir}/changes-raw.json`
- **单一职责**: 只收集 git 变更数据，不做分析

---

## 执行流程

### Step 1: 创建运行目录

```bash
mkdir -p ${run_dir}
```

### Step 2: 检查 Git 仓库状态

```bash
# 验证是否在 Git 仓库中
git rev-parse --is-inside-work-tree
```

**如果不是 Git 仓库**，使用 AskUserQuestion 询问：

```
问题: 当前目录不是 Git 仓库，是否需要初始化？
选项:
  - 初始化新仓库 (git init)
  - 取消操作
```

**如果用户选择初始化**：
```bash
git init
```

**继续获取分支信息**：
```bash
# 获取当前分支
git branch --show-current
```

**注意**：新仓库可能没有分支（无提交），此时 branch 为空，记录为 `"branch": null`

### Step 3: 收集变更信息

执行以下 git 命令：

```bash
# 1. 获取文件状态（porcelain 格式）
git status --porcelain

# 2. 获取暂存区 diff 统计
git diff --staged --numstat

# 3. 获取暂存区文件列表
git diff --staged --name-status
```

### Step 4: 解析并构建 JSON

根据 git 输出，构建以下结构的 JSON：

```json
{
  "timestamp": "2026-01-16T10:30:00Z",
  "branch": "main",
  "staged": [
    {
      "status": "M",
      "path": "src/utils/helper.ts",
      "type": "modified",
      "file_type": "typescript",
      "scope": "utils"
    }
  ],
  "unstaged": [],
  "untracked": [],
  "diff_stat": {
    "files_changed": 2,
    "insertions": 45,
    "deletions": 12
  },
  "has_staged": true,
  "has_unstaged": false,
  "has_untracked": true
}
```

**字段说明：**

| 字段 | 说明 |
|------|------|
| `status` | Git 状态码（M=修改, A=新增, D=删除, R=重命名） |
| `type` | 变更类型（modified, added, deleted, renamed） |
| `file_type` | 文件类型（根据扩展名：ts→typescript, py→python 等） |
| `scope` | 作用域（路径第二级目录，如 src/components/Foo.tsx → components） |

### Step 5: 写入结果

使用 Write 工具将 JSON 写入 `${run_dir}/changes-raw.json`

---

## 文件类型映射

| 扩展名 | file_type |
|--------|-----------|
| ts, tsx | typescript |
| js, jsx | javascript |
| py | python |
| go | go |
| rs | rust |
| md, mdx | markdown |
| json | json |
| yaml, yml | yaml |
| sh, bash | shell |
| 其他 | other |

## Git 状态码映射

| 状态码 | type |
|--------|------|
| `M` | modified |
| `A` | added |
| `D` | deleted |
| `R` | renamed |
| `C` | copied |
| `??` | untracked |

---

## 返回值

执行完成后，返回：

```
📊 变更收集完成

分支: ${branch}
已暂存: ${staged_count} 个文件
未暂存: ${unstaged_count} 个文件
未跟踪: ${untracked_count} 个文件
变更统计: +${insertions}/-${deletions} 行

输出: ${run_dir}/changes-raw.json
```

---

## 错误处理

| 情况 | 处理 |
|------|------|
| 不是 Git 仓库 | 询问用户是否初始化，用户拒绝则退出 |
| 没有暂存变更 | 正常输出，has_staged=false |
| git 命令失败 | 报错退出 |
| 新仓库无分支 | 正常输出，branch=null |

---

## 约束

- 不做变更分析（交给 change-analyzer）
- 不生成提交消息（交给 message-generator）
- 只收集数据，保持原子性
