# 示例输出：AI 编程大赛项目汇报避坑指南

## 整体结构概览

| 页码 | 类型       | 标题                         |
| ---- | ---------- | ---------------------------- |
| 1    | cover      | AI 编程大赛项目汇报避坑指南  |
| 2    | story      | 一个真实的翻车故事           |
| 3    | overview   | 两大类问题：内容 vs 表达     |
| 4    | pitfall    | 深坑一：痛点不痛             |
| 5    | solution   | 正确做法：讲一个「人」的故事 |
| 6    | pitfall    | 深坑二：解决方案自说自话     |
| 7    | solution   | 正确做法：填空公式           |
| 8    | pitfall    | 深坑三：价值空洞             |
| 9    | comparison | 前后对比：用数据说话         |
| 10   | pitfall    | 雷区一：PPT 当成演讲稿       |
| 11   | comparison | 错误 vs 正确：PPT 排版对比   |
| 12   | pitfall    | 雷区二：语言技术化           |
| 13   | pitfall    | 雷区三：缺乏故事线           |
| 14   | structure  | 黄金圈结构：Why → How → What |
| 15   | pitfall    | 雷区四：演示环节薄弱         |
| 16   | demo       | 演示策略：录屏优先           |
| 17   | summary    | 避坑 Checklist               |
| 18   | cta        | 下一步：重构你的 PPT         |

---

## 逐页详细输出

### Slide 1

```yaml
slide_index: 1
slide_type: cover
title: AI 编程大赛项目汇报避坑指南
subtitle: 从内容构思到表达呈现的完整攻略
key_points:
  - 内容构思的三大深坑
  - 表达呈现的四大雷区
  - 可复用的避坑 Checklist
speaker_notes:
  - 各位评委老师、同学们大家好
  - 今天我要分享的是项目汇报中最常见的7个坑
  - 这些坑我自己踩过，也看别人踩过
  - 希望今天的分享能帮大家在路演中少走弯路
visual_layout_hint: 中央大标题，副标题居下，背景有舞台/路演场景
image_prompt: >
  扁平插画风格，一位自信的演讲者站在路演舞台上，
  背后是大屏幕显示项目标题，台下有评委席和观众席，
  演讲者姿态自信有感染力，聚光灯聚焦在演讲者身上，
  主色调蓝紫和浅灰，线条简洁，科技商务风
```

---

### Slide 2

```yaml
slide_index: 2
slide_type: story
title: 一个真实的翻车故事
subtitle: 明明做得不错，为什么评委不买账？
key_points:
  - 项目功能完整，技术过硬
  - 汇报时评委频频皱眉
  - 最终排名远低于预期
speaker_notes:
  - 去年有个团队，项目是用 AI 做合同审查
  - 技术实现得很漂亮，功能也很完整
  - 但汇报完，评委问了一句：所以这个东西解决什么问题？
  - 团队愣住了，支支吾吾说不清楚
  - 最终排名倒数第三
  - 问题出在哪？不是技术，是表达
visual_layout_hint: 左侧人物困惑表情，右侧简要故事要点
image_prompt: >
  扁平插画风格，一位年轻参赛者站在台上表情困惑，
  台下评委席上有三位评委，表情严肃微微皱眉，
  场景是比赛路演现场，气氛略显紧张，
  主色调蓝紫和浅灰，线条简洁，科技商务风
```

---

### Slide 3

```yaml
slide_index: 3
slide_type: overview
title: 两大类问题：内容 vs 表达
subtitle: 项目汇报失败的根源
key_points:
  - 内容构思：写什么？三大深坑
  - 表达呈现：怎么讲？四大雷区
speaker_notes:
  - 项目汇报的问题可以分成两大类
  - 第一类是内容构思问题：你写的内容本身有问题
  - 第二类是表达呈现问题：内容还行但讲不清楚
  - 接下来我们逐个拆解
visual_layout_hint: 左右两列对比结构，左边三大深坑，右边四大雷区
image_prompt: >
  简洁的分类结构图，左侧标注"内容构思"下方列出三个圆角矩形，
  右侧标注"表达呈现"下方列出四个圆角矩形，
  中间用分隔线区分，整体呈现问题地图，
  主色调蓝紫渐变，浅灰背景，扁平设计风格
```

---

### Slide 4

