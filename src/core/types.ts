// ─── Plugin Interface ────────────────────────────────────────────────────────
export interface IPlugin {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  /** Called once when the plugin is registered with the engine */
  register(engine: IEngine): void;
  /** Returns the custom-element tag name for the panel workspace */
  getPanelTag(): string;
}

// ─── Engine Interface (Dependency Inversion) ─────────────────────────────────
export interface IEngine {
  readonly state: IAppState;
  readonly bus: IEventBus;
  registerPlugin(plugin: IPlugin): void;
  getPlugins(): IPlugin[];
  switchTab(pluginId: string): void;
  notify(msg: string, type?: NotificationType): void;
  showLoader(title: string, desc: string): void;
  updateLoader(pct: number, msg: string): void;
  hideLoader(): void;
}

// ─── Application State ───────────────────────────────────────────────────────
export interface IAppState {
  activeTab: string;
  studioOriginalBmp: ImageBitmap | null;
  studioResultBmp: ImageBitmap | null;
  cropResultBmp: ImageBitmap | null;
  passportSourceBmp: ImageBitmap | null;
  enhanceSourceBmp: ImageBitmap | null;
  globalStatus: string;
  globalStatusActive: boolean;
}

// ─── Event Bus Types ─────────────────────────────────────────────────────────
export type NotificationType = 'info' | 'success' | 'error';

export interface AppEventMap {
  'tab:switch':        { tabId: string };
  'studio:result':     { bmp: ImageBitmap };
  'send:to-crop':      { bmp: ImageBitmap };
  'send:to-enhance':   { bmp: ImageBitmap };
  'send:to-passport':  { bmp: ImageBitmap };
  'notify':            { msg: string; type: NotificationType };
  'status:update':     { msg: string; active: boolean };
  'loader:show':       { title: string; desc: string };
  'loader:update':     { pct: number; msg: string };
  'loader:hide':       Record<string, never>;
}

export type AppEventKey = keyof AppEventMap;
export type AppEventHandler<K extends AppEventKey> = (payload: AppEventMap[K]) => void;

export interface IEventBus {
  on<K extends AppEventKey>(event: K, handler: AppEventHandler<K>): void;
  off<K extends AppEventKey>(event: K, handler: AppEventHandler<K>): void;
  emit<K extends AppEventKey>(event: K, payload: AppEventMap[K]): void;
}

// ─── Shared Data Models ───────────────────────────────────────────────────────
export interface SwatchDef {
  color: string;
  label?: string;
  transparent?: boolean;
}

export interface PillDef {
  id: string;
  label: string;
}

export interface BgGradientDef {
  id: string;
  css: string;
  label: string;
}

export interface PassportStandard {
  w: number; // mm
  h: number; // mm
  label: string;
}

export interface PaperSize {
  w: number; // mm
  h: number; // mm
  label: string;
}

export interface EnhanceParams {
  brightness: number;
  contrast: number;
  saturation: number;
  warmth: number;
  sharpen: number;
  blur: number;
  vignette: number;
}

export interface FaceDetectionResult {
  x: number;
  y: number;
  w: number;
  h: number;
  top: number;
  left: number;
}
