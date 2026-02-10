#!/usr/bin/env -S npx tsx
/**
 * Swagger/OpenAPI Generator Script
 * Analyzes API routes and generates OpenAPI specification
 */

import { readFile, writeFile, mkdir, glob } from "node:fs/promises";
import { join, dirname, basename, extname } from "path";

type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

interface RouteInfo {
  method: HttpMethod;
  path: string;
  handler: string;
  file: string;
  line: number;
  params: string[];
  queryParams: string[];
  bodyType?: string;
  responseType?: string;
}

interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
  };
  servers: Array<{ url: string; description: string }>;
  paths: Record<string, Record<string, PathOperation>>;
  components: {
    schemas: Record<string, SchemaObject>;
    securitySchemes: Record<string, SecurityScheme>;
  };
  security?: Array<Record<string, string[]>>;
}

interface PathOperation {
  summary: string;
  operationId: string;
  tags: string[];
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses: Record<string, Response>;
  security?: Array<Record<string, string[]>>;
}

interface Parameter {
  name: string;
  in: "query" | "path" | "header" | "cookie";
  required?: boolean;
  schema: SchemaObject;
  description?: string;
}

interface RequestBody {
  required: boolean;
  content: Record<string, { schema: SchemaObject }>;
}

interface Response {
  description: string;
  content?: Record<string, { schema: SchemaObject }>;
}

interface SchemaObject {
  type?: string;
  format?: string;
  properties?: Record<string, SchemaObject>;
  items?: SchemaObject;
  required?: string[];
  $ref?: string;
  enum?: string[];
}

interface SecurityScheme {
  type: string;
  scheme?: string;
  bearerFormat?: string;
  in?: string;
  name?: string;
}

type Framework = "express" | "koa" | "fastify" | "nestjs" | "hono" | "unknown";

async function detectFramework(projectPath: string): Promise<Framework> {
  try {
    const pkgContent = await readFile(
      join(projectPath, "package.json"),
      "utf-8",
    );
    const pkg = JSON.parse(pkgContent);
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    if (deps["@nestjs/core"]) return "nestjs";
    if (deps["fastify"]) return "fastify";
    if (deps["koa"]) return "koa";
    if (deps["hono"]) return "hono";
    if (deps["express"]) return "express";

    return "unknown";
  } catch {
    return "unknown";
  }
}

async function findRouteFiles(
  srcPath: string,
  framework: Framework,
): Promise<string[]> {
  const patterns: Record<Framework, string[]> = {
    express: ["**/routes/**/*.{ts,js}", "**/controllers/**/*.{ts,js}"],
    koa: ["**/routes/**/*.{ts,js}", "**/controllers/**/*.{ts,js}"],
    fastify: ["**/routes/**/*.{ts,js}", "**/plugins/**/*.{ts,js}"],
    nestjs: ["**/*.controller.ts"],
    hono: ["**/routes/**/*.{ts,js}", "**/*.routes.{ts,js}"],
    unknown: ["**/routes/**/*.{ts,js}", "**/controllers/**/*.{ts,js}"],
  };

  const files = new Set<string>();
  for (const pattern of patterns[framework]) {
    for await (const file of glob(pattern, {
      cwd: srcPath,
      exclude: ["**/node_modules/**", "**/.git/**"],
    })) {
      files.add(join(srcPath, String(file)));
    }
  }

  return Array.from(files);
}

