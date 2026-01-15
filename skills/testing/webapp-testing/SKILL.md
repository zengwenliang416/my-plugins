---
name: webapp-testing
description: |
  【触发条件】当需要测试本地 Web 应用、验证前端功能、调试 UI 行为、截图、查看浏览器日志时使用。
  【触发关键词】Web 测试、浏览器测试、UI 测试、截图、前端调试、Chrome DevTools
  【核心能力】使用 chrome-devtools MCP 工具直接操控 Chrome 浏览器进行测试
  【不触发】单元测试（改用 test-generator）、API 测试、非浏览器测试
  【先问什么】若缺少：应用 URL、测试场景、期望行为，先提问补齐
---

# Web Application Testing

使用 chrome-devtools MCP 工具测试 Web 应用。

## 核心工具

| 工具                    | 用途                               |
| ----------------------- | ---------------------------------- |
| `take_snapshot`         | 获取页面 a11y 树快照（含元素 uid） |
| `take_screenshot`       | 截图（支持全页面/元素）            |
| `navigate_page`         | 导航到 URL                         |
| `click`                 | 点击元素                           |
| `fill`                  | 填写表单                           |
| `hover`                 | 悬停元素                           |
| `press_key`             | 按键操作                           |
| `wait_for`              | 等待文本出现                       |
| `list_console_messages` | 查看控制台日志                     |
| `list_network_requests` | 查看网络请求                       |
| `evaluate_script`       | 执行 JavaScript                    |

## 测试流程

### 1. 获取页面上下文

```
mcp__chrome-devtools__list_pages()
→ 获取可用页面列表

mcp__chrome-devtools__select_page(pageIdx=0)
→ 选择要操作的页面
```

### 2. 导航到目标页面

```
mcp__chrome-devtools__navigate_page(
  type="url",
  url="http://localhost:3000"
)
```

### 3. 获取页面快照（关键步骤）

```
mcp__chrome-devtools__take_snapshot()
→ 返回页面元素树，包含每个元素的 uid
→ 后续操作使用 uid 定位元素
```

### 4. 执行交互

```
# 点击按钮
mcp__chrome-devtools__click(uid="ref_12")

# 填写输入框
mcp__chrome-devtools__fill(uid="ref_5", value="test@example.com")

# 等待结果
mcp__chrome-devtools__wait_for(text="Success")
```

### 5. 验证结果

```
# 截图验证
mcp__chrome-devtools__take_screenshot(fullPage=true)

# 检查控制台
mcp__chrome-devtools__list_console_messages(types=["error", "warn"])

# 检查网络请求
mcp__chrome-devtools__list_network_requests(resourceTypes=["xhr", "fetch"])
```

## 常见测试场景

### 表单提交测试

```
1. take_snapshot() → 获取表单元素 uid
2. fill(uid=输入框uid, value="测试数据")
3. click(uid=提交按钮uid)
4. wait_for(text="提交成功")
5. take_screenshot() → 记录结果
```

### 登录流程测试

```
1. navigate_page(url="http://localhost:3000/login")
2. take_snapshot()
3. fill(uid=用户名uid, value="admin")
4. fill(uid=密码uid, value="password")
5. click(uid=登录按钮uid)
6. wait_for(text="Welcome")
7. list_console_messages(types=["error"]) → 检查无错误
```

### 错误处理测试

```
1. 执行触发错误的操作
2. list_console_messages(types=["error"])
3. take_screenshot() → 记录错误状态
4. 验证错误提示是否正确显示
```

## 最佳实践

### 元素定位

- **优先使用 take_snapshot()** 获取 uid，比 CSS 选择器更可靠
- 快照包含 a11y 树信息，便于理解页面结构
- uid 格式：`ref_N`（如 `ref_1`, `ref_23`）

### 等待策略

- 页面加载后先 `take_snapshot()` 确认内容就绪
- 使用 `wait_for(text="...")` 等待特定文本出现
- 动态内容加载后需重新 `take_snapshot()`

### 调试技巧

- `list_console_messages()` 查看 JS 错误
- `list_network_requests()` 检查 API 调用
- `evaluate_script()` 执行自定义 JS 获取状态

### 截图记录

- 关键步骤截图便于回溯
- `fullPage=true` 获取完整页面
- 可指定 `uid` 截取特定元素

## 注意事项

- 每次操作后页面可能变化，需重新 `take_snapshot()`
- 控制台消息和网络请求会随导航清空
- 弹窗/对话框需使用 `handle_dialog()` 处理
