---
name: project-scanner
description: |
  【触发条件】扫描项目结构时使用
  【核心产出】${run_dir}/context/project-structure.json（标准格式）
  【不触发】已知项目结构、单独查找某个文件
allowed-tools: Bash, Glob, Read, Write
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（由 orchestrator 传入）
  - name: project_path
    type: string
    required: false
    description: 目标项目路径（默认为当前工作目录）
---

# Project Scanner - 项目结构扫描器

## 职责边界

- **输入**: 项目根路径（当前工作目录）
- **输出**: `.claude/migration/context/project-structure.json`（遵循标准 schema）
- **核心能力**: 快速扫描项目结构，识别所有模块，输出标准格式
- **数据契约**: 参见 `_shared/schemas/project-structure-schema.md`

## 执行流程

### Step 1: 检测项目类型和基本信息

**执行步骤**:

1. 使用 Bash 工具获取项目名称：

   ```bash
   basename "$(pwd)"
   ```

2. 检测项目类型（按顺序检查特征文件）：
   - 如果存在 `pom.xml`：类型为 "Java Maven"
   - 如果存在 `build.gradle` 或 `build.gradle.kts`：类型为 "Java Gradle"
   - 如果存在 `package.json`：类型为 "JavaScript/TypeScript"
   - 如果存在 `go.mod`：类型为 "Go"
   - 如果存在 `requirements.txt` 或 `pyproject.toml`：类型为 "Python"
   - 如果都不存在：类型为 "Unknown"

3. 记录扫描时间（当前 ISO 8601 格式时间）

4. 向用户报告："🔍 检测到 {project_type} 项目，开始扫描模块..."

### Step 2: 扫描项目模块

**执行步骤**:

根据项目类型选择扫描策略：

#### Java 项目（Maven/Gradle）

1. 检查是否为多模块项目：
   - Maven: 使用 Grep 工具在 pom.xml 中搜索 `<module>` 标签
   - Gradle: 使用 Read 工具读取 settings.gradle，查找 `include` 语句

2. 如果是多模块项目：
   - 提取所有子模块名称
   - 为每个子模块创建模块对象：
     ```json
     {
       "name": "子模块名",
       "path": "子模块路径",
       "type": "library"
     }
     ```

3. 如果是单模块项目：
   - 创建单个根模块对象：
     ```json
     {
       "name": "项目名",
       "path": ".",
       "type": "application"
     }
     ```

4. 对于每个模块，使用 Bash 统计代码行数：
   ```bash
   find <module_path>/src -name "*.java" 2>/dev/null -exec wc -l {} + | tail -1
   ```

#### JavaScript/TypeScript 项目

1. 检查是否为 Monorepo：
   - 使用 Read 工具读取 package.json，检查 `workspaces` 字段
   - 或检查是否存在 `lerna.json` 或 `pnpm-workspace.yaml`

2. 如果是 Monorepo：
   - 扫描常见模块目录：`apps/`, `packages/`, `modules/`
   - 使用 Bash 工具列出子目录：
     ```bash
     ls -1 apps 2>/dev/null | grep -v "^\."
     ls -1 packages 2>/dev/null | grep -v "^\."
     ls -1 modules 2>/dev/null | grep -v "^\."
     ```
   - 为每个子目录创建模块对象：
     ```json
     {
       "name": "子目录名",
       "path": "apps/子目录名",
       "type": "application" // apps/* 为 application
     }
     ```
     ```json
     {
       "name": "子目录名",
       "path": "packages/子目录名",
       "type": "library" // packages/* 为 library
     }
     ```
     ```json
     {
       "name": "子目录名",
       "path": "modules/子目录名",
       "type": "library" // modules/* 为 library
     }
     ```

3. 如果是单包项目：
   - 创建单个根模块：
     ```json
     {
       "name": "项目名",
       "path": ".",
       "type": "application"
     }
     ```

4. 对于每个模块，统计代码行数：
   ```bash
   find <module_path> -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" | \
     head -1000 | xargs wc -l 2>/dev/null | tail -1
   ```

#### Python 项目

1. 扫描包结构：
   - 使用 Bash 查找所有包目录（包含 `__init__.py`）：
     ```bash
     find . -name "__init__.py" -exec dirname {} \; | sort -u | head -50
     ```