```yaml
slide_index: 4
slide_type: pitfall
title: 深坑一：痛点不痛
subtitle: 评委为什么没感觉？
key_points:
  - 只说"效率低、体验差"这类空话
  - 缺少具体人物、场景和任务
  - 没有数据支撑，项目价值模糊
speaker_notes:
  - 很多同学描述痛点就一句话：现在效率很低
  - 评委听完没有任何画面感
  - 效率低？低多少？谁的效率低？在什么场景下低？
  - 这些问题答不上来，痛点就不痛
visual_layout_hint: 左侧展示错误示例（空洞表述），右侧留白给正确做法
image_prompt: >
  扁平插画风格，一位评委坐在桌前表情疑惑，
  面前有打分表和笔，旁边有一个大大的问号气泡，
  场景是评审会议室，气氛是困惑和不解，
  主色调蓝紫和浅灰，线条简洁，科技商务风
```

---

### Slide 5

```yaml
slide_index: 5
slide_type: solution
title: 正确做法：讲一个「人」的故事
subtitle: 谁 + 在哪 + 做什么 + 多难
key_points:
  - 角色：财务部张姐
  - 场景：月底结算期
  - 任务：核对上千张发票
  - 数据：错误率 5%，加班 3 天
speaker_notes:
  - 正确的痛点描述是讲一个人的故事
  - 比如：财务部张姐，每月底要核对上千张发票
  - 眼花缭乱，经常出错，错误率高达 5%
  - 每次都要加班 3 天，员工怨声载道
  - 听到这里，评委能看到画面了
visual_layout_hint: 四象限结构展示四个要素
image_prompt: >
  扁平插画风格，一位疲惫的财务人员坐在办公桌前，
  被成堆发票和文件包围，桌上有计算器和电脑屏幕，
  表情焦虑和疲惫，背景是略显压迫感的办公室环境，
  主色调蓝紫和浅灰，线条简洁，科技商务风
```

---

### Slide 6

```yaml
slide_index: 6
slide_type: pitfall
title: 深坑二：解决方案自说自话
subtitle: 评委：所以你到底解决了什么？
key_points:
  - 只说"用了 AI 大模型"
  - 堆技术参数，不讲业务逻辑
  - 说不清 AI 在哪个环节发挥作用
speaker_notes:
  - 另一个常见问题是解决方案自说自话
  - 很多同学上来就说：我们用了 GPT-4，用了 RAG
  - 评委问：所以呢？
  - 你要说清楚：在什么业务环节，用 AI 做什么事
visual_layout_hint: 展示错误示例的技术堆砌
image_prompt: >
  扁平插画风格，一位程序员站在白板前讲解，
  白板上写满了技术术语和框架名称，
  台下评委表情茫然，一脸问号，
  场景是技术汇报会议室，
  主色调蓝紫和浅灰，线条简洁，科技商务风
```

---

### Slide 7

```yaml
slide_index: 7
slide_type: solution
title: 正确做法：填空公式
subtitle: 在【环节】用【工具】做【动作】得【结果】
key_points:
  - 在【合同审查环节】
  - 为解决【条款遗漏风险】
  - 用【AI 助手】来【自动识别并标注风险条款】
  - 使【审查时间】从 3 小时缩短到 10 分钟
speaker_notes:
  - 我教大家一个填空公式
  - 在某业务环节，为解决某具体问题
  - 我们用 AI 来做什么具体动作
  - 使关键指标从 A 提升到 B
  - 把这四个空填上，方案就清晰了
visual_layout_hint: 填空公式模板，高亮可填内容
image_prompt: >
  简洁的填空公式图，四个圆角矩形横向排列，
  每个矩形内有可填空的提示文字，
  用箭头连接表示逻辑流转，
  主色调蓝紫渐变，浅灰背景，扁平设计风格
```

---

### Slide 8

```yaml
slide_index: 8
slide_type: pitfall
title: 深坑三：价值空洞
subtitle: "效果很好"不是数据
key_points:
  - 使用"大大提升""显著改善"等空话
  - 没有前后对比数据
  - 成果不可衡量，可信度低
speaker_notes:
  - 第三个坑是价值空洞
  - 很多同学说：我们的方案效果很好
  - 评委问：好多少？跟之前比呢？
  - 没有数据，就没有可信度
visual_layout_hint: 展示空洞表述的错误示例
image_prompt: >
  扁平插画风格，一个大大的气球上写着"效果很好"，
  气球是空心的半透明状态，显得很虚浮，
  背景是简洁的办公环境，
  主色调蓝紫和浅灰，线条简洁，科技商务风
```

---

### Slide 9

