# Project Structure JSON Schema

## 目的

定义 migration 领域所有 Skills 共享的标准数据格式，确保 Skills 之间的互操作性。

## 标准格式

```json
{
  "project_name": "string",
  "project_type": "string",
  "scan_time": "ISO-8601 datetime",

  "statistics": {
    "total_files": "number",
    "total_lines": "number",
    "source_files": {
      "js": "number",
      "ts": "number",
      ...
    }
  },

  "modules": [
    {
      "name": "string",
      "path": "string (relative to project root)",
      "type": "application | library | service | component",
      "file_count": "number (optional)",
      "line_count": "number (optional)"
    }
  ],

  "entry_points": {
    "main": "string",
    ...
  },

  "directories": {
    "src": "string",
    "lib": "string",
    "config": "string",
    ...
  }
}
```

## 关键约定

### 1. modules 数组（必需）

**所有可文档化的模块必须在此数组中列出**，包括：

- 应用模块（apps/\*）
- 功能模块（modules/\*）
- 库模块（packages/\*）
- 服务模块（services/\*）

每个模块对象必须包含：

- `name`: 模块名称（唯一标识）
- `path`: 相对项目根目录的路径
- `type`: 模块类型（用于选择文档模板）

### 2. 路径规范

所有路径使用 **Unix 风格相对路径**：

- ✅ `"apps/pipe"`
- ✅ `"modules/3d"`
- ❌ `"./apps/pipe"`（不要前导 ./）
- ❌ `"apps\\pipe"`（不要反斜杠）

### 3. 模块类型枚举

| type        | 描述         | 示例                          |
| ----------- | ------------ | ----------------------------- |
| application | 独立应用模块 | apps/pipe, apps/admin         |
| library     | 可复用库     | packages/utils, lib/core      |
| service     | 后端服务     | services/api, services/auth   |
| component   | UI 组件库    | components/ui, src/components |
| other       | 其他类型     | 业务模块、工具模块            |

## 示例

### 完整示例

```json
{
  "project_name": "g5cloud-pipe-web",
  "project_type": "frontend",
  "scan_time": "2026-01-13T10:00:00+08:00",

  "statistics": {
    "total_files": 1328,
    "total_lines": 175986,
    "source_files": {
      "js": 616,
      "html": 699,
      "css": 245
    }
  },

  "modules": [
    {
      "name": "pipe",
      "path": "apps/pipe",
      "type": "application",
      "file_count": 160,
      "line_count": 26000
    },
    {
      "name": "3d",
      "path": "modules/3d",
      "type": "library",
      "file_count": 45,
      "line_count": 8500
    }
  ],

  "directories": {
    "apps": "apps/",
    "modules": "modules/",
    "lib": "lib/",
    "config": "config/"
  }
}
```

## Skills 使用指南

### project-scanner

**职责**：生成符合此 schema 的 JSON 文件

**输出路径**：`.claude/migration/context/project-structure.json`

**实现要点**：

1. 扫描项目目录结构
2. 识别所有模块目录
3. 将每个模块转换为标准对象
4. 输出标准格式的 JSON

### module-doc-generator

**职责**：读取标准 JSON，为每个模块生成文档

**实现要点**：

1. 读取 `.claude/migration/context/project-structure.json`
2. 提取 `modules` 数组
3. 遍历数组，为每个模块生成 CLAUDE.md

**代码示例**：

```javascript
// 伪代码
const structure = JSON.parse(readFile("project-structure.json"));
for (const module of structure.modules) {
  const docPath = `${module.path}/CLAUDE.md`;
  const doc = generateDoc(module);
  writeFile(docPath, doc);
}
```

### 其他 Skills

所有依赖项目结构的 Skills 都应：

1. 读取 `project-structure.json`
2. 使用标准字段 `modules` 数组
3. 通过 `module.path` 访问模块路径
4. 通过 `module.type` 判断模块类型

## 版本控制

当前版本：**v1.0**

如需修改 schema，必须：

1. 更新版本号
2. 在 JSON 中添加 `"schema_version": "1.0"` 字段
3. 更新所有依赖 Skills
4. 记录变更历史

## 兼容性策略

如果遇到旧格式的 project-structure.json：

**选项 A（推荐）**：重新运行 project-scanner 生成新格式

**选项 B**：Skill 内部转换（临时方案）

```
读取旧格式 → 转换为标准格式 → 继续处理
```

**不推荐**：修改 Skill 适配各种格式（导致维护噩梦）
