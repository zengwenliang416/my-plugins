# Git Status Mapping Reference

Git `status --porcelain` 输出解析规则和文件类型映射。

---

## 1. Git 状态码映射

### 1.1 Porcelain 格式说明

```
XY PATH
XY ORIG_PATH -> PATH  (for renames)
```

- **X**: 暂存区状态
- **Y**: 工作区状态
- **PATH**: 文件路径

### 1.2 状态码对照表

| 状态码 | 含义 | type 映射 |
|--------|------|-----------|
| `M` | Modified (已修改) | `modified` |
| `A` | Added (已添加) | `added` |
| `D` | Deleted (已删除) | `deleted` |
| `R` | Renamed (已重命名) | `renamed` |
| `C` | Copied (已复制) | `copied` |
| `U` | Updated but Unmerged | `unmerged` |
| `??` | Untracked (未跟踪) | `untracked` |
| `!!` | Ignored (已忽略) | `ignored` |

### 1.3 组合状态示例

| 输出 | 暂存区 | 工作区 | 说明 |
|------|--------|--------|------|
| `M ` | Modified | - | 已暂存的修改 |
| ` M` | - | Modified | 未暂存的修改 |
| `MM` | Modified | Modified | 暂存后又修改 |
| `A ` | Added | - | 新增文件已暂存 |
| `AM` | Added | Modified | 新增后又修改 |
| `D ` | Deleted | - | 删除已暂存 |
| ` D` | - | Deleted | 删除未暂存 |
| `R ` | Renamed | - | 重命名已暂存 |
| `??` | - | - | 未跟踪文件 |

---

## 2. 文件类型映射

### 2.1 扩展名映射表

| 扩展名 | file_type |
|--------|-----------|
| `.ts`, `.tsx` | `typescript` |
| `.js`, `.jsx` | `javascript` |
| `.py` | `python` |
| `.go` | `go` |
| `.rs` | `rust` |
| `.java` | `java` |
| `.rb` | `ruby` |
| `.php` | `php` |
| `.c`, `.h` | `c` |
| `.cpp`, `.hpp` | `cpp` |
| `.cs` | `csharp` |
| `.swift` | `swift` |
| `.kt` | `kotlin` |
| `.md`, `.mdx` | `markdown` |
| `.json` | `json` |
| `.yaml`, `.yml` | `yaml` |
| `.toml` | `toml` |
| `.xml` | `xml` |
| `.html`, `.htm` | `html` |
| `.css`, `.scss`, `.less` | `css` |
| `.sh`, `.bash`, `.zsh` | `shell` |
| `.sql` | `sql` |
| `.graphql`, `.gql` | `graphql` |
| `.proto` | `protobuf` |
| `.dockerfile`, `Dockerfile` | `dockerfile` |
| 其他 | `other` |

### 2.2 特殊文件识别

| 文件名 | 类型 |
|--------|------|
| `package.json` | `npm-config` |
| `tsconfig.json` | `ts-config` |
| `Cargo.toml` | `rust-config` |
| `go.mod` | `go-config` |
| `requirements.txt` | `python-deps` |
| `Makefile` | `makefile` |
| `.gitignore` | `git-config` |
| `.env*` | `env-config` |

---

## 3. 作用域推断规则

### 3.1 路径解析策略

```
src/components/Button.tsx → scope: "components"
src/utils/helper.ts → scope: "utils"
tests/unit/auth.test.ts → scope: "tests"
docs/README.md → scope: "docs"
```

**规则**:
1. 取 `src/` 后的第一级目录
2. 如果无 `src/`，取根目录下第一级
3. 根目录文件使用 `root` 作用域

### 3.2 常见作用域

| 路径模式 | 推断作用域 |
|----------|------------|
| `src/components/*` | `components` |
| `src/pages/*` | `pages` |
| `src/utils/*` | `utils` |
| `src/hooks/*` | `hooks` |
| `src/services/*` | `services` |
| `src/api/*` | `api` |
| `tests/*` | `tests` |
| `docs/*` | `docs` |
| `scripts/*` | `scripts` |
| `config/*` | `config` |

---

## 4. 解析示例

### 输入

```
M  src/utils/helper.ts
A  src/components/NewButton.tsx
D  src/deprecated/OldComponent.tsx
R  src/old.ts -> src/new.ts
?? src/temp.ts
```

### 输出 JSON

```json
{
  "staged": [
    {"status": "M", "path": "src/utils/helper.ts", "type": "modified", "file_type": "typescript", "scope": "utils"},
    {"status": "A", "path": "src/components/NewButton.tsx", "type": "added", "file_type": "typescript", "scope": "components"},
    {"status": "D", "path": "src/deprecated/OldComponent.tsx", "type": "deleted", "file_type": "typescript", "scope": "deprecated"},
    {"status": "R", "path": "src/new.ts", "type": "renamed", "file_type": "typescript", "scope": "root", "old_path": "src/old.ts"}
  ],
  "untracked": [
    {"status": "??", "path": "src/temp.ts", "type": "untracked", "file_type": "typescript", "scope": "root"}
  ]
}
```
