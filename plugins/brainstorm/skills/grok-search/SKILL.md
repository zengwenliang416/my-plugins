---
name: grok-search
description: |
  Web search and content fetching via Grok API.
  Replaces built-in WebSearch/WebFetch with enhanced capabilities.
  Output: unified JSON {ok: bool, data: any, error?: {message, type}}.
allowed-tools:
  - Bash
  - Read
---

# Grok Search CLI

## Commands

```bash
GROK_SCRIPT="${CLAUDE_PLUGIN_ROOT}/skills/grok-search/scripts/grok-search.ts"

# Search
npx tsx "$GROK_SCRIPT" search "query" --platform "GitHub" --max-results 10

# Fetch
npx tsx "$GROK_SCRIPT" fetch "https://example.com"

# Config
npx tsx "$GROK_SCRIPT" config

# Switch model
npx tsx "$GROK_SCRIPT" model "grok-4-fast"

# Toggle built-in tools
npx tsx "$GROK_SCRIPT" toggle on|off|status
```

## Tool Matrix

| Command  | Parameters                                                                | Output                            | Use Case                      |
| -------- | ------------------------------------------------------------------------- | --------------------------------- | ----------------------------- |
| `search` | `query`(required), `--platform`/`--min-results`/`--max-results`(optional) | `{ok,data:[{title,url,content}]}` | Multi-source/fact-check/news  |
| `fetch`  | `url`(required)                                                           | `{ok,data:markdown}`              | Full content/deep analysis    |
| `config` | none                                                                      | `{ok,data:{api_url,status,test}}` | Connection diagnostics        |
| `model`  | `model_name`(required)                                                    | `{ok,data:{previous,current}}`    | Switch Grok model             |
| `toggle` | `on`/`off`/`status`(optional)                                             | `{ok,data:{blocked,deny_list}}`   | Disable/enable built-in tools |

## Environment Variables

Required:

- `GROK_API_URL` - API endpoint
- `GROK_API_KEY` - API key

Optional:

- `GROK_DEBUG` - Enable logging (true/1/yes)
- `GROK_RETRY_MAX_ATTEMPTS` - Retry count (default: 3, range: 1-5)

## Output Format

```json
{"ok": true, "data": ...}
{"ok": false, "data": "", "error": {"message": "...", "type": "..."}}
```

## Workflow

1. **Query**: Broad search -> `search`, Deep fetch -> `fetch`
2. **Execute**: Prefer `search` first, supplement with `fetch` for key URLs
3. **Iterate**: If results insufficient, adjust query and retry
4. **Synthesize**: Cross-validate, cite sources `[Title](URL)`, note dates

## Error Recovery

| Error           | Diagnosis          | Recovery                   |
| --------------- | ------------------ | -------------------------- |
| Connection fail | Run `config`       | Check API URL/Key          |
| No results      | Query too specific | Broaden search terms       |
| Fetch timeout   | URL accessibility  | Search alternative sources |
