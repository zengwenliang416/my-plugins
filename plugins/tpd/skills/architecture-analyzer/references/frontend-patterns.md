# 前端架构模式

## 概述

本文档定义了前端架构分析中常用的架构模式和设计决策指南。

## 组件架构模式

### Atomic Design

```
                    Pages
                      │
              ┌───────┴───────┐
              │               │
         Templates        Templates
              │               │
        ┌─────┴─────┐   ┌─────┴─────┐
        │           │   │           │
    Organisms   Organisms  Organisms
        │           │
   ┌────┴────┐  ┌───┴────┐
   │         │  │        │
Molecules Molecules Molecules
   │         │      │
 ┌─┴─┐    ┌──┴──┐  ┌┴─┐
 │   │    │     │  │  │
Atoms Atoms Atoms Atoms
```

| 层级      | 描述           | 示例                           |
| --------- | -------------- | ------------------------------ |
| Atoms     | 最小可复用单元 | Button, Input, Label, Icon     |
| Molecules | 原子组合       | SearchBar, FormField, Card     |
| Organisms | 复杂组件       | Header, ProductList, LoginForm |
| Templates | 页面布局       | DashboardLayout, AuthLayout    |
| Pages     | 完整页面       | HomePage, ProfilePage          |

### Compound Components

```tsx
// 隐式状态共享的复合组件
<Select value={selected} onChange={setSelected}>
  <Select.Trigger>
    <Select.Value placeholder="选择选项" />
  </Select.Trigger>
  <Select.Content>
    <Select.Item value="a">选项 A</Select.Item>
    <Select.Item value="b">选项 B</Select.Item>
  </Select.Content>
</Select>
```

**实现方式**：

```tsx
const SelectContext = createContext<SelectContextValue | null>(null);

function Select({ children, value, onChange }) {
  return (
    <SelectContext.Provider value={{ value, onChange }}>
      {children}
    </SelectContext.Provider>
  );
}

Select.Item = function SelectItem({ value, children }) {
  const ctx = useContext(SelectContext);
  return <button onClick={() => ctx.onChange(value)}>{children}</button>;
};
```

### Container/Presentational

```tsx
// Container: 处理数据和逻辑
function UserListContainer() {
  const { data, isLoading } = useQuery(["users"], fetchUsers);

  if (isLoading) return <Spinner />;
  return <UserList users={data} />;
}

// Presentational: 纯渲染
function UserList({ users }: { users: User[] }) {
  return (
    <ul>
      {users.map((user) => (
        <UserCard key={user.id} user={user} />
      ))}
    </ul>
  );
}
```

## 状态管理模式

### 状态分类

| 类型                | 描述                 | 推荐方案               |
| ------------------- | -------------------- | ---------------------- |
| Server State        | API 数据、缓存       | React Query, SWR       |
| Global Client State | 跨组件共享状态       | Zustand, Redux Toolkit |
| Local UI State      | 组件内部状态         | useState, useReducer   |
| URL State           | 路由参数、查询字符串 | URL params             |
| Form State          | 表单数据、验证状态   | React Hook Form        |

### React Query（Server State）

```tsx
// 查询
const { data, isLoading, error } = useQuery({
  queryKey: ["users", filters],
  queryFn: () => fetchUsers(filters),
  staleTime: 5 * 60 * 1000, // 5分钟内数据视为新鲜
});

// 变更
const mutation = useMutation({
  mutationFn: createUser,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["users"] });
  },
});
```

### Zustand（Global State）

```tsx
interface Store {
  user: User | null;
  theme: "light" | "dark";
  setUser: (user: User) => void;
  toggleTheme: () => void;
}

const useStore = create<Store>((set) => ({
  user: null,
  theme: "light",
  setUser: (user) => set({ user }),
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === "light" ? "dark" : "light",
    })),
}));

// 使用（自动订阅）
function UserAvatar() {
  const user = useStore((state) => state.user);
  return <Avatar src={user?.avatar} />;
}
```

### Context API（低频全局数据）

```tsx
// 适用场景：Theme, Auth, i18n
const ThemeContext = createContext<ThemeContextValue | null>(null);

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ⚠️ 避免在 Context 中放高频变化的数据
```

### URL State

```tsx
// 筛选、分页参数存入 URL
function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = {
    category: searchParams.get("category") || "all",
    page: Number(searchParams.get("page")) || 1,
    sort: searchParams.get("sort") || "newest",
  };

  const handleFilterChange = (key: string, value: string) => {
    setSearchParams((prev) => {
      prev.set(key, value);
      return prev;
    });
  };
}
```

## 路由设计模式

### Nested Layouts

