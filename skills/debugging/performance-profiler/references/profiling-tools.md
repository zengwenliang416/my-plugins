# 性能分析工具参考

## Node.js

### 内置 Profiler

```bash
# CPU profiling
node --prof app.js
node --prof-process isolate-*.log > profile.txt

# Chrome DevTools 调试
node --inspect app.js
# 然后打开 chrome://inspect

# 内存快照
node --inspect --expose-gc app.js
# DevTools -> Memory -> Take heap snapshot
```

### Clinic.js（推荐）

```bash
# 安装
npm install -g clinic

# 诊断整体问题
npx clinic doctor -- node app.js

# 火焰图（CPU 分析）
npx clinic flame -- node app.js

# 异步分析
npx clinic bubbleprof -- node app.js
```

---

## Python

### cProfile（内置）

```bash
# 生成 profile 文件
python -m cProfile -o profile.prof script.py

# 分析结果
python -m pstats profile.prof
# 常用命令: sort cumtime, stats 20
```

### py-spy（无侵入式，推荐）

```bash
# 安装
pip install py-spy

# 实时监控
py-spy top --pid <PID>

# 生成火焰图
py-spy record -o profile.svg --pid <PID>
```

### memory_profiler

```bash
pip install memory_profiler

# 逐行内存分析
# 在函数前加 @profile 装饰器
python -m memory_profiler script.py
```

### line_profiler

```bash
pip install line_profiler

# 逐行时间分析
# 在函数前加 @profile 装饰器
kernprof -l -v script.py
```

---

## 前端/浏览器

### Performance API

```javascript
// 标记时间点
performance.mark("start");
// ... 代码 ...
performance.mark("end");

// 测量时间
performance.measure("duration", "start", "end");
console.log(performance.getEntriesByName("duration"));

// 获取资源加载时间
performance.getEntriesByType("resource");
```

### Chrome DevTools

- **Performance 面板**：录制运行时性能
- **Memory 面板**：分析堆内存、查找泄漏
- **Lighthouse**：综合评分和优化建议
- **Network 面板**：分析请求瀑布图

---

## 系统级监控

```bash
# CPU/内存排序
top -o cpu
top -o mem

# 交互式监控
htop

# 进程详情
ps aux | grep <process>

# 打开的文件/连接
lsof -p <PID>

# 网络连接
netstat -an | grep <port>
ss -tlnp
```

---

## 压力测试

### HTTP 压测

```bash
# Apache Bench
ab -n 1000 -c 10 http://localhost:3000/

# wrk（更准确）
wrk -t12 -c400 -d30s http://localhost:3000/

# k6（脚本化）
k6 run script.js
```

### 数据库

```sql
-- 查询执行计划
EXPLAIN ANALYZE SELECT ...;

-- MySQL 慢查询日志
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;
```

---

## APM 工具

| 工具        | 特点                   |
| ----------- | ---------------------- |
| New Relic   | 全栈 APM，企业级       |
| Datadog     | 统一监控平台           |
| Elastic APM | 开源，与 ELK 集成      |
| Prometheus  | 开源监控，配合 Grafana |
| Sentry      | 错误追踪 + 性能监控    |