2. 识别主包（通常在 `src/` 或项目根目录）：
   - 如果存在 `src/` 目录，主包在 `src/` 下
   - 否则主包在根目录下

3. 创建模块对象（每个顶层包一个模块）：

   ```json
   {
     "name": "包名",
     "path": "src/包名" 或 "包名",
     "type": "library"
   }
   ```

4. 统计代码行数：
   ```bash
   find <module_path> -name "*.py" 2>/dev/null -exec wc -l {} + | tail -1
   ```

#### Go 项目

1. Go 项目通常为单模块（扁平结构）：
   - 创建单个根模块：
     ```json
     {
       "name": "项目名",
       "path": ".",
       "type": "service"
     }
     ```

2. 检查是否有 `cmd/` 多应用结构：
   - 使用 Bash 列出 `cmd/` 子目录：
     ```bash
     ls -1 cmd 2>/dev/null | grep -v "^\."
     ```
   - 为每个应用创建模块对象：
     ```json
     {
       "name": "应用名",
       "path": "cmd/应用名",
       "type": "application"
     }
     ```

3. 统计代码行数：
   ```bash
   find . -name "*.go" -not -path "*/vendor/*" 2>/dev/null -exec wc -l {} + | tail -1
   ```

#### Unknown 项目（通用扫描）

1. 扫描常见模块目录结构：

   ```bash
   ls -1 apps 2>/dev/null
   ls -1 modules 2>/dev/null
   ls -1 packages 2>/dev/null
   ls -1 src 2>/dev/null
   ```

2. 为每个找到的子目录创建模块对象：

   ```json
   {
     "name": "目录名",
     "path": "父目录/目录名",
     "type": "other"
   }
   ```

3. 如果没有找到任何模块，创建根模块：
   ```json
   {
     "name": "项目名",
     "path": ".",
     "type": "other"
   }
   ```

### Step 3: 统计项目规模

**执行步骤**:

1. 统计总文件数（排除常见忽略目录）：

   ```bash
   find . -type f \
     -not -path "*/node_modules/*" \
     -not -path "*/target/*" \
     -not -path "*/build/*" \
     -not -path "*/.git/*" \
     -not -path "*/vendor/*" \
     -not -path "*/__pycache__/*" \
     2>/dev/null | wc -l
   ```

2. 根据项目类型统计源码文件：

   **Java**:

   ```bash
   find . -name "*.java" -not -path "*/target/*" 2>/dev/null | wc -l
   ```

   **JavaScript/TypeScript**:

   ```bash
   find . \( -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" \) \
     -not -path "*/node_modules/*" -not -path "*/dist/*" 2>/dev/null | wc -l
   ```

   **Python**:

   ```bash
   find . -name "*.py" -not -path "*/__pycache__/*" 2>/dev/null | wc -l
   ```

   **Go**:

   ```bash
   find . -name "*.go" -not -path "*/vendor/*" 2>/dev/null | wc -l
   ```

3. 统计总代码行数（对应文件类型）：

   ```bash
   find . -name "*.java" -not -path "*/target/*" 2>/dev/null \
     -exec wc -l {} + | tail -1 | awk '{print $1}'
   ```

4. 记录统计结果到内存变量

### Step 4: 生成标准格式 JSON

**执行步骤**:

1. 构建标准 JSON 结构（使用 Step 2 的 modules 数组 + Step 3 的统计数据）：

```json
{
  "schema_version": "1.0",
  "project_name": "<项目名>",
  "project_type": "<检测到的类型>",
  "scan_time": "<ISO 8601 时间>",

  "modules": [
    {
      "name": "<模块名>",
      "path": "<相对路径>",
      "type": "<application|library|service|other>",
      "file_count": <数字，可选>,
      "line_count": <数字，可选>
    }
  ],

  "statistics": {
    "total_files": <总文件数>,
    "total_lines": <总代码行数>,
    "source_files": {
      "java": <Java 文件数>,
      "js": <JavaScript 文件数>,
      "ts": <TypeScript 文件数>,
      "py": <Python 文件数>,
      "go": <Go 文件数>
    }
  },

  "directories": {
    "src": "<源码目录>",
    "test": "<测试目录>",
    "config": "<配置目录>"
  }
}
```