```tsx
// App Router (Next.js 15)
// app/dashboard/layout.tsx
export default function DashboardLayout({ children }) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
}

// app/dashboard/page.tsx
export default function DashboardPage() {
  return <h1>Dashboard</h1>;
}

// app/dashboard/settings/page.tsx
export default function SettingsPage() {
  return <h1>Settings</h1>; // 继承 DashboardLayout
}
```

### Route Guards

```tsx
// 认证守卫
function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <Spinner />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// 权限守卫
function RoleGuard({ allowedRoles, children }) {
  const { user } = useAuth();

  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
```

### Code Splitting

```tsx
// 路由级懒加载
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Settings = lazy(() => import("./pages/Settings"));

function App() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}
```

## 数据获取模式

### SSR (Server-Side Rendering)

```tsx
// Next.js App Router
async function ProductPage({ params }) {
  const product = await fetchProduct(params.id);

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
    </div>
  );
}
```

### SSG (Static Site Generation)

```tsx
// Next.js
export async function generateStaticParams() {
  const posts = await fetchAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

async function PostPage({ params }) {
  const post = await fetchPost(params.slug);
  return <Article content={post.content} />;
}
```

### CSR with SWR/React Query

```tsx
function UserProfile({ userId }) {
  const { data, error, isLoading } = useSWR(`/api/users/${userId}`, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorMessage error={error} />;

  return <Profile user={data} />;
}
```

## 样式架构模式

### CSS-in-JS (Styled Components / Emotion)

```tsx
const Button = styled.button<{ variant: "primary" | "secondary" }>`
  padding: 8px 16px;
  border-radius: 4px;
  background: ${({ variant, theme }) =>
    variant === "primary" ? theme.colors.primary : "transparent"};
  color: ${({ variant, theme }) =>
    variant === "primary" ? "white" : theme.colors.primary};
`;
```

### Utility-First (Tailwind CSS)

```tsx
function Button({ variant, children }) {
  const baseClasses = "px-4 py-2 rounded font-medium transition-colors";
  const variantClasses = {
    primary: "bg-blue-500 text-white hover:bg-blue-600",
    secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200",
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]}`}>
      {children}
    </button>
  );
}
```

### CSS Modules

```tsx
// Button.module.css
.button {
  padding: 8px 16px;
  border-radius: 4px;
}

.primary {
  background: var(--color-primary);
  color: white;
}

// Button.tsx
import styles from './Button.module.css';

function Button({ variant, children }) {
  return (
    <button className={`${styles.button} ${styles[variant]}`}>
      {children}
    </button>
  );
}
```

## 性能优化模式

### Memoization

```tsx
// useMemo - 缓存计算结果
const filteredItems = useMemo(
  () => items.filter((item) => item.name.includes(search)),
  [items, search],
);

// useCallback - 缓存函数引用
const handleClick = useCallback(
  (id: string) => dispatch({ type: "SELECT", payload: id }),
  [dispatch],
);

// React.memo - 组件级缓存
const ExpensiveList = memo(function ExpensiveList({ items }) {
  return items.map((item) => <ExpensiveItem key={item.id} item={item} />);
});
```

### Virtualization

```tsx
import { useVirtualizer } from "@tanstack/react-virtual";

function VirtualList({ items }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });

  return (
    <div ref={parentRef} style={{ height: 400, overflow: "auto" }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: "absolute",
              top: virtualItem.start,
              height: virtualItem.size,
            }}
          >
            {items[virtualItem.index].name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Image Optimization

```tsx
// Next.js Image
import Image from "next/image";

function ProductImage({ src, alt }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={400}
      height={300}
      placeholder="blur"
      blurDataURL={placeholderUrl}
      loading="lazy"
      sizes="(max-width: 768px) 100vw, 400px"
    />
  );
}
```

## 测试模式

### Component Testing

```tsx
import { render, screen, fireEvent } from "@testing-library/react";

describe("LoginForm", () => {
  it("submits form with credentials", async () => {
    const onSubmit = vi.fn();
    render(<LoginForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText("Email"), "test@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: /login/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });
  });
});
```

### Storybook

```tsx
// Button.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  component: Button,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: "primary",
    children: "Button",
  },
};
```

## 选型决策矩阵

| 场景         | 推荐模式                 | 原因         |
| ------------ | ------------------------ | ------------ |
| 组件库       | Atomic Design + Compound | 可复用性高   |
| 数据密集应用 | React Query + CQRS       | 缓存管理完善 |
| 营销网站     | SSG + ISR                | SEO + 性能   |
| 管理后台     | CSR + Zustand            | 交互复杂度高 |
| 大列表       | Virtualization           | 性能关键     |
