---
name: skill-indexer
description: |
  【触发条件】/memory skill-index [path] 或需要索引项目技能时
  【核心产出】.claude/skills/index.json - 技能索引文件
  【专属用途】
    - 扫描指定目录的 SKILL.md 文件
    - 提取技能元数据 (name, description, arguments)
    - 生成结构化索引 JSON
    - 支持增量更新
  【强制工具】Glob, Read
  【不触发】索引已存在且未过期时
allowed-tools:
  - Glob
  - Read
  - Write
arguments:
  - name: path
    type: string
    required: false
    default: "."
    description: 扫描目录路径 (默认当前目录)
  - name: recursive
    type: boolean
    default: true
    description: 是否递归扫描子目录
  - name: force
    type: boolean
    default: false
    description: 强制重新生成索引
---

# Skill Indexer - 技能索引生成器

## 执行流程

```
1. 确定扫描范围
   - 使用指定 path 或默认当前目录
   - 检查是否递归扫描
       │
       ▼
2. 检查现有索引
   - 读取 .claude/skills/index.json
   - 比对文件修改时间
   - 决定是否需要更新
       │
       ▼
3. 扫描 SKILL.md 文件
   Glob("**/SKILL.md")
   - 过滤 node_modules, .git 等
       │
       ▼
4. 提取元数据
   - 解析 YAML frontmatter
   - 提取 name, description, arguments
   - 计算文件 hash
       │
       ▼
5. 生成索引
   - 按类别分组
   - 添加路径信息
   - 写入 index.json
```

## 输出格式

### index.json

```json
{
  "version": "1.0",
  "generated": "2024-01-20T08:00:00Z",
  "root_path": "/path/to/project",
  "skills": [
    {
      "name": "context-loader",
      "path": "plugins/memory/skills/context-loader/SKILL.md",
      "description": "加载项目上下文",
      "category": "memory",
      "arguments": [
        {
          "name": "task",
          "type": "string",
          "required": true
        }
      ],
      "hash": "abc123...",
      "modified": "2024-01-20T07:00:00Z"
    }
  ],
  "categories": {
    "memory": ["context-loader", "session-compactor"],
    "codex": ["codex-cli"],
    "gemini": ["gemini-cli"]
  },
  "metadata": {
    "total_skills": 17,
    "scan_path": "plugins/memory/skills/",
    "scan_time_ms": 150
  }
}
```

## YAML Frontmatter 解析

### 支持字段

```yaml
---
name: skill-name # 必需
description: | # 必需
  技能描述文本
  可以多行
allowed-tools: # 可选
  - Tool1
  - Tool2
arguments: # 可选
  - name: arg1
    type: string
    required: true
    description: 参数描述
---
```

### 解析规则

```
1. 查找 --- 分隔符
2. 提取中间的 YAML 内容
3. 解析为 JavaScript 对象
4. 验证必需字段存在
```

## 分类策略

```
自动分类规则:
├── 路径包含 codex → category: codex
├── 路径包含 gemini → category: gemini
├── 路径包含 exa → category: search
├── 路径包含 doc → category: documentation
├── 路径包含 memory → category: memory
└── 其他 → category: general
```

## 增量更新

### 检测变更

```javascript
function needsUpdate(skill, existingIndex) {
  const existing = existingIndex.skills.find((s) => s.path === skill.path);
  if (!existing) return true; // 新文件
  if (skill.modified > existing.modified) return true; // 已修改
  if (skill.hash !== existing.hash) return true; // 内容变更
  return false;
}
```

### 更新策略

```
--force 未指定时:
├── 读取现有索引
├── 检查每个文件的修改时间
├── 仅重新解析已变更的文件
└── 合并更新到索引

--force 指定时:
└── 完全重新扫描和生成
```

## 过滤规则

### 排除目录

```
node_modules/
.git/
dist/
build/
coverage/
__pycache__/
.next/
.nuxt/
```

### 排除文件

```
*.test.md
*.spec.md
*_backup.md
*.draft.md
```

## 使用示例

```bash
# 索引当前目录
/memory skill-index

# 索引指定路径
/memory skill-index plugins/memory/skills/

# 强制重新生成
/memory skill-index --regenerate

# 非递归扫描
/memory skill-index plugins/ --no-recursive
```

## 输出位置

```
.claude/skills/
├── index.json          # 主索引文件
└── index.backup.json   # 备份 (更新前自动创建)
```

## 错误处理

```
1. SKILL.md 格式错误
   → 记录警告，跳过该文件
   → 在 metadata.errors 中记录

2. 无法读取文件
   → 记录错误路径
   → 继续处理其他文件

3. 写入失败
   → 尝试写入临时文件
   → 提示手动复制
```

## 与其他 Skills 的关系

```
skill-indexer → 生成 index.json
                    │
                    ▼
skill-loader ← 读取 index.json → 按需加载技能内容
```
