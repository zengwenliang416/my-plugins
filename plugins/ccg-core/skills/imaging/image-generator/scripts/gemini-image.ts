#!/usr/bin/env tsx

/**
 * Gemini Image Generator
 * Calls Gemini API to generate images based on prompts
 *
 * Usage:
 *   npx tsx gemini-image.ts -p "prompt" -o "./output" [-m pro|flash] [-a 1:1|16:9|9:16] [-r 4K|1080p]
 */

import * as fs from "fs";
import * as path from "path";
import { ProxyAgent } from "undici";

interface GenerateOptions {
  prompt: string;
  model: "pro" | "flash";
  aspectRatio: string;
  resolution: string;
  outputDir: string;
}

interface GenerateResult {
  success: boolean;
  images: Array<{
    path: string;
    model: string;
  }>;
  error?: string;
  duration?: number;
}

const MODEL_MAP: Record<string, string> = {
  pro: "gemini-3-pro-image-preview",
  flash: "gemini-2.0-flash-preview-image-generation",
};

function parseArgs(): GenerateOptions {
  const args = process.argv.slice(2);
  const options: Partial<GenerateOptions> = {
    model: "pro",
    aspectRatio: "1:1",
    resolution: "4K",
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case "-p":
      case "--prompt":
        options.prompt = nextArg;
        i++;
        break;
      case "-m":
      case "--model":
        options.model = nextArg as "pro" | "flash";
        i++;
        break;
      case "-a":
      case "--aspect-ratio":
        options.aspectRatio = nextArg;
        i++;
        break;
      case "-r":
      case "--resolution":
        options.resolution = nextArg;
        i++;
        break;
      case "-o":
      case "--output":
        options.outputDir = nextArg;
        i++;
        break;
      case "-h":
      case "--help":
        printHelp();
        process.exit(0);
    }
  }

  if (!options.prompt) {
    console.error("Error: --prompt is required");
    printHelp();
    process.exit(1);
  }

  if (!options.outputDir) {
    options.outputDir = ".";
  }

  return options as GenerateOptions;
}

function printHelp(): void {
  console.log(`
Gemini Image Generator

Usage:
  npx tsx gemini-image.ts [OPTIONS]

Options:
  -p, --prompt <text>       Image description (required)
  -m, --model <type>        Model: pro | flash (default: pro)
  -a, --aspect-ratio <r>    Aspect ratio: 1:1 | 16:9 | 9:16 | 4:3 (default: 1:1)
  -r, --resolution <res>    Resolution: 4K | 1080p | 720p (default: 4K)
  -o, --output <dir>        Output directory (default: .)
  -h, --help                Show this help

Examples:
  npx tsx gemini-image.ts -p "A cute cat sitting on a windowsill" -o ./images
  npx tsx gemini-image.ts -p "Modern logo design" -m flash -a 1:1 -o ./output

Environment:
  GEMINI_API_KEY            Required. Your Gemini API key.
  HTTPS_PROXY               Optional. Proxy URL for API requests.
  `);
}

function getProxyDispatcher(): ProxyAgent | undefined {
  const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy;
  if (proxyUrl) {
    console.error(`Using proxy: ${proxyUrl}`);
    return new ProxyAgent(proxyUrl);
  }
  return undefined;
}

async function generateImage(
  options: GenerateOptions,
): Promise<GenerateResult> {
  const startTime = Date.now();
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      images: [],
      error: "GEMINI_API_KEY environment variable is not set",
    };
  }

  const modelId = MODEL_MAP[options.model] || MODEL_MAP.pro;

  // Ensure output directory exists
  if (!fs.existsSync(options.outputDir)) {
    fs.mkdirSync(options.outputDir, { recursive: true });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
    console.error(`API URL: ${url.replace(apiKey, "***")}`);

    const dispatcher = getProxyDispatcher();
    const fetchOptions: RequestInit & { dispatcher?: ProxyAgent } = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: options.prompt,
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["image", "text"],
        },
      }),
    };

    if (dispatcher) {
      fetchOptions.dispatcher = dispatcher;
    }

    const response = await fetch(url, fetchOptions as RequestInit);

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        images: [],
        error: `API error: ${response.status} - ${errorText}`,
      };
    }

    const data = await response.json();

    // Extract image from response
    const images: Array<{ path: string; model: string }> = [];

    if (data.candidates && data.candidates[0]?.content?.parts) {
      for (const part of data.candidates[0].content.parts) {
        if (part.inlineData?.mimeType?.startsWith("image/")) {
          const timestamp = Date.now();
          const filename = `gemini_${options.model}_${timestamp}.png`;
          const filepath = path.join(options.outputDir, filename);

          // Decode base64 and save
          const imageBuffer = Buffer.from(part.inlineData.data, "base64");
          fs.writeFileSync(filepath, imageBuffer);

          images.push({
            path: filepath,
            model: modelId,
          });
        }
      }
    }

    if (images.length === 0) {
      return {
        success: false,
        images: [],
        error:
          "No image generated in response. Raw: " +
          JSON.stringify(data).substring(0, 500),
        duration: Date.now() - startTime,
      };
    }

    return {
      success: true,
      images,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      images: [],
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    };
  }
}

async function main(): Promise<void> {
  const options = parseArgs();

  console.error(
    `Generating image with prompt: "${options.prompt.substring(0, 50)}..."`,
  );
  console.error(
    `Model: ${options.model}, Aspect: ${options.aspectRatio}, Resolution: ${options.resolution}`,
  );

  const result = await generateImage(options);

  // Output JSON result to stdout
  console.log(JSON.stringify(result, null, 2));

  process.exit(result.success ? 0 : 1);
}

// Run if called directly
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
