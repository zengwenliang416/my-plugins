# 依赖检查命令速查

## Node.js (npm/yarn/pnpm)

### 状态检查

```bash
# 列出过时依赖
npm outdated
yarn outdated
pnpm outdated

# 安全漏洞扫描
npm audit
npm audit --json              # JSON 格式
npm audit --production        # 仅生产依赖

# 依赖树查看
npm ls --depth=0              # 顶层依赖
npm ls --all                  # 完整依赖树
npm explain <package>         # 某包的依赖路径

# 包信息
npm view <package> versions   # 查看所有版本
npm view <package>            # 包详细信息
```

### 升级操作

```bash
# 更新补丁版本（最安全）
npm update

# 指定版本升级
npm install package@^2.0.0    # 次版本
npm install package@3.0.0     # 主版本

# 自动修复漏洞
npm audit fix                 # 安全修复
npm audit fix --force         # 允许 breaking changes
```

### 清理重装

```bash
# 清理缓存
npm cache clean --force

# 重新安装
rm -rf node_modules package-lock.json && npm install
```

---

## Python (pip)

```bash
# 过时依赖
pip list --outdated

# 安全扫描（需安装 pip-audit）
pip install pip-audit
pip-audit

# 依赖树
pip show <package>
pipdeptree                    # 需安装 pipdeptree

# 升级
pip install --upgrade <package>
pip install <package>==2.0.0  # 指定版本
```

---

## Rust (cargo)

```bash
# 过时依赖（需安装 cargo-outdated）
cargo install cargo-outdated
cargo outdated

# 安全扫描（需安装 cargo-audit）
cargo install cargo-audit
cargo audit

# 依赖树
cargo tree
cargo tree -i <package>       # 反向依赖

# 升级
cargo update                  # 更新 Cargo.lock
cargo update <package>        # 更新指定包
```

---

## 漏洞信息来源

| 来源                      | URL                              |
| ------------------------- | -------------------------------- |
| npm Advisory Database     | https://www.npmjs.com/advisories |
| Snyk Vulnerability DB     | https://snyk.io/vuln/            |
| GitHub Advisory Database  | https://github.com/advisories    |
| RustSec Advisory Database | https://rustsec.org/advisories/  |
| Python Safety DB          | https://safetycli.com/           |

---

## CI 集成示例

### GitHub Actions

```yaml
# .github/workflows/deps-check.yml
name: Dependency Check
on:
  schedule:
    - cron: "0 9 * * 1" # 每周一 9:00
  workflow_dispatch:

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npm ci
      - run: npm audit --audit-level=high
```

### GitLab CI

```yaml
dependency-check:
  stage: security
  script:
    - npm ci
    - npm audit --audit-level=high
  only:
    - schedules
```
