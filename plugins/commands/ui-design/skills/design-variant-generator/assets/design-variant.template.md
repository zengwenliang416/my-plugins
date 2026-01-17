# Design Variant - ${VARIANT_ID}

## Variant Info

- **ID**: ${VARIANT_ID}
- **Theme**: ${THEME_NAME}
- **Generated**: ${TIMESTAMP}

---

## Color System

### Primary Colors

\`\`\`css
:root {
  --color-primary: ${PRIMARY};
  --color-primary-light: ${PRIMARY_LIGHT};
  --color-primary-dark: ${PRIMARY_DARK};
}
\`\`\`

### Secondary Colors

\`\`\`css
:root {
  --color-secondary: ${SECONDARY};
  --color-accent: ${ACCENT};
}
\`\`\`

### Neutral Colors

\`\`\`css
:root {
  --color-background: ${BACKGROUND};
  --color-surface: ${SURFACE};
  --color-text-primary: ${TEXT_PRIMARY};
  --color-text-secondary: ${TEXT_SECONDARY};
}
\`\`\`

---

## Typography

### Font Families

\`\`\`css
:root {
  --font-heading: '${HEADING_FONT}', sans-serif;
  --font-body: '${BODY_FONT}', sans-serif;
  --font-mono: '${MONO_FONT}', monospace;
}
\`\`\`

### Font Scale

| Level | Size | Weight | Line Height |
|-------|------|--------|-------------|
| H1 | ${H1_SIZE} | ${H1_WEIGHT} | ${H1_LH} |
| H2 | ${H2_SIZE} | ${H2_WEIGHT} | ${H2_LH} |
| Body | ${BODY_SIZE} | ${BODY_WEIGHT} | ${BODY_LH} |

---

## Spacing System

\`\`\`css
:root {
  --spacing-xs: ${SPACING_XS};
  --spacing-sm: ${SPACING_SM};
  --spacing-md: ${SPACING_MD};
  --spacing-lg: ${SPACING_LG};
  --spacing-xl: ${SPACING_XL};
}
\`\`\`

---

## Component Styles

### Buttons

\`\`\`css
.btn-primary {
  background: var(--color-primary);
  border-radius: ${BTN_RADIUS};
  padding: ${BTN_PADDING};
}
\`\`\`

### Cards

\`\`\`css
.card {
  background: var(--color-surface);
  border-radius: ${CARD_RADIUS};
  box-shadow: ${CARD_SHADOW};
}
\`\`\`
