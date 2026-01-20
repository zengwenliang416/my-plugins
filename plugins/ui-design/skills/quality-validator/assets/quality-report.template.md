# Quality Validation Report

## Scope

- **Variant**: ${VARIANT_ID}
- **Tech Stack**: ${TECH_STACK}
- **Validated**: ${TIMESTAMP}

---

## Design Checks

### Color Consistency

| Check | Status | Details |
|-------|--------|---------|
| Uses defined palette | ${PALETTE_STATUS} | ${PALETTE_DETAILS} |
| Contrast ratios | ${CONTRAST_STATUS} | ${CONTRAST_DETAILS} |

### Spacing System

| Check | Status | Details |
|-------|--------|---------|
| Uses 4px grid | ${GRID_STATUS} | ${GRID_DETAILS} |
| Consistent margins | ${MARGIN_STATUS} | ${MARGIN_DETAILS} |

### Typography

| Check | Status | Details |
|-------|--------|---------|
| Font scale | ${FONT_STATUS} | ${FONT_DETAILS} |
| Line heights | ${LH_STATUS} | ${LH_DETAILS} |

---

## Code Quality

### Component Structure

| Check | Status | Details |
|-------|--------|---------|
| Props interface | ${PROPS_STATUS} | ${PROPS_DETAILS} |
| Default export | ${EXPORT_STATUS} | ${EXPORT_DETAILS} |

### Style Consistency

| Check | Status | Details |
|-------|--------|---------|
| Single styling method | ${STYLE_STATUS} | ${STYLE_DETAILS} |
| Responsive classes | ${RESPONSIVE_STATUS} | ${RESPONSIVE_DETAILS} |

---

## Accessibility

| Check | Severity | Status | Details |
|-------|----------|--------|---------|
| Semantic HTML | Error | ${SEMANTIC_STATUS} | ${SEMANTIC_DETAILS} |
| Alt text | Error | ${ALT_STATUS} | ${ALT_DETAILS} |
| Focus styles | Error | ${FOCUS_STATUS} | ${FOCUS_DETAILS} |

---

## Summary

| Category | Score |
|----------|-------|
| Design | ${DESIGN_SCORE}/100 |
| Code | ${CODE_SCORE}/100 |
| Accessibility | ${A11Y_SCORE}/100 |
| **Overall** | **${OVERALL_SCORE}/100** |

**Grade**: ${GRADE}
