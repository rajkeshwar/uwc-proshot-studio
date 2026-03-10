import type { AppEventKey, AppEventMap, AppEventHandler, IEventBus } from './types.js';

/**
 * Lightweight, type-safe event bus.
 * Follows the Open/Closed Principle — subscribers add/remove handlers without
 * modifying the bus implementation.
 */
export class EventBus implements IEventBus {
  private readonly _listeners = new Map<string, Set<Function>>();

  on<K extends AppEventKey>(event: K, handler: AppEventHandler<K>): void {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event)!.add(handler);
  }

  off<K extends AppEventKey>(event: K, handler: AppEventHandler<K>): void {
    this._listeners.get(event)?.delete(handler);
  }

  emit<K extends AppEventKey>(event: K, payload: AppEventMap[K]): void {
    this._listeners.get(event)?.forEach(h => h(payload));
  }

  /** Remove all listeners (useful for testing / cleanup) */
  clear(): void {
    this._listeners.clear();
  }
}
