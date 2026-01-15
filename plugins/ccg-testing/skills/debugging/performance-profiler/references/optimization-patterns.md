# 常见性能优化模式

## Node.js

### 同步 vs 异步

```javascript
// ❌ 同步阻塞
const data = fs.readFileSync("large.json");

// ✅ 异步非阻塞
const data = await fs.promises.readFile("large.json");
```

### 内存泄漏防护

```javascript
// ❌ 全局缓存无限增长
const cache = {};
function getData(key) {
  if (!cache[key]) cache[key] = fetchData(key);
  return cache[key];
}

// ✅ LRU 缓存限制大小
import LRUCache from "lru-cache";
const cache = new LRUCache({ max: 1000 });

// ✅ WeakMap 自动释放
const cache = new WeakMap();
```

### Worker 线程

```javascript
// CPU 密集型任务
import { Worker } from "worker_threads";

const worker = new Worker("./heavy-task.js");
worker.postMessage(data);
worker.on("message", (result) => console.log(result));
```

---

## React

### 避免不必要重渲染

```javascript
// ❌ 每次父组件更新都重渲染
function List({ items }) {
  return items.map((item) => <Item key={item.id} item={item} />);
}

// ✅ memo 避免重渲染
const Item = React.memo(({ item }) => <div>{item.name}</div>);

// ✅ useMemo 缓存计算结果
const expensiveValue = useMemo(() => computeExpensive(data), [data]);

// ✅ useCallback 缓存函数引用
const handleClick = useCallback(() => doSomething(id), [id]);
```

### 虚拟滚动

```javascript
// ❌ 大列表直接渲染
<ul>
  {items.map((i) => (
    <li key={i.id}>{i.name}</li>
  ))}
</ul>;

// ✅ 虚拟滚动
import { FixedSizeList } from "react-window";

<FixedSizeList height={400} itemCount={items.length} itemSize={35}>
  {({ index, style }) => <div style={style}>{items[index].name}</div>}
</FixedSizeList>;
```

### 代码分割

```javascript
// ✅ 路由级别分割
const Dashboard = React.lazy(() => import("./Dashboard"));

// ✅ 组件级别分割
const HeavyChart = React.lazy(() => import("./HeavyChart"));
```

---

## 数据库

### 索引优化

```sql
-- ❌ 无索引全表扫描
SELECT * FROM users WHERE email = 'test@example.com';

-- ✅ 添加索引
CREATE INDEX idx_users_email ON users(email);

-- 复合索引（注意列顺序）
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at);
```

### N+1 问题

```sql
-- ❌ N+1 查询
SELECT * FROM posts;
-- 然后循环: SELECT * FROM comments WHERE post_id = ?

-- ✅ JOIN 查询
SELECT p.*, c.* FROM posts p
LEFT JOIN comments c ON c.post_id = p.id;

-- ✅ 批量查询
SELECT * FROM comments WHERE post_id IN (1, 2, 3, ...);
```

### 分页优化

```sql
-- ❌ OFFSET 大数据量慢
SELECT * FROM logs ORDER BY id LIMIT 10 OFFSET 100000;

-- ✅ 游标分页
SELECT * FROM logs WHERE id > 100000 ORDER BY id LIMIT 10;
```

---

## 通用策略

| 问题类型 | 优化策略                                |
| -------- | --------------------------------------- |
| 计算密集 | 算法优化、缓存结果、Worker/多进程       |
| 内存泄漏 | 清理引用、WeakMap/WeakRef、限制缓存大小 |
| I/O 阻塞 | 异步化、批量操作、连接池                |
| 数据库慢 | 索引优化、查询重写、读写分离            |
| 网络延迟 | CDN、gzip、HTTP/2、资源合并             |
| 前端渲染 | 虚拟滚动、懒加载、代码分割、SSR         |
