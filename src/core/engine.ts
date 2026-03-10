import type { IPlugin, IEngine } from './types.js';
import type { NotificationType } from './types.js';
import { EventBus } from './event-bus.js';
import { AppState } from './app-state.js';

/**
 * Engine — the application core.
 *
 * SOLID principles applied:
 * - Open/Closed: new plugins register themselves without touching the engine.
 * - Dependency Inversion: plugins depend on IEngine, not the concrete class.
 * - Single Responsibility: orchestrates tabs/plugins, delegates state to AppState.
 */
export class Engine implements IEngine {
  readonly bus   = new EventBus();
  readonly state = new AppState(this.bus);

  private readonly _plugins = new Map<string, IPlugin>();
  private _tabSwitchCallback?: (pluginId: string) => void;

  registerPlugin(plugin: IPlugin): void {
    if (this._plugins.has(plugin.id)) {
      console.warn(`[Engine] Plugin "${plugin.id}" is already registered.`);
      return;
    }
    this._plugins.set(plugin.id, plugin);
    plugin.register(this);
  }

  getPlugins(): IPlugin[] {
    return [...this._plugins.values()];
  }

  switchTab(pluginId: string): void {
    this.state.activeTab = pluginId;
    this._tabSwitchCallback?.(pluginId);
  }

  /** Called by the shell component to hook tab rendering */
  onTabSwitch(cb: (pluginId: string) => void): void {
    this._tabSwitchCallback = cb;
    this.bus.on('tab:switch', ({ tabId }) => cb(tabId));
  }

  notify(msg: string, type: NotificationType = 'info'): void {
    this.bus.emit('notify', { msg, type });
  }

  showLoader(title: string, desc: string): void {
    this.bus.emit('loader:show', { title, desc });
  }

  updateLoader(pct: number, msg: string): void {
    this.bus.emit('loader:update', { pct, msg });
  }

  hideLoader(): void {
    this.bus.emit('loader:hide', {});
  }
}

/** Singleton engine instance shared across the whole app */
export const engine = new Engine();
