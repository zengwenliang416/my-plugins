# Gemini Thinker 配方

## 快速参考

```bash
# 基础调用
~/.claude/bin/codeagent-wrapper gemini \
  --prompt "Your reasoning task"
```

## 配方 1：Medium Level 推理（中等深度）

```bash
~/.claude/bin/codeagent-wrapper gemini --prompt "
你是一位创意设计专家和用户体验设计师。请对以下问题进行创意分析：

问题：${QUESTION}

请从以下角度进行推理：
1. 用户视角分析
2. 创意解决方案探索
3. 潜在机会识别
4. 设计优化建议

请展示你的推理过程，包括：
- 每一步的创意推导
- 用户场景假设
- 可行性评估
"
```

## 配方 2：High Level 推理（深度创意）

```bash
~/.claude/bin/codeagent-wrapper gemini --prompt "
你是一位顶级产品设计师和创新专家。请对以下复杂问题进行全面创意分析：

问题：${QUESTION}

请进行以下层次的推理：

## 第一层：问题洞察
- 用户痛点识别
- 需求层次分析
- 场景深度理解

## 第二层：创意发散
- 生成至少 5 种创新方案
- 跨领域灵感借鉴
- 非常规解决路径

## 第三层：方案评估
- 用户价值评分
- 可实现性分析
- 差异化优势

## 第四层：设计整合
- 视觉/交互建议
- 情感体验设计
- 可扩展性考量

请展示完整的创意推导链，包括假设、灵感来源和结论。
"
```

## 配方 3：用户体验分析

```bash
~/.claude/bin/codeagent-wrapper gemini --prompt "
分析以下用户体验问题：

${QUESTION}

请提供：
1. 用户旅程分析
2. 痛点与爽点识别
3. 情感曲线绘制
4. 改进建议优先级
"
```

## 配方 4：产品创新评估

```bash
~/.claude/bin/codeagent-wrapper gemini --prompt "
评估以下产品创新方向：

${QUESTION}

分析维度：
1. 用户价值主张
2. 市场差异化程度
3. 实现复杂度
4. 增长潜力
5. 风险与机遇分析
"
```

## 配方 5：视觉设计推理

```bash
~/.claude/bin/codeagent-wrapper gemini --prompt "
请对以下设计问题进行视觉推理：

${QUESTION}

分析维度：
1. 视觉层次分析
2. 色彩与排版建议
3. 交互模式推荐
4. 响应式适配策略
"
```

## 输出格式控制

| 需求         | Prompt 结尾        |
| ------------ | ------------------ |
| 只要推理过程 | "展示完整推理过程" |
| 只要结论     | "直接给出结论"     |
| 推理 + 结论  | 不加限定           |
| JSON 格式    | "输出 JSON 格式"   |
