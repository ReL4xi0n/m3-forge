# Frameworks

The shipped CSS classes are the components in every framework. A framework component is a thin
wrapper that renders the same markup as `components.md` and passes attributes through. No
CSS-in-JS, no Tailwind or other utility classes, no component library, no inline style values
other than the page inputs (`--m3-slider-value`, `--m3-progress-value`).

Import the skill files once in the entry module, in the order of `setup.md`:

```js
import './styles/m3/fonts.css';
import './styles/m3/tokens.css';
import './styles/m3/theme.css';
import './styles/m3/button.css'; // each component part used
import './styles/m3/behaviors.js'; // defines window.M3
import './styles/app.css';
```

`behaviors.js` is a classic script that sets `window.M3`; in TypeScript declare it
(`declare global { interface Window { M3: any } }`). Call `M3` in mount hooks, never at import time
on the server (SSR).

## React

```jsx
export function Button({ kind = 'filled', size, icon, children, className = '', ...rest }) {
  const cls = ['m3-button', `m3-button--${kind}`, size && `m3-button--${size}`, className]
    .filter(Boolean).join(' ');
  return (
    <button className={cls} {...rest}>
      {icon && <span className="m3-icon" aria-hidden="true">{icon}</span>}
      {children}
    </button>
  );
}
```

Page inputs are style props: `<div className="m3-slider" style={{ '--m3-slider-value': (value - min) / (max - min) }}>`.
Overlays: keep a ref and drive the element, for example
`useEffect(() => { const d = window.M3.dialog(ref.current); open ? d.open() : d.close(); }, [open])`.

## Vue

```vue
<script setup>
defineProps({ kind: { type: String, default: 'filled' }, size: String, icon: String });
</script>

<template>
  <button :class="['m3-button', `m3-button--${kind}`, size && `m3-button--${size}`]">
    <span v-if="icon" class="m3-icon" aria-hidden="true">{{ icon }}</span>
    <slot />
  </button>
</template>
```

Attributes such as `aria-pressed`, `disabled` and `@click` fall through to the `<button>`.
Use `onMounted(() => window.M3.ripple(document))` once in the root component.

## Svelte

```svelte
<script>
  let { kind = 'filled', size, icon, children, ...rest } = $props();
</script>

<button class={['m3-button', `m3-button--${kind}`, size && `m3-button--${size}`].filter(Boolean).join(' ')} {...rest}>
  {#if icon}<span class="m3-icon" aria-hidden="true">{icon}</span>{/if}
  {@render children?.()}
</button>
```

Svelte 4 uses `export let kind = 'filled'`, `$$restProps` and `<slot />` instead. Call `M3` from
`onMount`.

## Rules for wrappers

- One wrapper per component the UI uses, in the project's components folder; prop names map to the
  modifier classes (`kind`, `size`, `variant`), nothing else.
- Keep the native element (`button`, `a`, `input`, `dialog`) and its ARIA from `components.md`;
  icon-only wrappers require an `aria-label` prop.
- State that CSS cannot read comes from props: `aria-pressed`, `aria-current`, `aria-selected`,
  `data-open`, `--m3-slider-value`, `--m3-progress-value`.
- Layout (grid, flex, gaps with `--md-sys-space-*`) lives in the page's own CSS files or the
  framework's scoped `<style>`, using only token variables.
