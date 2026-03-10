/**
 * ProShot Studio — main.ts
 *
 * Bootstrap sequence:
 * 1. Import the engine singleton
 * 2. Register all plugins (Open/Closed: add new plugins here without touching engine)
 * 3. Mount the <ps-app> root component (auto-registered via @customElement)
 *
 * To add a new plugin in the future:
 *   import { MyPlugin } from './plugins/my-plugin/my-plugin.plugin.js';
 *   engine.registerPlugin(new MyPlugin());
 */

import { engine } from './core/engine.js';

// ── Plugin imports ────────────────────────────────────────────────────────────
import { BgStudioPlugin }      from './plugins/bg-studio/bg-studio.plugin.js';
import { SmartCropPlugin }     from './plugins/smart-crop/smart-crop.plugin.js';
import { PassportPrintPlugin } from './plugins/passport-print/passport-print.plugin.js';
import { EnhancePlugin }       from './plugins/enhance/enhance.plugin.js';

// ── App shell ─────────────────────────────────────────────────────────────────
import './app/ps-app.js';

// ── Register plugins ──────────────────────────────────────────────────────────
engine.registerPlugin(new BgStudioPlugin());
engine.registerPlugin(new SmartCropPlugin());
engine.registerPlugin(new PassportPrintPlugin());
engine.registerPlugin(new EnhancePlugin());

// ── Mount app shell ───────────────────────────────────────────────────────────
const root = document.getElementById('app');
if (root) {
  root.innerHTML = '<ps-app></ps-app>';
}
