#!/usr/bin/env npx tsx
/**
 * Gemini Image Generation Script for D2C Plugin.
 * Calls Gemini API directly to generate 4K images from text prompts.
 *
 * Usage:
 *   npx tsx generate-image.ts --prompt "..." --output ./out.png [--aspect-ratio 16:9] [--reference <path>]
 *
 * Environment:
 *   GEMINI_API_KEY — required
 *   GEMINI_IMAGE_MODEL — optional override (default: gemini-3-pro-image-preview)
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve, extname } from "node:path";
import { ProxyAgent, type Dispatcher } from "undici";

// ── Types ────────────────────────────────────────────────────────────────────

interface Args {
  prompt: string;
  output: string;
  aspectRatio: string;
  reference: string;
  model: string;
  negativePrompt: string;
}

interface ImageData {
  mimeType: string;
  data: string;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
        inlineData?: { mimeType: string; data: string };
      }>;
    };
  }>;
}

interface SuccessResult {
  ok: true;
  data: {
    file: string;
    mimeType: string;
    model: string;
    aspectRatio: string;
    prompt: string;
  };
}

interface ErrorResult {
  ok: false;
  error: string;
}

// ── Proxy ───────────────────────────────────────────────────────────────────

function getProxyUrl(): string | undefined {
  return (
    process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    process.env.HTTP_PROXY ||
    process.env.http_proxy ||
    process.env.ALL_PROXY
  );
}

function getProxyDispatcher(): Dispatcher | undefined {
  const proxyUrl = getProxyUrl();
  if (proxyUrl) {
    return new ProxyAgent(proxyUrl);
  }
  return undefined;
}

// ── Config ──────────────────────────────────────────────────────────────────

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-3-pro-image-preview";

const ASPECT_RATIOS = new Set([
  "1:1",
  "2:3",
  "3:2",
  "3:4",
  "4:3",
  "4:5",
  "5:4",
  "9:16",
  "16:9",
  "21:9",
]);

// ── Arg Parsing ─────────────────────────────────────────────────────────────

function parseArgs(argv: string[]): Args {
  const args: Args = {
    prompt: "",
    output: "",
    aspectRatio: "16:9",
    reference: "",
    model: process.env.GEMINI_IMAGE_MODEL || DEFAULT_MODEL,
    negativePrompt: "",
  };

  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case "--prompt":
        args.prompt = argv[++i] || "";
        break;
      case "--output":
        args.output = argv[++i] || "";
        break;
      case "--aspect-ratio":
        args.aspectRatio = argv[++i] || "16:9";
        break;
      case "--reference":
        args.reference = argv[++i] || "";
        break;
      case "--model":
        args.model = argv[++i] || DEFAULT_MODEL;
        break;
      case "--negative-prompt":
        args.negativePrompt = argv[++i] || "";
        break;
      case "--help":
      case "-h":
        console.log(
          "Usage: npx tsx generate-image.ts --prompt <text> --output <path> [--aspect-ratio 16:9] [--reference <image>] [--model <model>] [--negative-prompt <text>]",
        );
        process.exit(0);
      default:
        if (argv[i]?.startsWith("-")) {
          console.error(`Unknown option: ${argv[i]}`);
          process.exit(1);
        }
    }
  }

  if (!args.prompt) {
    console.error("Error: --prompt is required");
    process.exit(1);
  }
  if (!args.output) {
    console.error("Error: --output is required");
    process.exit(1);
  }
  if (!ASPECT_RATIOS.has(args.aspectRatio)) {
    console.error(
      `Warning: aspect ratio "${args.aspectRatio}" may not be supported, using anyway`,
    );
  }
  return args;
}

// ── Image I/O ───────────────────────────────────────────────────────────────

function readImageAsBase64(filePath: string): ImageData {
  const absPath = resolve(filePath);
  const buf = readFileSync(absPath);
  const ext = extname(absPath).toLowerCase();
  const mimeMap: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
  };
  return {
    mimeType: mimeMap[ext] || "image/png",
    data: buf.toString("base64"),
  };
}

function saveBase64Image(base64Data: string, outputPath: string): string {
  const absPath = resolve(outputPath);
  mkdirSync(dirname(absPath), { recursive: true });
  const buf = Buffer.from(base64Data, "base64");
  writeFileSync(absPath, buf);
  return absPath;
}

// ── API Call ────────────────────────────────────────────────────────────────

async function generateImage(args: Args, apiKey: string): Promise<ImageData> {
  const url = `${API_BASE}/${args.model}:generateContent?key=${apiKey}`;

  const parts: Array<Record<string, unknown>> = [];

  if (args.reference) {
    const refImage = readImageAsBase64(args.reference);
    parts.push({ inlineData: refImage });
    parts.push({
      text: `Using the provided image as a style reference, generate the following:\n\n${args.prompt}`,
    });
  } else {
    parts.push({ text: args.prompt });
  }

  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ["IMAGE", "TEXT"],
    },
  };

  const proxyUrl = getProxyUrl();
  console.error(`[image-gen] Model: ${args.model}`);
  console.error(`[image-gen] Aspect ratio: ${args.aspectRatio}`);
  console.error(`[image-gen] Prompt: ${args.prompt.slice(0, 100)}...`);
  if (args.reference) {
    console.error(`[image-gen] Reference: ${args.reference}`);
  }
  if (proxyUrl) {
    console.error(`[image-gen] Proxy: ${proxyUrl}`);
  }

  const fetchOptions: RequestInit & { dispatcher?: Dispatcher } = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };

  const dispatcher = getProxyDispatcher();
  if (dispatcher) {
    fetchOptions.dispatcher = dispatcher;
  }

  const resp = await fetch(url, fetchOptions);

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`API error ${resp.status}: ${errText}`);
  }

  const data = (await resp.json()) as GeminiResponse;

  const candidates = data.candidates || [];
  if (candidates.length === 0) {
    throw new Error("No candidates in API response");
  }

  const contentParts = candidates[0].content?.parts || [];
  const imagePart = contentParts.find((p) =>
    p.inlineData?.mimeType?.startsWith("image/"),
  );

  if (!imagePart?.inlineData) {
    const textParts = contentParts.filter((p) => p.text);
    const textResponse = textParts.map((p) => p.text).join("\n");
    throw new Error(
      `No image in response. Text response: ${textResponse.slice(0, 200)}`,
    );
  }

  return imagePart.inlineData;
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Error: GEMINI_API_KEY environment variable is required");
    process.exit(1);
  }

  const args = parseArgs(process.argv.slice(2));

  try {
    const imageData = await generateImage(args, apiKey);
    const savedPath = saveBase64Image(imageData.data, args.output);

    const result: SuccessResult = {
      ok: true,
      data: {
        file: savedPath,
        mimeType: imageData.mimeType,
        model: args.model,
        aspectRatio: args.aspectRatio,
        prompt: args.prompt,
      },
    };

    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    const result: ErrorResult = {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
    console.log(JSON.stringify(result, null, 2));
    process.exit(1);
  }
}

main();
