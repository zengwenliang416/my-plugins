---
name: workflow-file-validator
description: |
  文件验证器 - 验证工作流产物文件的存在性、格式和内容质量。
  支持 JSON 和 Markdown 格式验证，用于 Orchestrator 的 Gate 检查。
allowed-tools:
  - Bash
skill_type: atomic
domain: shared/workflow
category: validation
output_format: json
arguments:
  - name: file_path
    type: string
    required: true
    description: 要验证的文件路径（绝对或相对路径）
  - name: expected_format
    type: string
    required: false
    description: 期望的文件格式（json/markdown/auto，默认 auto）
  - name: required_fields
    type: string
    required: false
    description: JSON 数组格式的必需字段列表（用于 markdown frontmatter 或 JSON 键验证）
  - name: min_content_lines
    type: integer
    required: false
    description: 最小内容行数（markdown 不含 frontmatter，默认 0）
  - name: strict
    type: boolean
    required: false
    description: 严格模式，警告也视为失败（默认 false）
returns:
  success: boolean (操作是否成功执行)
  valid: boolean (文件是否通过验证)
  errors: array (错误列表)
  warnings: array (警告列表)
  file_info: object {exists, size, extension, format, content_lines, frontmatter}
---

# file-validator - 文件验证器

验证工作流产物文件的完整性和格式正确性，确保每个 Phase 的输出符合预期。

## 核心职责

1. **存在性检查**: 文件是否存在、可读
2. **格式验证**: JSON 结构有效性、Markdown frontmatter 完整性
3. **内容验证**: 最小行数、必需字段
4. **错误报告**: 清晰的错误和警告信息

## 参数说明

### file_path (必需)

文件路径，支持绝对路径和相对路径。

**示例**:

```
.claude/committing/runs/20260114T103000Z/changes-raw.json
/Users/user/project/.claude/debugging/runs/20260114T110000Z/symptom.md
```

### expected_format (可选)

期望的文件格式，用于验证规则选择。

**取值**:

- `auto` (默认): 根据扩展名自动检测
- `json`: 强制 JSON 验证
- `markdown`: 强制 Markdown 验证

### required_fields (可选)

必需字段列表，JSON 数组格式。

**用途**:

- Markdown 文件: 验证 frontmatter 包含指定字段
- JSON 文件: 验证顶层键包含指定字段

**示例**:

```bash
required_fields='["branch","staged","diff_stat"]'  # JSON 文件
required_fields='["topic","difficulty"]'            # Markdown frontmatter
```

### min_content_lines (可选)

最小内容行数（默认 0）。

**规则**:

- Markdown: 不包含 frontmatter 的正文行数
- JSON: 不适用（JSON 文件跳过此检查）

### strict (可选)

严格模式（默认 false）。

**行为**:

- `false`: 只有 errors 导致 valid=false
- `true`: errors 或 warnings 都导致 valid=false

## 输出格式

### 成功场景 (JSON 文件)

```json
{
  "success": true,
  "valid": true,
  "errors": [],
  "warnings": [],
  "file_info": {
    "exists": true,
    "size": 1234,
    "extension": ".json",
    "format": "json",
    "content_lines": null,
    "json_valid": true,
    "json_keys": ["branch", "staged", "diff_stat", "has_staged"]
  }
}
```

### 成功场景 (Markdown 文件)

```json
{
  "success": true,
  "valid": true,
  "errors": [],
  "warnings": ["内容行数较少: 8 行"],
  "file_info": {
    "exists": true,
    "size": 567,
    "extension": ".md",
    "format": "markdown",
    "content_lines": 8,
    "has_frontmatter": true,
    "frontmatter": {
      "topic": "AI 应用",
      "difficulty": "medium"
    }
  }
}
```

### 失败场景

```json
{
  "success": true,
  "valid": false,
  "errors": [
    "文件不存在: .claude/runs/xxx/missing.json",
    "缺少必需字段: branch"
  ],
  "warnings": [],
  "file_info": {
    "exists": false
  }
}
```

## 实现逻辑

