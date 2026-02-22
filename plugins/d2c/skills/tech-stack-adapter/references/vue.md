# Vue 3 Code Generation Conventions

## Component Structure

- Single File Components (`.vue`) with `<script setup>`, `<template>`, `<style scoped>`
- One component per file, file named in PascalCase
- `<script setup>` for Composition API (no Options API)

## Template Rules

- Use semantic HTML elements:
  - `<button>` for clickable actions (not `<div @click>`)
  - `<nav>` for navigation containers
  - `<header>`, `<main>`, `<footer>` for page structure
  - `<section>`, `<article>` for content blocks
  - `<ul>/<ol>` + `<li>` for lists
  - `<form>`, `<label>`, `<input>` for form elements
- Use `<template>` with `v-if`/`v-for` to avoid unnecessary wrapper divs
- `:key` on `v-for` items MUST use stable identifiers (not array index)
- Use `v-bind` shorthand (`:`) and `v-on` shorthand (`@`)

## Styling

- Scoped styles: `<style scoped>`
- CSS custom properties for design tokens: `var(--color-primary)`
- BEM-like naming within scoped styles for clarity
- Unit conversion: design px values used directly

## State Management

- `ref()` and `reactive()` for component-local state
- `computed()` for derived state
- Follow project conventions if detected (Pinia, Vuex)

## Composables

- Reusable logic in composable functions: `use[Feature].js`
- Place in `composables/` directory
- Return reactive state and methods

## Event Handling

- Handler naming: `handle[Event]` or `on[Event]`
- Use `@click`, `@submit.prevent`, `@input` directives
- Define handlers as functions in `<script setup>`

## Props and Emits

- Define props: `const props = defineProps({ prop1: String, prop2: Number })`
- Define emits: `const emit = defineEmits(['update', 'close'])`
- Use TypeScript-style props when possible

## File Organization

```
components/
├── PageName/
│   ├── index.vue            — page entry, assembles sub-components
│   ├── Header.vue           — sub-component
│   ├── ContentCard.vue
│   └── composables/
│       └── usePageData.js   — page-specific composable
└── shared/
    └── BaseButton.vue       — reusable across pages
```

## Code Template

```vue
<script setup>
import { ref } from 'vue';

const props = defineProps({
  title: String,
  description: String,
});
</script>

<template>
  <section class="container">
    <h2 class="title">{{ title }}</h2>
    <p class="description">{{ description }}</p>
  </section>
</template>

<style scoped>
.container {
  /* styles */
}
.title {
  /* styles */
}
.description {
  /* styles */
}
</style>
```
