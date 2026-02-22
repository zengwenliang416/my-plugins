---
name: image-generator
description: "Generate 4K image assets from design analysis — backgrounds, maps, illustrations, decorative graphics via Gemini API"
allowed-tools:
  - Read
  - Write
  - Bash
arguments:
  - name: assets_file
    type: string
    required: true
    description: "Path to visual-analysis.md containing ## Image Assets section"
  - name: output_dir
    type: string
    required: true
    description: "Directory to save generated images"
  - name: design_screenshot
    type: string
    required: false
    description: "Path to original design screenshot for style reference conditioning"
---

# Image Generator Skill

Generate high-fidelity image assets identified during design analysis. Calls Gemini API directly via `generate-image.ts`.

## Environment

- `GEMINI_API_KEY` — required, must be set before invocation
- `GEMINI_IMAGE_MODEL` — optional, defaults to `gemini-3-pro-image-preview`

## Usage

```
Skill(skill="d2c:image-generator", args="assets_file=${RUN_DIR}/visual-analysis.md output_dir=${RUN_DIR}/generated-code/assets")
```

## Script

```bash
npx tsx ${SKILL_DIR}/scripts/generate-image.ts \
  --prompt "<composed prompt>" \
  --output "<output_dir>/<asset-name>.png" \
  --aspect-ratio "16:9" \
  [--reference "<design_screenshot>"]
```

## Behavior

**Core strategy: Section Background Images** — Generate full-section backgrounds that include ALL non-code visual elements as one cohesive image. Code overlays text/buttons/interactive elements on top.

1. Read `assets_file` and parse `## Page Background` to get page background color (e.g., `#FFFFFF`)
2. Read `assets_file` and parse the `## Image Assets` section
3. For each asset entry, compose a generation prompt from:
   - Asset `Description` field (the full scene description)
   - Asset `Visual Elements` list (all decorative/illustrative elements to include)
   - Asset `Code Overlay Zones` (areas to keep clean for text/buttons)
   - Page background color (for edge blending)
   - Style instruction derived from the design screenshot
3. Call `generate-image.ts` for each asset:
   - Map asset `Aspect Ratio` to `--aspect-ratio`
   - If `design_screenshot` is provided, pass as `--reference` for style conditioning
   - Save to `${output_dir}/${asset-name}.png`
4. Write `${output_dir}/asset-manifest.json`

## Prompt Composition Template

```
Generate a complete section background image for a web page:

[description from visual-analysis.md — the FULL scene including all illustrations, decorative elements, gradients, and patterns]

Layout requirements:
- Aspect ratio: [ratio]
- [Code Overlay Zones]: Leave [zone description] area clean/simple enough for text and buttons to be readable when overlaid on top
- All illustrative/decorative elements should be part of this single cohesive image
- Style: professional, clean, production-quality web UI background
- No text — all text will be overlaid by code
- High detail, 4K quality rendering

Edge blending (CRITICAL — prevents "pasted-on" look):
- The image background MUST be [page background color, e.g., pure white #FFFFFF]
- All edges of the image MUST seamlessly fade/blend into [page background color] with NO visible boundary
- Decorative elements near edges should naturally dissolve/fade out — never get cut off by a hard edge
- The transition from illustrated content to empty background must be gradual and organic
- If the section has a gradient background, the gradient must smoothly reach [page background color] at all four edges
```

**CRITICAL**: The generated image represents the ENTIRE visual layer of a section. Text, buttons, and interactive elements are NOT part of the image — they are rendered by code on top. The image must leave appropriate visual space (lighter/simpler areas) where code-rendered text will appear.

**Edge Blending Rule**: Read the page's overall background color from `visual-analysis.md` (usually white `#FFFFFF`). Substitute `[page background color]` in the prompt with this value. This ensures the generated image has zero visible boundary when placed on the page via `background-image`.

## Aspect Ratio Mapping

| Asset Layout | Ratio |
|-------------|-------|
| Full-width banner | `16:9` |
| Ultra-wide header | `21:9` |
| Card portrait | `3:4` |
| Square tile | `1:1` |
| Mobile full-screen | `9:16` |
| Standard landscape | `3:2` |

## Output

### asset-manifest.json
```json
{
  "assets": [
    {
      "name": "background-hero",
      "file": "background-hero.png",
      "type": "background",
      "aspect_ratio": "16:9",
      "model": "gemini-3-pro-image-preview",
      "status": "ok",
      "component": "HeroSection"
    }
  ],
  "total": 3,
  "succeeded": 3,
  "failed": 0
}
```

## Error Handling

- If `GEMINI_API_KEY` is missing, fail immediately with clear message
- If generation fails for one asset, log error and continue with remaining assets
- Record failures in manifest with `"status": "failed"` and error reason
- Never block entire workflow for a single asset failure