```bash
#!/bin/bash
set -euo pipefail

# ==================== 参数解析 ====================

FILE_PATH="${file_path:-}"
EXPECTED_FORMAT="${expected_format:-auto}"
REQUIRED_FIELDS="${required_fields:-[]}"
MIN_CONTENT_LINES="${min_content_lines:-0}"
STRICT="${strict:-false}"

# 验证必需参数
if [ -z "$FILE_PATH" ]; then
    echo '{"success": false, "error": "Missing required argument: file_path"}' >&2
    exit 1
fi

# 初始化结果
ERRORS=()
WARNINGS=()
VALID=true

# ==================== Step 1: 文件存在性检查 ====================

if [ ! -f "$FILE_PATH" ]; then
    echo "{\"success\": true, \"valid\": false, \"errors\": [\"文件不存在: $FILE_PATH\"], \"warnings\": [], \"file_info\": {\"exists\": false}}" | jq '.'
    exit 0
fi

if [ ! -r "$FILE_PATH" ]; then
    echo "{\"success\": true, \"valid\": false, \"errors\": [\"文件不可读: $FILE_PATH\"], \"warnings\": [], \"file_info\": {\"exists\": true}}" | jq '.'
    exit 0
fi

# 获取文件信息
FILE_SIZE=$(stat -f%z "$FILE_PATH" 2>/dev/null || stat -c%s "$FILE_PATH" 2>/dev/null)
FILE_EXT="${FILE_PATH##*.}"

# 检测格式
if [ "$EXPECTED_FORMAT" = "auto" ]; then
    case "$FILE_EXT" in
        json) FORMAT="json" ;;
        md|markdown) FORMAT="markdown" ;;
        *) FORMAT="unknown" ;;
    esac
else
    FORMAT="$EXPECTED_FORMAT"
fi

# ==================== Step 2: 格式特定验证 ====================

JSON_VALID=null
JSON_KEYS=null
HAS_FRONTMATTER=null
FRONTMATTER_JSON=null
CONTENT_LINES=null

if [ "$FORMAT" = "json" ]; then
    # JSON 验证
    if jq empty "$FILE_PATH" 2>/dev/null; then
        JSON_VALID=true
        JSON_KEYS=$(jq -r 'keys | @json' "$FILE_PATH" 2>/dev/null || echo '[]')

        # 验证必需字段
        if [ "$REQUIRED_FIELDS" != "[]" ]; then
            MISSING_FIELDS=$(jq -n \
                --argjson required "$REQUIRED_FIELDS" \
                --argjson keys "$JSON_KEYS" \
                '$required - $keys')

            if [ "$MISSING_FIELDS" != "[]" ]; then
                while IFS= read -r field; do
                    ERRORS+=("缺少必需字段: $field")
                done < <(echo "$MISSING_FIELDS" | jq -r '.[]')
                VALID=false
            fi
        fi
    else
        JSON_VALID=false
        ERRORS+=("无效的 JSON 格式")
        VALID=false
    fi

elif [ "$FORMAT" = "markdown" ]; then
    # Markdown 验证

    # 检查 frontmatter
    if grep -q '^---$' "$FILE_PATH"; then
        HAS_FRONTMATTER=true

        # 提取 frontmatter (简化版，仅提取 key: value 对)
        FRONTMATTER_TEXT=$(sed -n '/^---$/,/^---$/p' "$FILE_PATH" | sed '1d;$d')

        if [ -n "$FRONTMATTER_TEXT" ]; then
            # 转换为 JSON (简化版)
            FRONTMATTER_JSON=$(echo "$FRONTMATTER_TEXT" | awk -F': ' '{
                gsub(/"/, "\\\"", $2);
                printf "\"%s\": \"%s\",\n", $1, $2
            }' | sed '$ s/,$//' | awk 'BEGIN{print "{"} {print} END{print "}"}' | jq -c '.')

            # 验证必需字段
            if [ "$REQUIRED_FIELDS" != "[]" ]; then
                FM_KEYS=$(echo "$FRONTMATTER_JSON" | jq -r 'keys | @json')
                MISSING_FIELDS=$(jq -n \
                    --argjson required "$REQUIRED_FIELDS" \
                    --argjson keys "$FM_KEYS" \
                    '$required - $keys')

                if [ "$MISSING_FIELDS" != "[]" ]; then
                    while IFS= read -r field; do
                        ERRORS+=("frontmatter 缺少字段: $field")
                    done < <(echo "$MISSING_FIELDS" | jq -r '.[]')
                    VALID=false
                fi
            fi
        fi
    else
        HAS_FRONTMATTER=false
        FRONTMATTER_JSON="null"
    fi

    # 统计内容行数（排除 frontmatter）
    CONTENT_LINES=$(sed '/^---$/,/^---$/d' "$FILE_PATH" | grep -c '.' || echo "0")

    # 检查最小行数
    if [ "$CONTENT_LINES" -lt "$MIN_CONTENT_LINES" ]; then
        ERRORS+=("内容行数不足: $CONTENT_LINES < $MIN_CONTENT_LINES")
        VALID=false
    elif [ "$CONTENT_LINES" -lt 10 ] && [ "$MIN_CONTENT_LINES" -eq 0 ]; then
        WARNINGS+=("内容行数较少: $CONTENT_LINES 行")
    fi
fi

# ==================== Step 3: 严格模式处理 ====================

if [ "$STRICT" = "true" ] && [ "${#WARNINGS[@]}" -gt 0 ]; then
    VALID=false
fi

# ==================== Step 4: 构建输出 ====================

# 转换数组为 JSON
ERRORS_JSON=$(printf '%s\n' "${ERRORS[@]}" | jq -R . | jq -s .)
WARNINGS_JSON=$(printf '%s\n' "${WARNINGS[@]}" | jq -R . | jq -s .)

# 构建 file_info
FILE_INFO=$(jq -n \
    --argjson exists true \
    --argjson size "$FILE_SIZE" \
    --arg extension ".$FILE_EXT" \
    --arg format "$FORMAT" \
    --argjson content_lines "$CONTENT_LINES" \
    --argjson has_frontmatter "$HAS_FRONTMATTER" \
    --argjson frontmatter "$FRONTMATTER_JSON" \
    --argjson json_valid "$JSON_VALID" \
    --argjson json_keys "$JSON_KEYS" \
    '{
        exists: $exists,
        size: $size,
        extension: $extension,
        format: $format,
        content_lines: $content_lines,
        has_frontmatter: $has_frontmatter,
        frontmatter: $frontmatter,
        json_valid: $json_valid,
        json_keys: $json_keys
    }')

# 输出最终结果
jq -n \
    --argjson success true \
    --argjson valid "$VALID" \
    --argjson errors "$ERRORS_JSON" \
    --argjson warnings "$WARNINGS_JSON" \
    --argjson file_info "$FILE_INFO" \
    '{
        success: $success,
        valid: $valid,
        errors: $errors,
        warnings: $warnings,
        file_info: $file_info
    }'

exit 0
```

