# Branch Naming Convention Reference

Branch naming rules and best practices for the commit workflow.

---

## 1. Branch name format

### 1.1 Standard format

```
<type>/<scope>-<description>
```

**Components**:

- **type**: Conventional Commit type (feat, fix, docs, etc.)
- **scope**: Module or component name
- **description**: Brief description (2-4 words, hyphenated)

### 1.2 Type prefixes

| Type       | Use case                | Example                      |
| ---------- | ----------------------- | ---------------------------- |
| `feat`     | New feature             | `feat/auth-add-oauth`        |
| `fix`      | Bug fix                 | `fix/login-validation-error` |
| `docs`     | Documentation           | `docs/api-usage-guide`       |
| `style`    | Code style (formatting) | `style/lint-fixes`           |
| `refactor` | Code refactoring        | `refactor/api-handlers`      |
| `perf`     | Performance improvement | `perf/query-optimization`    |
| `test`     | Tests                   | `test/auth-unit-tests`       |
| `build`    | Build system            | `build/webpack-config`       |
| `ci`       | CI configuration        | `ci/github-actions`          |
| `chore`    | Maintenance             | `chore/deps-update`          |
| `revert`   | Revert commit           | `revert/auth-changes`        |

---

## 2. Naming rules

### 2.1 Character constraints

| Rule                   | Description                 | Example                             |
| ---------------------- | --------------------------- | ----------------------------------- |
| Lowercase only         | No uppercase letters        | `feat/auth` not `Feat/Auth`         |
| Hyphen separator       | Use `-` between words       | `add-login` not `add_login`         |
| No spaces              | Replace with hyphens        | `add-user-auth` not `add user auth` |
| Alphanumeric + hyphen  | Only `a-z`, `0-9`, `-`, `/` | Valid                               |
| No consecutive hyphens | Single hyphen only          | `add-login` not `add--login`        |
| No trailing hyphen     | Clean ending                | `add-login` not `add-login-`        |
| Max 50 characters      | Keep concise                | Truncate if needed                  |

### 2.2 Sanitization rules

```
Input: "Add User Authentication!"
Output: "add-user-authentication"

Input: "fix: button   style"
Output: "fix-button-style"

Input: "FEAT/API_ENDPOINT"
Output: "feat-api-endpoint"
```

**Sanitization steps**:

1. Convert to lowercase
2. Replace `_`, spaces, special chars with `-`
3. Remove consecutive hyphens
4. Remove leading/trailing hyphens
5. Truncate to 50 characters at word boundary

---

## 3. Protected branches

### 3.1 Never branch from/to directly

| Branch      | Description                        |
| ----------- | ---------------------------------- |
| `main`      | Production branch                  |
| `master`    | Legacy production branch           |
| `develop`   | Development integration            |
| `release/*` | Release branches                   |
| `hotfix/*`  | Hotfix branches (special workflow) |

### 3.2 Branch creation source

| Target type | Create from         |
| ----------- | ------------------- |
| Feature     | `develop` or `main` |
| Bugfix      | `develop` or `main` |
| Hotfix      | `main` (production) |
| Release     | `develop`           |

---

## 4. Branch name generation

### 4.1 From changes-analysis.json

**Input**:

```json
{
  "primary_type": "feat",
  "primary_scope": "auth-service",
  "semantic_analysis": {
    "summary": "Add token refresh capability with automatic renewal"
  }
}
```

**Generation steps**:

1. Extract type: `feat`
2. Extract scope: `auth-service`
3. Extract keywords from summary: `token`, `refresh`
4. Combine: `feat/auth-service-token-refresh`

### 4.2 Keyword extraction rules

| Priority | Source                   | Example             |
| -------- | ------------------------ | ------------------- |
| 1        | Verbs (add, fix, update) | `add-login`         |
| 2        | Nouns (feature name)     | `oauth-integration` |
| 3        | Scope narrowing          | `user-validation`   |

**Stop words to exclude**:

- Articles: the, a, an
- Prepositions: in, on, at, to, for, with
- Conjunctions: and, or, but
- Common verbs: is, are, was, were, be, been

---

## 5. Conflict resolution

### 5.1 Existing branch handling

| Scenario             | Options                         |
| -------------------- | ------------------------------- |
| Local branch exists  | Switch / Rename / Delete+Create |
| Remote branch exists | Fetch+Switch / Rename           |
| Both exist           | Verify same commit / Rename     |

### 5.2 Suffix generation

When branch exists, append suffix:

```
feat/auth-login      (exists)
feat/auth-login-v2   (try this)
feat/auth-login-v3   (if v2 exists)
```

---

## 6. Examples

### 6.1 Feature branch

```
Type: feat
Scope: components
Summary: Add new button component with variants

Branch: feat/components-button-variants
```

### 6.2 Bug fix branch

```
Type: fix
Scope: api
Summary: Fix authentication token validation error

Branch: fix/api-token-validation
```

### 6.3 Documentation branch

```
Type: docs
Scope: readme
Summary: Update installation instructions

Branch: docs/readme-installation
```

### 6.4 Refactoring branch

```
Type: refactor
Scope: services
Summary: Cleanup payment service handlers

Branch: refactor/services-payment-cleanup
```
