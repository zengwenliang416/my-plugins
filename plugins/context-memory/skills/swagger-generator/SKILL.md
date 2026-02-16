---
name: swagger-generator
description: |
  Generate OpenAPI/Swagger documentation from code by detecting frameworks and extracting routes.
  [Trigger] Project has API endpoints and needs OpenAPI spec generation.
  [Output] ${run_dir}/openapi.yaml (or .json) + ${run_dir}/api-summary.md
  [Skip] When project has no HTTP routes or already has hand-maintained OpenAPI spec.
  [Ask] Target framework if auto-detection is ambiguous, and output format (yaml/json).
allowed-tools:
  - Read
  - Write
  - Bash
  - Skill
  - Glob
  - Grep
  - mcp__auggie-mcp__codebase-retrieval
arguments:
  - name: run_dir
    type: string
    required: true
    description: Output directory for OpenAPI artifacts
  - name: framework
    type: string
    required: false
    description: "Force framework detection: express, fastify, nestjs, hono, flask, django, spring (auto-detect if omitted)"
  - name: output_format
    type: string
    required: false
    description: "yaml or json (default: yaml)"
---

# swagger-generator

## Purpose

Detect API framework, extract route definitions, and generate an OpenAPI 3.0 spec.

## Framework Detection

| Framework | Detection Pattern                               |
| --------- | ----------------------------------------------- |
| Express   | `require('express')`, `app.get/post/put/delete` |
| Fastify   | `require('fastify')`, `fastify.route`           |
| NestJS    | `@Controller()`, `@Get()/@Post()` decorators    |
| Hono      | `new Hono()`, `app.get/post`                    |
| Flask     | `from flask`, `@app.route`                      |
| Django    | `urlpatterns`, `path()`                         |
| Spring    | `@RestController`, `@RequestMapping`            |

## Steps

### Phase 1: Framework Detection

1. If `framework` specified, use it directly.
2. Otherwise, use `mcp__auggie-mcp__codebase-retrieval` to find API route definitions.
3. Match patterns from detection table above.
4. If multiple frameworks detected, process each separately.

### Phase 2: Route Extraction

5. For each detected framework:
   a. Use `Grep` to find all route definitions.
   b. For each route, extract:
   - HTTP method
   - Path pattern
   - Request body schema (if any)
   - Response schema (if any)
   - Middleware/guards
     c. Use `Skill("context-memory:gemini-cli", {role: "api-extractor", prompt})` for complex schema inference.

### Phase 3: Schema Generation

6. Build OpenAPI 3.0 document:
   - `info`: Extract from package.json or project metadata.
   - `paths`: From extracted routes.
   - `components/schemas`: From request/response types.
   - `tags`: Group by controller/router file.

### Phase 4: Output

7. Write spec to `${run_dir}/openapi.${output_format}`.
8. Write human-readable summary to `${run_dir}/api-summary.md`:
   - Total endpoints count
   - Endpoints by method (GET, POST, etc.)
   - Missing schema warnings

## Multi-Model Fallback

- Gemini (api-extractor) for schema inference.
- If Gemini fails, use Codex (analyzer) to parse types directly.
- Last resort: extract only route paths without schemas.

## Verification

- OpenAPI spec is valid (has `openapi`, `info`, `paths` fields).
- Every detected route appears in the spec.
- Summary includes accurate endpoint count.
