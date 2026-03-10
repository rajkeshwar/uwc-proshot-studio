import type { IAppState } from './types.js';
import type { EventBus } from './event-bus.js';

/**
 * Central application state.
 * Notifies subscribers on every mutation via the EventBus.
 * Single Responsibility: owns only shared cross-plugin data.
 */
export class AppState implements IAppState {
  private _activeTab = 'bg-studio';
  private _studioOriginalBmp: ImageBitmap | null = null;
  private _studioResultBmp:   ImageBitmap | null = null;
  private _cropResultBmp:     ImageBitmap | null = null;
  private _passportSourceBmp: ImageBitmap | null = null;
  private _enhanceSourceBmp:  ImageBitmap | null = null;
  private _globalStatus = 'Ready';
  private _globalStatusActive = false;

  constructor(private readonly _bus: EventBus) {}

  get activeTab() { return this._activeTab; }
  set activeTab(v: string) {
    this._activeTab = v;
    this._bus.emit('tab:switch', { tabId: v });
  }

  get studioOriginalBmp() { return this._studioOriginalBmp; }
  set studioOriginalBmp(v: ImageBitmap | null) { this._studioOriginalBmp = v; }

  get studioResultBmp() { return this._studioResultBmp; }
  set studioResultBmp(v: ImageBitmap | null) {
    this._studioResultBmp = v;
    if (v) this._bus.emit('studio:result', { bmp: v });
  }

  get cropResultBmp() { return this._cropResultBmp; }
  set cropResultBmp(v: ImageBitmap | null) { this._cropResultBmp = v; }

  get passportSourceBmp() { return this._passportSourceBmp; }
  set passportSourceBmp(v: ImageBitmap | null) {
    this._passportSourceBmp = v;
    if (v) this._bus.emit('send:to-passport', { bmp: v });
  }

  get enhanceSourceBmp() { return this._enhanceSourceBmp; }
  set enhanceSourceBmp(v: ImageBitmap | null) {
    this._enhanceSourceBmp = v;
    if (v) this._bus.emit('send:to-enhance', { bmp: v });
  }

  get globalStatus() { return this._globalStatus; }
  get globalStatusActive() { return this._globalStatusActive; }

  setStatus(msg: string, active = false): void {
    this._globalStatus = msg;
    this._globalStatusActive = active;
    this._bus.emit('status:update', { msg, active });
  }
}
