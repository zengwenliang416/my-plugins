# React Code Generation Conventions

## Component Structure

- Functional components only (no class components)
- One component per file, file named after component in PascalCase
- Default export for page-level components
- Named exports for reusable sub-components

## JSX Rules

- Use semantic HTML elements:
  - `<button>` for clickable actions (not `<div onClick>`)
  - `<nav>` for navigation containers
  - `<header>`, `<main>`, `<footer>` for page structure
  - `<section>`, `<article>` for content blocks
  - `<ul>/<ol>` + `<li>` for lists
  - `<form>`, `<label>`, `<input>` for form elements
- Use fragments `<>...</>` to avoid unnecessary wrapper divs
- Key prop on list items MUST use stable identifiers (not array index)

## Styling

- CSS Modules (`.module.css` files) as default styling approach
- Import as: `import styles from './ComponentName.module.css'`
- Apply as: `className={styles.container}`
- CSS custom properties for design tokens: `var(--color-primary)`
- Unit conversion: design px values used directly (framework handles responsive)

## State Management

- `useState` for component-local state
- `useReducer` for complex state logic
- Follow project conventions if detected (Redux, Zustand, Jotai, etc.)

## Hooks

- `useEffect` for side effects (API calls, subscriptions)
- `useCallback` for event handlers passed to children
- `useMemo` for expensive computations
- Custom hooks for reusable logic: `use[Feature].js`

## Event Handling

- Handler naming: `handle[Event]` (e.g., `handleClick`, `handleSubmit`)
- Arrow functions for inline handlers
- Named functions for complex handlers

## File Organization

```
components/
├── PageName/
│   ├── index.jsx            — page entry, assembles sub-components
│   ├── PageName.module.css  — page-level styles
│   ├── Header.jsx           — sub-component
│   ├── Header.module.css
│   ├── ContentCard.jsx
│   └── ContentCard.module.css
└── shared/
    └── Button.jsx           — reusable across pages
```

## Code Template

```jsx
import styles from './ComponentName.module.css';

export default function ComponentName({ prop1, prop2 }) {
  return (
    <section className={styles.container}>
      <h2 className={styles.title}>{prop1}</h2>
      <p className={styles.description}>{prop2}</p>
    </section>
  );
}
```
