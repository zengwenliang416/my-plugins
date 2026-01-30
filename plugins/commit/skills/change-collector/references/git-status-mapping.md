# Git Status Mapping Reference

Parsing rules for Git `status --porcelain` output and file type mappings.

---

## 1. Git status code mapping

### 1.1 Porcelain format

```
XY PATH
XY ORIG_PATH -> PATH  (for renames)
```

- **X**: index (staged) status
- **Y**: working tree status
- **PATH**: file path

### 1.2 Status code table

| Status | Meaning | type mapping |
|--------|---------|--------------|
| `M` | Modified | `modified` |
| `A` | Added | `added` |
| `D` | Deleted | `deleted` |
| `R` | Renamed | `renamed` |
| `C` | Copied | `copied` |
| `U` | Updated but unmerged | `unmerged` |
| `??` | Untracked | `untracked` |
| `!!` | Ignored | `ignored` |

### 1.3 Combined status examples

| Output | Index | Working tree | Description |
|--------|-------|--------------|-------------|
| `M ` | Modified | - | Staged modification |
| ` M` | - | Modified | Unstaged modification |
| `MM` | Modified | Modified | Modified after staging |
| `A ` | Added | - | New file staged |
| `AM` | Added | Modified | Modified after add |
| `D ` | Deleted | - | Deletion staged |
| ` D` | - | Deleted | Deletion unstaged |
| `R ` | Renamed | - | Rename staged |
| `??` | - | - | Untracked file |

---

## 2. File type mapping

### 2.1 Extension mapping table

| Extension | file_type |
|-----------|-----------|
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
| Other | `other` |

### 2.2 Special file identification

| File name | Type |
|----------|------|
| `package.json` | `npm-config` |
| `tsconfig.json` | `ts-config` |
| `Cargo.toml` | `rust-config` |
| `go.mod` | `go-config` |
| `requirements.txt` | `python-deps` |
| `Makefile` | `makefile` |
| `.gitignore` | `git-config` |
| `.env*` | `env-config` |

---

## 3. Scope inference rules

### 3.1 Path parsing strategy

```
src/components/Button.tsx → scope: "components"
src/utils/helper.ts → scope: "utils"
tests/unit/auth.test.ts → scope: "tests"
docs/README.md → scope: "docs"
```

**Rules**:
1. Take the first directory after `src/`
2. If no `src/`, take the first directory at repo root
3. Root-level files use scope `root`

### 3.2 Common scopes

| Path pattern | Inferred scope |
|-------------|----------------|
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

## 4. Parsing example

### Input

```
M  src/utils/helper.ts
A  src/components/NewButton.tsx
D  src/deprecated/OldComponent.tsx
R  src/old.ts -> src/new.ts
?? src/temp.ts
```

### Output JSON

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
