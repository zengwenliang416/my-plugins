# Image Analysis Report

## Image Info

- **File**: ${IMAGE_PATH}
- **Analyzed**: ${TIMESTAMP}

---

## Color Analysis

### Primary Colors

| Color | Hex | RGB | Usage |
|-------|-----|-----|-------|
| ${COLOR_1_NAME} | ${COLOR_1_HEX} | ${COLOR_1_RGB} | ${COLOR_1_USAGE} |
| ${COLOR_2_NAME} | ${COLOR_2_HEX} | ${COLOR_2_RGB} | ${COLOR_2_USAGE} |
| ${COLOR_3_NAME} | ${COLOR_3_HEX} | ${COLOR_3_RGB} | ${COLOR_3_USAGE} |

### Color Scheme

- **Type**: ${SCHEME_TYPE}
- **Mood**: ${COLOR_MOOD}

---

## Layout Analysis

### Structure

- **Layout Type**: ${LAYOUT_TYPE}
- **Grid System**: ${GRID_COLUMNS} columns
- **Gutter**: ${GUTTER}

### Sections

| Section | Position | Size |
|---------|----------|------|
| ${SECTION_1} | ${POS_1} | ${SIZE_1} |
| ${SECTION_2} | ${POS_2} | ${SIZE_2} |

---

## Typography Analysis

### Fonts Detected

| Level | Font Family | Size | Weight |
|-------|-------------|------|--------|
| Heading | ${HEADING_FONT} | ${HEADING_SIZE} | ${HEADING_WEIGHT} |
| Body | ${BODY_FONT} | ${BODY_SIZE} | ${BODY_WEIGHT} |

---

## Component Analysis

### UI Components Identified

| Component | Count | Style Notes |
|-----------|-------|-------------|
| ${COMP_1} | ${COUNT_1} | ${NOTES_1} |
| ${COMP_2} | ${COUNT_2} | ${NOTES_2} |

---

## Extracted Design Tokens

\`\`\`json
{
  "colors": {
    "primary": "${PRIMARY_HEX}",
    "secondary": "${SECONDARY_HEX}",
    "background": "${BG_HEX}"
  },
  "typography": {
    "heading": "${HEADING_FONT}",
    "body": "${BODY_FONT}"
  },
  "spacing": {
    "base": "${BASE_SPACING}"
  }
}
\`\`\`
