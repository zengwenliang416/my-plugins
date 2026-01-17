---
name: image-analyzer
description: |
  【触发条件】UI/UX 设计工作流：用户提供参考图片时，使用 Gemini 分析图片设计元素
  【核心产出】输出 ${run_dir}/image-analysis.md，包含图片设计分析（颜色、布局、字体、组件）
  【不触发】没有提供图片的场景
  【先问什么】image_path 参数缺失时，询问参考图片的路径
  【🚨 强制】必须使用 gemini 命令 skill 分析图片，不可跳过
  【依赖】gemini 命令（参考 skills/gemini-cli/references/recipes.md）
allowed-tools:
  - Read
  - Write
  - Bash
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（由 command 传入）
  - name: image_path
    type: string
    required: true
    description: 参考图片的绝对路径
---

# Image Analyzer - 图片设计分析技能

## 🚨 强制执行规则

**禁止行为**：
- ❌ 跳过 gemini 命令调用
- ❌ 自己猜测图片内容
- ❌ 串行执行分析任务（必须并行）
- ❌ 只做一次分析就结束

**必须遵守**：
- ✅ 使用 `codeagent-wrapper gemini` 进行图片分析
- ✅ **并行启动 8 个 Gemini 分析任务**（使用 `run_in_background=true`）
- ✅ 等待所有后台任务完成后综合分析
- ✅ 生成结构化分析文档

---

## 职责边界

- **输入**: 图片文件路径
- **输出**: `${run_dir}/image-analysis.md`
- **核心能力**: 编排 gemini 多轮视觉分析 + 设计元素整合
- **依赖**: `gemini` 命令（参考其 recipes.md 获取 prompt 模板）

---

## 执行流程

### Step 1: 验证图片文件

```bash
# 检查图片文件是否存在
if [ ! -f "${image_path}" ]; then
    echo "❌ 错误: 图片文件不存在: ${image_path}"
    exit 1
fi

# 检查文件类型
file_type=$(file --mime-type -b "${image_path}")
if [[ ! "$file_type" =~ ^image/ ]]; then
    echo "❌ 错误: 不是有效的图片文件: ${file_type}"
    exit 1
fi

# 复制图片到运行目录
cp "${image_path}" "${run_dir}/reference-image.$(basename ${image_path##*.})"
```

### Step 2: 🚨 并行启动 8 个分析任务

**必须使用 `run_in_background=true` 并行启动所有分析任务**：

| 任务 | 分析维度 | 提示词模板 |
|------|----------|------------|
| Task 1 | 整体风格 + 布局结构 | [analysis-dimensions.md#round-1](references/analysis-dimensions.md#round-1-整体风格--布局) |
| Task 2 | 完整配色系统 | [analysis-dimensions.md#round-2](references/analysis-dimensions.md#round-2-完整配色系统) |
| Task 3 | 字体排版系统 | [analysis-dimensions.md#round-3](references/analysis-dimensions.md#round-3-字体排版系统) |
| Task 4 | 间距系统 | [analysis-dimensions.md#round-4](references/analysis-dimensions.md#round-4-间距系统) |
| Task 5 | UI 组件识别 | [analysis-dimensions.md#round-5](references/analysis-dimensions.md#round-5-ui-组件识别) |
| Task 6 | 交互状态 | [analysis-dimensions.md#round-6](references/analysis-dimensions.md#round-6-交互状态) |
| Task 7 | 图标系统 | [analysis-dimensions.md#round-7](references/analysis-dimensions.md#round-7-图标系统) |
| Task 8 | 细节系统（圆角/阴影/边框） | [analysis-dimensions.md#round-8](references/analysis-dimensions.md#round-8-细节系统) |

**🚨 执行方式**：在**单个消息**中发起 8 个 Bash 工具调用，**每个必须设置 `run_in_background=true`**

**命令格式**：
```bash
~/.claude/bin/codeagent-wrapper gemini --file "${image_path}" --prompt "${prompt_N}"
```

**⚠️ 重要**：
- **必须** 在每个 Bash 调用中设置 `run_in_background=true`，否则会串行执行
- `--file` 参数传递图片路径，wrapper 会自动转换为 Gemini 的 `@` 语法
- 每个任务独立会话（不共享 SESSION_ID）
- 记录每个后台任务的 `task_id`，用于 Step 3 获取结果

### Step 3: 等待所有任务完成

使用 `TaskOutput` 工具获取每个后台任务的结果（可并行获取）：

```
TaskOutput(task_id="task_1_id", block=true)  # 整体风格 + 布局
TaskOutput(task_id="task_2_id", block=true)  # 配色系统
TaskOutput(task_id="task_3_id", block=true)  # 字体排版
TaskOutput(task_id="task_4_id", block=true)  # 间距系统
TaskOutput(task_id="task_5_id", block=true)  # UI 组件
TaskOutput(task_id="task_6_id", block=true)  # 交互状态
TaskOutput(task_id="task_7_id", block=true)  # 图标系统
TaskOutput(task_id="task_8_id", block=true)  # 细节系统
```

将结果分别保存到：
- `gemini_round1` - 整体风格 + 布局结构
- `gemini_round2` - 完整配色系统
- `gemini_round3` - 字体排版系统
- `gemini_round4` - 间距系统
- `gemini_round5` - UI 组件识别
- `gemini_round6` - 交互状态
- `gemini_round7` - 图标系统
- `gemini_round8` - 细节系统

### Step 4: Claude 综合分析

基于 Gemini 的 8 个并行分析结果，Claude 需要：

1. **验证一致性**: 检查 8 个分析结果是否互相一致
2. **补充细节**: 对模糊的描述进行具体化
3. **转换为可执行规格**: 将描述转换为 Tailwind/CSS 可用的值
4. **识别设计模式**: 归纳出可复用的设计模式
5. **推荐图标库**: 根据图标风格推荐最匹配的图标库

> 📚 Claude 分析框架见 [references/analysis-dimensions.md](references/analysis-dimensions.md#3-claude-综合分析要点)

### Step 5: 生成分析文档

**输出**：`${run_dir}/image-analysis.md`

> 📚 完整文档模板见 [references/analysis-dimensions.md](references/analysis-dimensions.md#2-输出文档模板)

---

## 返回值

```json
{
  "status": "success",
  "output_file": "${run_dir}/image-analysis.md",
  "analysis_rounds": 5,
  "extracted_info": {
    "style_type": "Modern SaaS Dashboard",
    "color_count": 5,
    "component_count": 12,
    "font_family": "Inter",
    "layout_type": "Sidebar + Content",
    "icon_library": "Lucide"
  }
}
```

---

## 约束

- **🚨 必须使用 gemini 命令分析图片**
- **🚨 必须并行启动 8 个分析任务**
- **🚨 必须保存所有 Gemini 原始回答**
- 不自己猜测图片内容
- 输出的颜色值必须转换为 HEX 格式
- 输出的字体大小必须转换为 px 或 rem

## 验证检查点

- [ ] 8 个 Gemini 后台任务全部完成
- [ ] `${run_dir}/image-analysis.md` 已生成
- [ ] 文档包含配色系统表格
- [ ] 文档包含间距系统规律
- [ ] 文档包含组件清单
- [ ] 文档包含交互状态
- [ ] 文档包含图标系统部分
- [ ] 文档包含 8 个 Gemini 原始记录

**如果任一检查失败，必须重新执行！**
