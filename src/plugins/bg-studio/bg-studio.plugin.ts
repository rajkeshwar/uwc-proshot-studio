import type { IPlugin, IEngine } from '../../core/types.js';
import './bg-studio-panel.js';

/**
 * BG Studio Plugin — AI background removal.
 * Registers the panel component and listens for cross-plugin events.
 */
export class BgStudioPlugin implements IPlugin {
  readonly id    = 'bg-studio';
  readonly label = 'BG Studio';
  readonly icon  = '✦';

  register(_engine: IEngine): void {
    // Panel auto-registers via @customElement decorator on import
    // No additional setup required — follows Open/Closed Principle
  }

  getPanelTag(): string {
    return 'ps-bg-studio-panel';
  }
}