## 在 Orchestrator 中的使用

### Phase 完成后验证

```yaml
Phase 1: 收集变更
  1. 调用 Skill("committing:change-collector", args="run_dir=${RUN_DIR}")
  2. Gate 检查:
     validation = Skill("workflow-file-validator",
                        args="file_path=${RUN_DIR}/changes-raw.json
                              expected_format=json
                              required_fields='[\"branch\",\"staged\",\"has_staged\"]'")
  3. 检查 validation.valid:
     - true: 更新 state.json steps.change-collector.status="done", 继续
     - false: 更新 state.json steps.change-collector.status="failed",
              AskUserQuestion 提供恢复选项
```

### 集成到状态更新流程

```bash
# Orchestrator 中的通用验证模式

validate_phase_output() {
    local phase_name="$1"
    local output_file="$2"
    local required_fields="$3"

    # 调用验证器
    validation=$(Skill("workflow-file-validator",
                       args="file_path=${output_file} required_fields='${required_fields}'"))

    valid=$(echo "$validation" | jq -r '.valid')

    if [ "$valid" = "true" ]; then
        echo "✅ ${phase_name} 输出验证通过"
        return 0
    else
        errors=$(echo "$validation" | jq -r '.errors | join(", ")')
        echo "❌ ${phase_name} 输出验证失败: $errors"
        return 1
    fi
}
```

## 调用示例

### 示例 1: 验证 JSON 文件

```bash
Skill("workflow-file-validator",
     args="file_path=.claude/committing/runs/20260114T103000Z/changes-raw.json expected_format=json required_fields='[\"branch\",\"staged\"]'")
```

**预期输出**:

```json
{
  "success": true,
  "valid": true,
  "errors": [],
  "warnings": [],
  "file_info": {
    "exists": true,
    "size": 1234,
    "extension": ".json",
    "format": "json",
    "json_valid": true,
    "json_keys": ["branch", "staged", "diff_stat", "has_staged"]
  }
}
```

### 示例 2: 验证 Markdown frontmatter

```bash
Skill("workflow-file-validator",
     args="file_path=.claude/writing/runs/20260114T103000Z/analysis.md required_fields='[\"topic\",\"difficulty\"]' min_content_lines=20")
```

**预期输出**:

```json
{
  "success": true,
  "valid": true,
  "errors": [],
  "warnings": [],
  "file_info": {
    "exists": true,
    "size": 567,
    "extension": ".md",
    "format": "markdown",
    "content_lines": 45,
    "has_frontmatter": true,
    "frontmatter": {
      "topic": "AI 在医疗诊断中的应用",
      "difficulty": "medium"
    }
  }
}
```

