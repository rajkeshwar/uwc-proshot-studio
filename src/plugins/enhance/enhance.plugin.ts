import type { IPlugin, IEngine } from '../../core/types.js';
import './enhance-panel.js';

export class EnhancePlugin implements IPlugin {
  readonly id    = 'enhance';
  readonly label = 'Enhance';
  readonly icon  = '◈';

  register(_engine: IEngine): void {}

  getPanelTag(): string {
    return 'ps-enhance-panel';
  }
}
