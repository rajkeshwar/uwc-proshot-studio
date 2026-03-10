import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { NotificationType } from '../core/types.js';

interface Toast { id: number; msg: string; type: NotificationType; }

/**
 * `<ps-notification-host>` — Fixed-position toast container.
 * Connect to the EventBus via `push()`.
 */
@customElement('ps-notification-host')
export class PsNotificationHost extends LitElement {
  @state() private _toasts: Toast[] = [];
  private _next = 0;

  static styles = css`
    :host {
      position: fixed;
      bottom: 1rem;
      right: 1rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      pointer-events: none;
    }
    .toast {
      padding: 0.6rem 1rem;
      border-radius: var(--ps-radius, 6px);
      font-size: 0.78rem;
      font-weight: 500;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
      animation: slide-up 0.2s ease;
      pointer-events: auto;
    }
    .info    { background: rgba(34,211,200,0.1);  color: var(--ps-accent,#22d3c8); border: 1px solid rgba(34,211,200,0.2); }
    .success { background: rgba(34,197,94,0.15);  color: var(--ps-green,#22c55e);  border: 1px solid rgba(34,197,94,0.3);  }
    .error   { background: rgba(239,68,68,0.15);  color: var(--ps-red,#ef4444);    border: 1px solid rgba(239,68,68,0.3);  }

    @keyframes slide-up {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `;

  push(msg: string, type: NotificationType = 'info'): void {
    const id = ++this._next;
    this._toasts = [...this._toasts, { id, msg, type }];
    setTimeout(() => { this._toasts = this._toasts.filter(t => t.id !== id); }, 3000);
  }

  render() {
    return html`
      ${this._toasts.map(t => html`
        <div class="toast ${t.type}">${t.msg}</div>
      `)}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'ps-notification-host': PsNotificationHost; }
}
