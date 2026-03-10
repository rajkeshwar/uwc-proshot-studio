# ProShot Studio v2 — TypeScript + Lit

> AI Headshot Suite rewritten with TypeScript, Lit Web Components, SOLID architecture, and a plugin system.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start development server (auto-opens browser)
npm start

# 3. Production build → ./dist/
npm run build
```

---

## Architecture

### Design Principles

| Principle | How Applied |
|-----------|------------|
| **S**ingle Responsibility | Each file has one job: Engine orchestrates, EventBus signals, AppState stores, ImageUtils renders, plugins handle UI |
| **O**pen/Closed | New plugins are added by calling `engine.registerPlugin(new MyPlugin())` in `main.ts` — zero changes to the engine |
| **L**iskov Substitution | All plugins implement `IPlugin`; the shell works with any plugin interchangeably |
| **I**nterface Segregation | `IEngine` only exposes what plugins need (bus, state, notify, loader); plugins don't depend on internal engine details |
| **D**ependency Inversion | Plugins depend on `IEngine` (interface), not the concrete `Engine` class |

### Directory Structure

```
src/
├── core/
│   ├── types.ts          ← All TypeScript interfaces & contracts
│   ├── event-bus.ts      ← Typed publish/subscribe event system
│   ├── app-state.ts      ← Shared reactive state store
│   ├── image-utils.ts    ← Pure canvas/bitmap helper functions
│   └── engine.ts         ← Plugin registry + app orchestrator (singleton)
│
├── components/           ← Reusable Lit Web Components (exportable for standalone use)
│   ├── ps-drop-zone.ts       <ps-drop-zone>
│   ├── ps-slider.ts          <ps-slider>
│   ├── ps-swatch-picker.ts   <ps-swatch-picker>
│   ├── ps-preset-pills.ts    <ps-preset-pills>
│   ├── ps-toggle.ts          <ps-toggle>
│   ├── ps-progress-bar.ts    <ps-progress-bar>
│   ├── ps-notification-host.ts <ps-notification-host>
│   ├── ps-loader-overlay.ts  <ps-loader-overlay>
│   └── index.ts              ← barrel export
│
├── plugins/
│   ├── bg-studio/
│   │   ├── bg-studio.plugin.ts      ← IPlugin implementation
│   │   └── bg-studio-panel.ts       ← <ps-bg-studio-panel>
│   ├── smart-crop/
│   │   ├── smart-crop.plugin.ts
│   │   └── smart-crop-panel.ts      ← <ps-smart-crop-panel>
│   ├── passport-print/
│   │   ├── passport-print.plugin.ts
│   │   └── passport-print-panel.ts  ← <ps-passport-print-panel>
│   └── enhance/
│       ├── enhance.plugin.ts
│       └── enhance-panel.ts         ← <ps-enhance-panel>
│
├── app/
│   ├── ps-header.ts      ← <ps-header> — tab navigation bar
│   └── ps-app.ts         ← <ps-app>    — root shell
│
└── main.ts               ← Bootstrap: register plugins, mount app
```

---

## Plugin System

### Adding a New Plugin

1. **Create the panel component** in `src/plugins/my-plugin/my-plugin-panel.ts`:

```typescript
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { engine } from '../../core/engine.js';

@customElement('ps-my-plugin-panel')
export class PsMyPluginPanel extends LitElement {
  // Your panel UI here
  render() { return html`<div>My Plugin</div>`; }
}
```

2. **Create the plugin descriptor** in `src/plugins/my-plugin/my-plugin.plugin.ts`:

```typescript
import type { IPlugin, IEngine } from '../../core/types.js';
import './my-plugin-panel.js';

export class MyPlugin implements IPlugin {
  readonly id    = 'my-plugin';
  readonly label = 'My Plugin';
  readonly icon  = '🔧';

  register(_engine: IEngine): void {
    // Subscribe to bus events here if needed
  }

  getPanelTag(): string { return 'ps-my-plugin-panel'; }
}
```

3. **Register in `main.ts`** — the only file you touch:

```typescript
import { MyPlugin } from './plugins/my-plugin/my-plugin.plugin.js';
engine.registerPlugin(new MyPlugin());
```

That's it. **Zero changes to the engine, shell, or other plugins.**

---

## Reusable Web Components

All components in `src/components/` are independent Lit custom elements with full Shadow DOM encapsulation. Use them standalone:

```html
<!-- In any HTML page: -->
<script type="module" src="dist/components/ps-slider.js"></script>
<ps-slider label="Brightness" min="0" max="200" value="100"></ps-slider>
```

### Component API

| Component | Properties | Events |
|-----------|-----------|--------|
| `<ps-drop-zone>` | `icon`, `label`, `hint`, `accept` | `ps-file-selected({ file })` |
| `<ps-slider>` | `label`, `min`, `max`, `value`, `step`, `unit`, `disabled` | `ps-change({ value })` |
| `<ps-swatch-picker>` | `swatches[]`, `value`, `showCustom` | `ps-color-change({ color })` |
| `<ps-preset-pills>` | `pills[]`, `value` | `ps-select({ id })` |
| `<ps-toggle>` | `label`, `checked`, `disabled` | `ps-change({ checked })` |
| `<ps-progress-bar>` | `value`, `message`, `visible` | — |
| `<ps-notification-host>` | — | `push(msg, type)` method |
| `<ps-loader-overlay>` | `visible`, `title`, `desc`, `sub`, `progress` | — |

---

## CSS Design Tokens

All visual tokens are CSS custom properties defined in `index.html :root`.
Override them to theme the entire app:

```css
:root {
  --ps-bg:       #0b0d0f;   /* App background */
  --ps-surface:  #13161a;   /* Header / sidebar */
  --ps-panel:    #1a1e24;   /* Cards / inputs */
  --ps-border:   #252a32;   /* Primary borders */
  --ps-border2:  #2e3440;   /* Secondary borders */
  --ps-text:     #e8eaf0;   /* Body text */
  --ps-muted:    #6b7280;   /* Labels / hints */
  --ps-accent:   #22d3c8;   /* Primary brand cyan */
  --ps-accent2:  #0e9e95;   /* Darker brand cyan */
  --ps-amber:    #f59e0b;   /* Warning */
  --ps-green:    #22c55e;   /* Success */
  --ps-red:      #ef4444;   /* Error */
  --ps-radius:   6px;       /* Border radius */
  --ps-font-body:    'Plus Jakarta Sans', sans-serif;
  --ps-font-display: 'Syne', sans-serif;
}
```

---

## Cross-Plugin Communication (EventBus)

Plugins communicate exclusively through typed events — no direct references:

```typescript
// BG Studio → Smart Crop
engine.bus.emit('send:to-crop', { bmp: resultBitmap });

// BG Studio → Enhance
engine.bus.emit('send:to-enhance', { bmp: resultBitmap });

// Smart Crop → Passport Print
engine.bus.emit('send:to-passport', { bmp: croppedBitmap });
```

---

## Tech Stack

- **[Lit](https://lit.dev/)** — Web Components with reactive templates
- **TypeScript 5** — Strict typed codebase
- **[@web/dev-server](https://modern-web.dev/docs/dev-server/)** — Fast dev server with HMR
- **[Rollup](https://rollupjs.org/)** — Production bundler with code splitting
- **[@imgly/background-removal](https://www.npmjs.com/package/@imgly/background-removal)** — Client-side AI background removal (U2-Net, WASM)
