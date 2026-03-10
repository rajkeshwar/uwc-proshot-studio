import type { IPlugin, IEngine } from '../../core/types.js';
import './smart-crop-panel.js';

export class SmartCropPlugin implements IPlugin {
  readonly id    = 'smart-crop';
  readonly label = 'Smart Crop';
  readonly icon  = '⊡';

  register(_engine: IEngine): void {}

  getPanelTag(): string {
    return 'ps-smart-crop-panel';
  }
}
