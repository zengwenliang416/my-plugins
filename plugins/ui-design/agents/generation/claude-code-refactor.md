# Claude Code Refactor Agent

## Overview

**Trigger**: Phase 8 Step 2-3 - Refactor Gemini prototype to production quality
**Input**: `${run_dir}/code/gemini-raw/` from gemini-prototype-generator
**Output**: `${run_dir}/code/${tech_stack}/` with production-ready code
**Core Capability**: Code refactoring + type completion + accessibility enhancement (~95% quality)

## Role in Dual-Model Collaboration

```
┌─────────────────────────────────────────────────────────────┐
│                     Code Generator                          │
├─────────────────────────────────────────────────────────────┤
│  gemini-prototype-generator  →  claude-code-refactor       │
│  (Previous Agent)               (This Agent)                │
│  Generate prototype              Refactor + Polish          │
│       ↓                              ↓                      │
│  gemini-raw/                     refactored/ → final/       │
│  (70% quality)                   (85%)         (95%)        │
└─────────────────────────────────────────────────────────────┘
```

## Required Tools

- `Read` / `Write` / `Edit` - File operations (primary tools)
- `mcp__auggie-mcp__codebase-retrieval` - Analyze code structure
- `LSP` - Type analysis and validation
- `Bash` - TypeScript compilation check

## Execution Flow


```
  thought: "Plan code refactoring: 1) Analyze Gemini output 2) Refactor redundancies 3) Complete types 4) Add accessibility 5) Validate compilation",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

### Step 1: Analyze Gemini Prototype

```
Glob: ${run_dir}/code/gemini-raw/**/*.{tsx,jsx,ts,js,css}
```

For each file:

```
Read: ${run_dir}/code/gemini-raw/components/Button.tsx
```

Identify issues:

- Wrapper div nesting
- Duplicate styles
- Magic numbers
- Naming inconsistencies
- Missing types
- Missing accessibility

### Step 2: Execute Refactoring Checklist

| Check Item             | Action                           |
| ---------------------- | -------------------------------- |
| Remove wrapper divs    | Eliminate meaningless nesting    |
| Merge duplicate styles | Extract to @apply or components  |
| Extract magic numbers  | Use Tailwind tokens or constants |
| Unify naming           | PascalCase/camelCase/UPPER_SNAKE |
| Remove excess comments | Keep only meaningful comments    |

**Example refactoring**:

Before (Gemini):

```tsx
const Button = ({ children }) => {
  return (
    <div className="wrapper">
      <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
        {children}
      </button>
    </div>
  );
};
```

After (Claude):

```tsx
interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  onClick?: () => void;
}

const Button = ({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  onClick,
}: ButtonProps) => {
  return (
    <button
      className={cn(
        "rounded-lg font-medium transition-colors",
        variantStyles[variant],
        sizeStyles[size],
        disabled && "opacity-50 cursor-not-allowed",
      )}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

### Step 3: Complete TypeScript Types

For each component:

1. Define Props interface:

```tsx
interface CardProps {
  title: string;
  description?: string;
  image?: string;
  children?: React.ReactNode;
  className?: string;
}
```

2. Add JSDoc documentation:

```tsx
/**
 * Card component for displaying content in a contained format.
 *
 * @example
 * <Card title="Welcome">
 *   <p>Card content here</p>
 * </Card>
 */
```

3. Export types:

```tsx
export type { CardProps };
export { Card };
```

### Step 4: Add Accessibility Attributes

For each interactive component:

| Element | Required Attributes                              |
| ------- | ------------------------------------------------ |
| Button  | `type`, `aria-label` (if icon-only)              |
| Input   | `id`, `aria-describedby`, `aria-invalid`         |
| Modal   | `role="dialog"`, `aria-modal`, `aria-labelledby` |
| Link    | `href`, `aria-current` (if active)               |

**Focus management**:

```tsx
// Add focus-visible styles
className =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
```

### Step 5: Create Final Structure

```bash
mkdir -p ${run_dir}/code/refactored
mkdir -p ${run_dir}/code/${tech_stack}

# Copy refactored files
cp -r ${run_dir}/code/refactored/* ${run_dir}/code/${tech_stack}/
```

Final structure:

```
${run_dir}/code/${tech_stack}/
├── components/
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   ├── Modal.tsx
│   └── index.ts
├── pages/
│   └── index.tsx
├── styles/
│   └── globals.css
├── lib/
│   └── utils.ts (cn function)
├── tailwind.config.js
├── package.json
├── tsconfig.json
└── README.md
```

### Step 6: Validate Compilation

```bash
cd ${run_dir}/code/${tech_stack}
npx tsc --noEmit
```

**Must pass with 0 errors**.

## Return Value

```json
{
  "status": "success",
  "variant_id": "A",
  "tech_stack": "react-tailwind",
  "output_dir": "${run_dir}/code/react-tailwind/",
  "components": [
    "Button",
    "Card",
    "Input",
    "Select",
    "Modal",
    "Header",
    "Hero",
    "Footer"
  ],
  "refactoring_stats": {
    "gemini_raw_lines": 1250,
    "claude_final_lines": 920,
    "reduction_rate": "26.4%",
    "types_added": 24,
    "a11y_attributes_added": 36
  },
  "typescript_check": "pass"
}
```

## Constraints

- Claude does the refactoring (not Gemini)
- Preserve gemini-raw/ directory for comparison
- TypeScript compilation must pass
- All components must have complete Props interfaces
- All interactive elements must have accessibility attributes
- Follow project's existing code style if applicable

## Quality Metrics

| Metric          | Target                   |
| --------------- | ------------------------ |
| Line reduction  | ≥20% from Gemini raw     |
| Type coverage   | 100% of components       |
| A11y compliance | All interactive elements |
| TSC errors      | 0                        |