### 示例 3: 严格模式

```bash
Skill("workflow-file-validator",
     args="file_path=.claude/runs/xxx/draft.md min_content_lines=50 strict=true")
```

**场景**: 文件只有 8 行（触发警告）

**预期输出**:

```json
{
  "success": true,
  "valid": false,
  "errors": ["内容行数不足: 8 < 50"],
  "warnings": [],
  "file_info": {
    "exists": true,
    "size": 123,
    "extension": ".md",
    "format": "markdown",
    "content_lines": 8
  }
}
```

### 示例 4: 自动格式检测

```bash
Skill("workflow-file-validator",
     args="file_path=.claude/runs/xxx/commit-result.json")
```

**行为**: 根据 `.json` 扩展名自动检测为 JSON 格式，执行 JSON 验证。

## 错误处理

### 错误场景 1: 文件不存在

**输出**:

```json
{
  "success": true,
  "valid": false,
  "errors": ["文件不存在: /path/to/missing.json"],
  "warnings": [],
  "file_info": { "exists": false }
}
```

### 错误场景 2: 无效 JSON

**输出**:

```json
{
  "success": true,
  "valid": false,
  "errors": ["无效的 JSON 格式"],
  "warnings": [],
  "file_info": {
    "exists": true,
    "size": 456,
    "extension": ".json",
    "format": "json",
    "json_valid": false
  }
}
```

### 错误场景 3: 缺少必需字段

**输出**:

```json
{
  "success": true,
  "valid": false,
  "errors": ["缺少必需字段: branch", "缺少必需字段: staged"],
  "warnings": [],
  "file_info": {
    "exists": true,
    "size": 234,
    "extension": ".json",
    "format": "json",
    "json_valid": true,
    "json_keys": ["diff_stat"]
  }
}
```

## 设计原则

1. **非破坏性**: 只读验证，不修改文件
2. **清晰反馈**: errors 和 warnings 明确区分
3. **灵活配置**: 支持宽松和严格模式
4. **格式无关**: 统一接口处理 JSON 和 Markdown
5. **可组合**: 可作为 Orchestrator Gate 检查的标准组件

## 约束和限制

1. **不深度解析 YAML**: frontmatter 仅基本提取 key-value，不支持复杂嵌套
2. **不验证内容语义**: 只检查格式和结构，不评估内容质量
3. **macOS/Linux 差异**: stat 命令在不同系统上参数不同（已处理）
4. **大文件性能**: 超大文件（>10MB）可能较慢

## 测试建议

### 单元测试

```bash
# 测试 1: JSON 文件验证
echo '{"branch": "main", "staged": []}' > /tmp/test.json
Skill("workflow-file-validator",
     args="file_path=/tmp/test.json required_fields='[\"branch\"]'")
# 预期: valid=true

# 测试 2: Markdown frontmatter 验证
cat > /tmp/test.md <<EOF
---
topic: Test
difficulty: easy
---

Content here.
EOF
Skill("workflow-file-validator",
     args="file_path=/tmp/test.md required_fields='[\"topic\"]' min_content_lines=1")
# 预期: valid=true

# 测试 3: 文件不存在
Skill("workflow-file-validator",
     args="file_path=/tmp/nonexistent.json")
# 预期: valid=false, errors=["文件不存在..."]

# 测试 4: 严格模式
echo "short" > /tmp/short.md
Skill("workflow-file-validator",
     args="file_path=/tmp/short.md min_content_lines=1 strict=true")
# 预期: valid=true（有内容）
```

## 性能指标

| 指标         | 目标    | 说明                 |
| ------------ | ------- | -------------------- |
| 执行时间     | < 100ms | 小文件（< 1MB）      |
| 内存占用     | < 10MB  | 不加载完整文件到内存 |
| JSON 解析    | < 50ms  | jq 性能              |
| Markdown解析 | < 50ms  | sed/awk 文本处理     |

## 版本历史

- v2.0: 重写为 V2 Contract 标准，支持 JSON 和 Markdown 双格式
- v1.0: 初始实现（仅 Markdown，已归档）

## 参考文档

| 文档                                      | 用途                |
| ----------------------------------------- | ------------------- |
| `docs/orchestrator-contract.md`           | V2 Contract 规范    |
| `skills/shared/workflow/STATE_FILE_V2.md` | state.json 格式     |
| `docs/orchestrator-to-skills-mapping.md`  | Orchestrator 映射表 |