2. 使用 Write 工具将 JSON 写入 `.claude/migration/context/project-structure.json`

3. 向用户报告：
   - "✅ 扫描完成：检测到 {modules_count} 个模块"
   - "📊 统计：{total_files} 个文件，{total_lines} 行代码"

### Step 5: 验证输出

**执行步骤**:

1. 使用 Read 工具读取生成的 JSON 文件

2. 验证关键字段：
   - `modules` 数组存在且长度 > 0
   - 每个模块有 `name`, `path`, `type` 字段
   - `statistics` 对象存在

3. 如果验证失败：
   - 向用户报告错误："❌ JSON 格式验证失败，请检查输出"
   - 显示错误详情

4. 如果验证成功：
   - 向用户报告："✅ 输出验证通过，符合标准 schema"

## 模块类型映射规则

| 目录位置    | 模块类型            | 说明                     |
| ----------- | ------------------- | ------------------------ |
| apps/\*     | application         | 独立应用                 |
| packages/\* | library             | 可复用库                 |
| modules/\*  | library             | 功能模块                 |
| services/\* | service             | 后端服务                 |
| cmd/\*      | application         | Go 应用入口              |
| src/\*      | other               | 源码根目录（单模块项目） |
| .           | application/service | 根目录（单模块项目）     |

## 性能优化

- 使用 `find -maxdepth 2` 限制扫描深度（避免扫描整个依赖树）
- 使用 `head -1000` 限制处理文件数（大型项目采样统计）
- 忽略常见大型目录：node_modules, target, build, vendor, .git
- 批量统计（`wc -l` + `tail -1`）而非逐文件读取

## 输出示例

### JavaScript Monorepo 项目

```json
{
  "schema_version": "1.0",
  "project_name": "g5cloud-pipe-web",
  "project_type": "JavaScript/TypeScript",
  "scan_time": "2026-01-14T10:30:00+08:00",

  "modules": [
    {
      "name": "pipe",
      "path": "apps/pipe",
      "type": "application",
      "file_count": 160,
      "line_count": 26000
    },
    {
      "name": "gdo3",
      "path": "apps/gdo3",
      "type": "application",
      "file_count": 85,
      "line_count": 14000
    },
    {
      "name": "3d",
      "path": "modules/3d",
      "type": "library",
      "file_count": 45,
      "line_count": 8500
    },
    {
      "name": "map",
      "path": "modules/map",
      "type": "library",
      "file_count": 120,
      "line_count": 22000
    }
  ],

  "statistics": {
    "total_files": 1328,
    "total_lines": 175986,
    "source_files": {
      "js": 616,
      "html": 699,
      "css": 245
    }
  },

  "directories": {
    "apps": "apps/",
    "modules": "modules/",
    "lib": "lib/",
    "config": "config/"
  }
}
```

### Java Maven 单模块项目

```json
{
  "schema_version": "1.0",
  "project_name": "legacy-erp",
  "project_type": "Java Maven",
  "scan_time": "2026-01-14T10:30:00+08:00",

  "modules": [
    {
      "name": "legacy-erp",
      "path": ".",
      "type": "application",
      "file_count": 225,
      "line_count": 45678
    }
  ],

  "statistics": {
    "total_files": 1234,
    "total_lines": 45678,
    "source_files": {
      "java": 225,
      "xml": 15
    }
  },

  "directories": {
    "src": "src/main/java",
    "test": "src/test/java",
    "config": "src/main/resources"
  }
}
```

## Gate 检查

执行前检查：

- [ ] 当前目录是项目根目录
- [ ] 有读取文件权限

执行后检查：

- [ ] `modules` 数组非空
- [ ] 至少识别出 1 个模块
- [ ] 所有模块路径存在
- [ ] JSON 格式正确
- [ ] 符合标准 schema

## 失败处理

如果遇到以下情况，报告警告但继续执行：

- 无法识别项目类型 → 使用 "Unknown" 并尝试通用扫描
- 某个模块路径不存在 → 跳过该模块并记录警告
- 统计命令失败 → 使用默认值 0

如果遇到以下情况，报告错误并终止：

- 无法创建输出目录 `.claude/migration/context/`
- 无法写入 JSON 文件
- modules 数组为空（完全无法识别模块）