```yaml
slide_index: 9
slide_type: comparison
title: 用数据说话：前后对比
subtitle: 让评委一眼看到价值
key_points:
  - 审查时间：3 小时 → 10 分钟
  - 错误率：5% → 0.1%
  - 年节省成本：20 万元
speaker_notes:
  - 正确的做法是用数据说话
  - 像这样：审查时间从 3 小时缩短到 10 分钟
  - 错误率从 5% 降到 0.1%
  - 预计每年节省 20 万人力成本
  - 数据一列出来，价值一目了然
visual_layout_hint: 左右对比表格或条形图
image_prompt: >
  简洁的前后对比图表，左侧标注"改进前"用浅红色，
  右侧标注"改进后"用浅绿色，
  中间用条形图展示数值对比，箭头指向改进方向，
  主色调蓝紫和浅灰，扁平商务风格
```

---

### Slide 10

```yaml
slide_index: 10
slide_type: pitfall
title: 雷区一：PPT 当成演讲稿
subtitle: 评委在看字，没在听你讲
key_points:
  - PPT 上密密麻麻全是文字
  - 演讲者照着 PPT 念
  - 评委注意力被文字分散
speaker_notes:
  - 接下来讲表达呈现的四大雷区
  - 第一个雷区：把 PPT 当成演讲稿
  - PPT 上写满了字，演讲者就照着念
  - 结果评委在看字，根本没听你在说什么
visual_layout_hint: 展示文字过多的错误 PPT 示例
image_prompt: >
  扁平插画风格，一个投影屏幕上显示密密麻麻的文字，
  演讲者站在旁边低头看屏幕照着念，
  台下评委表情疲惫，有人在打哈欠，
  主色调蓝紫和浅灰，线条简洁，科技商务风
```

---

### Slide 11

```yaml
slide_index: 11
slide_type: comparison
title: 错误 vs 正确：PPT 排版对比
subtitle: 一页一观点，多用图少用字
key_points:
  - 错误：整页文字，信息堆砌
  - 正确：关键词 + 图表，一目了然
  - 原则：观众 3 秒能抓住重点
speaker_notes:
  - 左边是错误示例：密密麻麻全是字
  - 右边是正确示例：只有关键词和图
  - 记住：观众应该在 3 秒内抓住这页的重点
  - 如果做不到，就是字太多了
visual_layout_hint: 左右对比两种 PPT 风格
image_prompt: >
  左右对比结构图，左侧是文字密集的 PPT 缩略图标红叉，
  右侧是简洁图表化的 PPT 缩略图标绿勾，
  中间用分隔线区分，
  主色调蓝紫和浅灰，扁平设计风格
```

---

### Slide 12

```yaml
slide_index: 12
slide_type: pitfall
title: 雷区二：语言技术化
subtitle: 非技术评委：你在说什么？
key_points:
  - 满口 Transformer、RAG、多模态
  - 假设评委都懂技术
  - 结果：大部分评委听不懂
speaker_notes:
  - 第二个雷区是语言技术化
  - 很多同学张嘴就是 Transformer、RAG
  - 但评委不一定都是技术背景
  - 你要学会说人话、打比方
  - 比如：我们的 AI 就像一个不知疲倦的超级助理
visual_layout_hint: 展示技术术语 vs 比喻对比
image_prompt: >
  扁平插画风格，左侧是一个人说话，嘴边有技术术语气泡，
  右侧是评委表情困惑，头顶有问号，
  场景是汇报会议室，
  主色调蓝紫和浅灰，线条简洁，科技商务风
```

---

### Slide 13

```yaml
slide_index: 13
slide_type: pitfall
title: 雷区三：缺乏故事线
subtitle: 流水账让人记不住
key_points:
  - 按时间顺序讲：第一步、第二步...
  - 没有起承转合
  - 评委听完不知道重点是什么
speaker_notes:
  - 第三个雷区是缺乏故事线
  - 很多同学就是流水账：我们先做了这个，然后做了那个
  - 听完之后，评委记不住任何东西
  - 好的汇报要有故事线
visual_layout_hint: 展示流水账 vs 故事线对比
image_prompt: >
  扁平插画风格，一条直线上标注"步骤1、步骤2、步骤3"显得单调，
  下方是一条波浪起伏的曲线表示故事线，
  曲线标注"问题-方案-成果"更有节奏感，
  主色调蓝紫和浅灰，线条简洁，科技商务风
```

---

### Slide 14

```yaml
slide_index: 14
slide_type: structure
title: 黄金圈结构：Why → How → What
subtitle: 让评委跟着你的思路走
key_points:
  - Why：为什么做？（痛点故事）
  - How：怎么做？（方案与 AI 应用）
  - What：结果如何？（量化成果）
speaker_notes:
  - 推荐使用黄金圈结构
  - 先讲 Why：为什么要做这个项目？痛点是什么？
  - 再讲 How：我们怎么解决？AI 在哪发挥作用？
  - 最后讲 What：结果如何？数据说话
  - 这个结构让评委跟着你的思路走
visual_layout_hint: 三个同心圆展示 Why-How-What
image_prompt: >
  三个同心圆结构图，最内圈写 Why，中间圈写 How，最外圈写 What，
  从内到外用箭头连接表示逻辑递进，
  每个圈用不同深浅的蓝紫色区分，
  主色调蓝紫渐变，浅灰背景，扁平设计风格
```