function extractRoutes(
  content: string,
  filePath: string,
  framework: Framework,
): RouteInfo[] {
  const routes: RouteInfo[] = [];

  // Express/Koa pattern: app.get('/path', handler) or router.get('/path', handler)
  if (framework === "express" || framework === "koa" || framework === "hono") {
    const routeRegex =
      /(?:app|router)\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
    let match;
    let lineNum = 1;

    const lines = content.split("\n");
    for (const line of lines) {
      while ((match = routeRegex.exec(line)) !== null) {
        const method = match[1].toLowerCase() as HttpMethod;
        const path = match[2];
        const params = extractPathParams(path);

        routes.push({
          method,
          path: normalizePath(path),
          handler: "",
          file: filePath,
          line: lineNum,
          params,
          queryParams: [],
        });
      }
      lineNum++;
    }
  }

  // NestJS pattern: @Get(), @Post(), etc. with @Controller
  if (framework === "nestjs") {
    const controllerMatch = content.match(
      /@Controller\s*\(\s*['"`]([^'"`]*)['"`]\s*\)/,
    );
    const basePath = controllerMatch ? controllerMatch[1] : "";

    const methodRegex =
      /@(Get|Post|Put|Patch|Delete)\s*\(\s*['"`]?([^'"`)\s]*)['"`]?\s*\)/gi;
    let match;
    let lineNum = 1;

    const lines = content.split("\n");
    for (const line of lines) {
      while ((match = methodRegex.exec(line)) !== null) {
        const method = match[1].toLowerCase() as HttpMethod;
        const subPath = match[2] || "";
        const fullPath = `/${basePath}/${subPath}`.replace(/\/+/g, "/");
        const params = extractPathParams(fullPath);

        routes.push({
          method,
          path: fullPath,
          handler: "",
          file: filePath,
          line: lineNum,
          params,
          queryParams: [],
        });
      }
      lineNum++;
    }
  }

  // Fastify pattern: fastify.get('/path', ...) or fastify.route({ method, url })
  if (framework === "fastify") {
    const simpleRegex =
      /fastify\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
    const routeRegex =
      /fastify\.route\s*\(\s*\{[^}]*method:\s*['"`](\w+)['"`][^}]*url:\s*['"`]([^'"`]+)['"`]/gi;

    let match;
    let lineNum = 1;

    const lines = content.split("\n");
    for (const line of lines) {
      while ((match = simpleRegex.exec(line)) !== null) {
        const method = match[1].toLowerCase() as HttpMethod;
        const path = match[2];
        routes.push({
          method,
          path: normalizePath(path),
          handler: "",
          file: filePath,
          line: lineNum,
          params: extractPathParams(path),
          queryParams: [],
        });
      }
      while ((match = routeRegex.exec(line)) !== null) {
        const method = match[1].toLowerCase() as HttpMethod;
        const path = match[2];
        routes.push({
          method,
          path: normalizePath(path),
          handler: "",
          file: filePath,
          line: lineNum,
          params: extractPathParams(path),
          queryParams: [],
        });
      }
      lineNum++;
    }
  }

  return routes;
}

function extractPathParams(path: string): string[] {
  const params: string[] = [];
  const regex = /:(\w+)/g;
  let match;
  while ((match = regex.exec(path)) !== null) {
    params.push(match[1]);
  }
  return params;
}

function normalizePath(path: string): string {
  // Convert Express :param to OpenAPI {param}
  return path.replace(/:(\w+)/g, "{$1}").replace(/\/+/g, "/");
}

function generateOperationId(method: string, path: string): string {
  const parts = path
    .split("/")
    .filter((p) => p && !p.startsWith("{"))
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1));

  return `${method}${parts.join("")}`;
}

function extractTag(filePath: string): string {
  const name = basename(filePath, extname(filePath));
  return name
    .replace(/\.controller|\.routes?|Controller|Routes?/gi, "")
    .split(/[-_]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function buildPathOperation(route: RouteInfo): PathOperation {
  const operation: PathOperation = {
    summary: `${route.method.toUpperCase()} ${route.path}`,
    operationId: generateOperationId(route.method, route.path),
    tags: [extractTag(route.file)],
    responses: {
      "200": { description: "Successful response" },
      "400": { description: "Bad request" },
      "401": { description: "Unauthorized" },
      "500": { description: "Internal server error" },
    },
  };

  // Add path parameters
  if (route.params.length > 0) {
    operation.parameters = route.params.map((param) => ({
      name: param,
      in: "path" as const,
      required: true,
      schema: { type: "string" },
    }));
  }

  // Add request body for POST/PUT/PATCH
  if (["post", "put", "patch"].includes(route.method)) {
    operation.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: { type: "object" },
        },
      },
    };
  }

  return operation;
}

async function generateOpenAPI(
  srcPath: string,
  projectPath: string,
): Promise<OpenAPISpec> {
  const framework = await detectFramework(projectPath);
  const routeFiles = await findRouteFiles(srcPath, framework);

  const spec: OpenAPISpec = {
    openapi: "3.0.3",
    info: {
      title: "API Documentation",
      version: "1.0.0",
      description: "Auto-generated by memory plugin swagger-generator",
    },
    servers: [
      { url: "http://localhost:3000", description: "Development server" },
    ],
    paths: {},
    components: {
      schemas: {},
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  };

  for (const filePath of routeFiles) {
    try {
      const content = await readFile(filePath, "utf-8");
      const routes = extractRoutes(content, filePath, framework);

      for (const route of routes) {
        if (!spec.paths[route.path]) {
          spec.paths[route.path] = {};
        }
        spec.paths[route.path][route.method] = buildPathOperation(route);
      }
    } catch (err) {
      console.error(`Error processing ${filePath}:`, err);
    }
  }

  return spec;
}

function toYAML(obj: unknown, indent = 0): string {
  const spaces = "  ".repeat(indent);

  if (obj === null || obj === undefined) {
    return "null";
  }

  if (typeof obj === "string") {
    if (obj.includes("\n") || obj.includes(":") || obj.includes("#")) {
      return `"${obj.replace(/"/g, '\\"')}"`;
    }
    return obj;
  }

  if (typeof obj === "number" || typeof obj === "boolean") {
    return String(obj);
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) return "[]";
    return obj
      .map((item) => `\n${spaces}- ${toYAML(item, indent + 1)}`)
      .join("");
  }

  if (typeof obj === "object") {
    const entries = Object.entries(obj);
    if (entries.length === 0) return "{}";

    return entries
      .map(([key, value]) => {
        const valueStr = toYAML(value, indent + 1);
        if (
          typeof value === "object" &&
          value !== null &&
          !Array.isArray(value)
        ) {
          return `\n${spaces}${key}:${valueStr}`;
        }
        return `\n${spaces}${key}: ${valueStr}`;
      })
      .join("");
  }

  return String(obj);
}

// CLI
const srcPath = process.argv[2] || "src";
const format = process.argv.includes("--json") ? "json" : "yaml";
const outputArg = process.argv.find((arg) => arg.startsWith("--output="));
const outputPath = outputArg
  ? outputArg.split("=")[1]
  : format === "json"
    ? "openapi.json"
    : "openapi.yaml";

const projectPath = process.cwd();

generateOpenAPI(srcPath, projectPath)
  .then(async (spec) => {
    await mkdir(dirname(outputPath), { recursive: true });

    const content =
      format === "json"
        ? JSON.stringify(spec, null, 2)
        : `# OpenAPI Specification\n# Generated by swagger-generator${toYAML(spec)}`;

    await writeFile(outputPath, content, "utf-8");

    // Cache results
    const cacheDir = ".claude/memory/swagger";
    await mkdir(cacheDir, { recursive: true });
    await writeFile(
      join(cacheDir, "last-scan.json"),
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          srcPath,
          outputPath,
          routes: Object.keys(spec.paths).length,
          endpoints: Object.values(spec.paths).reduce(
            (sum, p) => sum + Object.keys(p).length,
            0,
          ),
        },
        null,
        2,
      ),
      "utf-8",
    );

    console.log("OpenAPI specification generated:");
    console.log(`  Output: ${outputPath}`);
    console.log(`  Paths: ${Object.keys(spec.paths).length}`);
    console.log(
      `  Operations: ${Object.values(spec.paths).reduce((sum, p) => sum + Object.keys(p).length, 0)}`,
    );
  })
  .catch((err) => {
    console.error("Generation failed:", err);
    process.exit(1);
  });
