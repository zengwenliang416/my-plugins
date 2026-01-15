---
name: pptx
description: |
  【触发条件】当用户要求处理 PPT 演示文稿（创建/编辑/分析 .pptx 文件）时使用。
  【触发关键词】PPT、演示文稿、幻灯片、pptx、创建 PPT、编辑 PPT
  【核心能力】创建新演示文稿、修改内容、调整布局、添加批注和演讲者备注
  【不触发】中文演讲场景的 PPT（改用 speech-ppt-unified-style）、纯文档写作
  【先问什么】若缺少：PPT 主题、页数、风格偏好，先提问补齐
license: Proprietary. LICENSE.txt has complete terms
---

# PPTX 演示文稿处理

## 工作流程

```
1. 分析需求 → 2. 选择工作流 → 3. 执行操作 → 4. 视觉验证
```

---

## 任务路由

| 任务类型             | 工作流                           | 参考文档        |
| -------------------- | -------------------------------- | --------------- |
| 读取文本内容         | `python -m markitdown file.pptx` | -               |
| 读取备注/评论/布局   | 解压 XML → 读取                  | ooxml.md        |
| 创建新 PPT（无模板） | HTML → PPTX 转换                 | html2pptx.md    |
| 创建新 PPT（有模板） | 模板复制 → 替换内容              | 本文档 Step 4-7 |
| 编辑现有 PPT         | 解压 → 编辑 XML → 打包           | ooxml.md        |

---

## 设计原则

**创建 PPT 前必须**：

1. 分析内容主题，选择匹配的配色
2. 只使用安全字体：Arial, Helvetica, Times New Roman, Georgia, Courier New, Verdana, Tahoma, Trebuchet MS, Impact
3. 确保文字可读性（对比度、字号）

**设计参考**：读取 `references/design-options.md`

---

## 创建 PPT（无模板）

### 工作流

1. **必读**：完整阅读 `html2pptx.md`（语法规则）
2. 创建 HTML 文件（720pt × 405pt for 16:9）
3. 运行 `scripts/html2pptx.js` 转换
4. 生成缩略图验证：`python scripts/thumbnail.py output.pptx`
5. 检查问题并迭代修复

---

## 创建 PPT（使用模板）

### Step 1: 分析模板

```bash
# 提取文本
python -m markitdown template.pptx > template-content.md

# 生成缩略图
python scripts/thumbnail.py template.pptx
```

### Step 2: 创建模板清单

创建 `template-inventory.md`：

```markdown
# Template Inventory

**Total Slides: [count]**
**注意：幻灯片 0-indexed（第一张 = 0）**

## 布局分类

- Slide 0: 封面
- Slide 1: 标题+正文
- ...
```

### Step 3: 规划大纲

创建 `outline.md`：

- 匹配布局与内容（单栏/双栏/三栏）
- 不要选择占位符多于内容的布局
- 创建模板映射：`[0, 34, 34, 50, 54]`

### Step 4: 重排幻灯片

```bash
python scripts/rearrange.py template.pptx working.pptx 0,34,34,50,52
```

### Step 5: 提取文本库存

```bash
python scripts/inventory.py working.pptx text-inventory.json
```

### Step 6: 准备替换内容

创建 `replacement-text.json`：

```json
{
  "slide-0": {
    "shape-0": {
      "paragraphs": [{ "text": "新标题", "bold": true, "alignment": "CENTER" }]
    }
  }
}
```

**格式要点**：

- `bullet: true` 时添加 `level: 0`，不要手动加 • 符号
- 未列出的 shape 会被自动清空

### Step 7: 应用替换

```bash
python scripts/replace.py working.pptx replacement-text.json output.pptx
```

---

## 编辑现有 PPT

详细指南：完整阅读 `ooxml.md`

```bash
# 解压
python ooxml/scripts/unpack.py file.pptx output_dir

# 编辑 XML（ppt/slides/slide{N}.xml）

# 验证
python ooxml/scripts/validate.py output_dir --original file.pptx

# 打包
python ooxml/scripts/pack.py output_dir new_file.pptx
```

---

## 工具脚本

| 脚本                        | 用途                 |
| --------------------------- | -------------------- |
| `scripts/html2pptx.js`      | HTML → PPTX 转换     |
| `scripts/thumbnail.py`      | 生成缩略图网格       |
| `scripts/rearrange.py`      | 重排/复制/删除幻灯片 |
| `scripts/inventory.py`      | 提取文本库存         |
| `scripts/replace.py`        | 批量替换文本         |
| `ooxml/scripts/unpack.py`   | 解压 PPTX            |
| `ooxml/scripts/pack.py`     | 打包 PPTX            |
| `ooxml/scripts/validate.py` | 验证 XML             |

---

## 参考文档导航

| 需要               | 读取                           |
| ------------------ | ------------------------------ |
| 色彩方案、布局技巧 | `references/design-options.md` |
| HTML→PPTX 语法     | `html2pptx.md`                 |
| OOXML 编辑指南     | `ooxml.md`                     |

---

## 依赖

- markitdown: `pip install "markitdown[pptx]"`
- pptxgenjs: `npm install -g pptxgenjs`
- playwright: `npm install -g playwright`
- sharp: `npm install -g sharp`
- LibreOffice: `sudo apt-get install libreoffice`
- poppler-utils: `sudo apt-get install poppler-utils`
- defusedxml: `pip install defusedxml`
