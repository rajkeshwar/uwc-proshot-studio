import type { IPlugin, IEngine } from '../../core/types.js';
import './passport-print-panel.js';

export class PassportPrintPlugin implements IPlugin {
  readonly id    = 'passport-print';
  readonly label = 'Passport Print';
  readonly icon  = '⊞';

  register(_engine: IEngine): void {}

  getPanelTag(): string {
    return 'ps-passport-print-panel';
  }
}