---

### Slide 15

```yaml
slide_index: 15
slide_type: pitfall
title: 雷区四：演示环节薄弱
subtitle: 静态截图 ≠ 真实演示
key_points:
  - 只有静态截图，没有动态展示
  - 现场演示经常卡顿翻车
  - 评委质疑项目真实性
speaker_notes:
  - 最后一个雷区是演示环节薄弱
  - 有的同学只放截图，评委不确定功能是否真的能用
  - 有的同学现场演示，结果网络卡了、程序崩了
  - 两种情况都很尴尬
visual_layout_hint: 展示演示翻车的场景
image_prompt: >
  扁平插画风格，一位演讲者站在电脑前，屏幕显示加载中的转圈图标，
  演讲者表情紧张尴尬，额头有汗珠，
  台下评委表情无奈，场景是路演现场，
  主色调蓝紫和浅灰，线条简洁，科技商务风
```

---

### Slide 16

```yaml
slide_index: 16
slide_type: demo
title: 演示策略：录屏优先
subtitle: 稳定展示核心价值
key_points:
  - 优先录屏：流畅、可控、无风险
  - 聚焦核心：只演示 1-2 个最有价值的功能
  - 备选方案：准备静态截图作为 Plan B
speaker_notes:
  - 我的建议是优先用录屏
  - 提前录好最顺畅的一次操作
  - 只展示 1-2 个最核心的功能
  - 另外准备截图作为备选
  - 这样不管现场什么情况，你都能从容应对
visual_layout_hint: 展示推荐的演示策略流程
image_prompt: >
  简洁的流程图，三个圆角矩形横向排列，
  分别标注"录屏准备""聚焦核心功能""准备 Plan B"，
  用箭头连接表示准备流程，
  主色调蓝紫渐变，浅灰背景，扁平设计风格
```

---

### Slide 17

```yaml
slide_index: 17
slide_type: summary
title: 避坑 Checklist
subtitle: 汇报前最后检查一遍
key_points:
  - □ 痛点有具体角色、场景、任务、数据
  - □ 方案说清"在哪个环节用 AI 做什么"
  - □ 价值有前后对比数据
  - □ PPT 一页一观点，多用图
  - □ 语言说人话，避免术语堆砌
  - □ 结构遵循 Why-How-What
  - □ 演示优先录屏，聚焦核心功能
speaker_notes:
  - 最后给大家一个 Checklist
  - 汇报前对照检查一遍
  - 如果每一条都能打勾，你的汇报基本不会翻车
visual_layout_hint: 清单式布局，每条前有复选框
image_prompt: >
  简洁的清单图标，一张纸上列出七个待办事项，
  每个事项前有复选框，部分已打勾，
  整体呈现任务清单的感觉，
  主色调蓝紫和浅灰，扁平设计风格
```

---

### Slide 18

```yaml
slide_index: 18
slide_type: cta
title: 下一步：重构你的 PPT
subtitle: 今晚就开始行动
key_points:
  - 用这套模板重新审视你的项目汇报
  - 逐条对照 Checklist 修改
  - 路演前多练习几遍
speaker_notes:
  - 好，以上就是今天的全部内容
  - 我给大家的建议是：今晚就开始
  - 用这套模板重新审视你的 PPT
  - 哪里痛点不痛，补故事
  - 哪里方案不清，用填空公式
  - 哪里数据没有，赶紧补
  - 祝大家路演顺利，谢谢！
visual_layout_hint: 中央大字号行动呼吁，下方联系方式
image_prompt: >
  扁平插画风格，一位演讲者面向观众做出鼓励的手势，
  表情自信有感染力，背景有向上的箭头元素，
  整体氛围积极向上充满动力，
  主色调蓝紫和浅灰，线条简洁，科技商务风
```

---

## 使用说明

1. **直接参考**：可以直接使用上述结构和内容
2. **按需调整**：根据具体主题调整深坑/雷区的内容
3. **生成图片**：使用 `image_prompt` 调用 banana-image 生成配图
4. **保持风格**：确保所有页面遵循统一的视觉风格

## banana-image 批量生成示例

```python
for slide in slides:
    mcp__banana-image__generate_image(
        prompt=slide['image_prompt'],
        model_tier="pro",
        resolution="2k",
        aspect_ratio="16:9"
    )
```
