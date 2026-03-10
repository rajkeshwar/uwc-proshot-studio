import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { IPlugin } from '../core/types.js';
import { engine } from '../core/engine.js';

@customElement('ps-header')
export class PsHeader extends LitElement {
  @property({ type: Array }) plugins: IPlugin[] = [];
  @state() private _activeTab = 'bg-studio';
  @state() private _statusMsg = 'Ready';
  @state() private _statusActive = false;

  connectedCallback() {
    super.connectedCallback();
    engine.bus.on('tab:switch', ({ tabId }) => { this._activeTab = tabId; });
    engine.bus.on('status:update', ({ msg, active }) => { this._statusMsg = msg; this._statusActive = active; });
  }

  static styles = css`
    :host { display: block; }

    header {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 0 1.5rem;
      height: 52px;
      border-bottom: 1px solid var(--ps-border, #252a32);
      flex-shrink: 0;
      background: var(--ps-surface, #13161a);
    }

    .logo {
      font-family: var(--ps-font-display, 'Syne', sans-serif);
      font-weight: 800;
      font-size: 1.1rem;
      letter-spacing: -0.02em;
      white-space: nowrap;
      color: var(--ps-text, #e8eaf0);
    }
    .logo span { color: var(--ps-accent, #22d3c8); }

    nav.tabs {
      display: flex;
      gap: 2px;
      flex: 1;
    }

    .tab {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.35rem 0.9rem;
      font-size: 0.78rem;
      font-weight: 600;
      letter-spacing: 0.03em;
      border: none;
      background: none;
      color: var(--ps-muted, #6b7280);
      cursor: pointer;
      border-radius: var(--ps-radius, 6px);
      transition: all 0.15s;
      white-space: nowrap;
      font-family: inherit;
    }
    .tab:hover { color: var(--ps-text, #e8eaf0); background: var(--ps-border, #252a32); }
    .tab.active { color: var(--ps-bg, #0b0d0f); background: var(--ps-accent, #22d3c8); }

    .status-pill {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.7rem;
      padding: 0.25rem 0.7rem;
      border-radius: 20px;
      background: var(--ps-panel, #1a1e24);
      border: 1px solid var(--ps-border2, #2e3440);
      color: var(--ps-muted, #6b7280);
      flex-shrink: 0;
      transition: color 0.2s, border-color 0.2s;
    }
    .status-pill.active { color: var(--ps-accent, #22d3c8); border-color: var(--ps-accent2, #0e9e95); }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

    @media (max-width: 767px) {
      nav.tabs { display: none; }
      .status-pill { display: none; }
      header { padding: 0 0.75rem; height: 48px; gap: 0.75rem; }
      .logo { font-size: 0.95rem; }
    }
  `;

  render() {
    return html`
      <header>
        <div class="logo">Pro<span>Shot</span></div>
        <nav class="tabs">
          ${this.plugins.map(p => html`
            <button
              class="tab ${this._activeTab === p.id ? 'active' : ''}"
              @click=${() => engine.switchTab(p.id)}
            >
              <span>${p.icon}</span> ${p.label}
            </button>
          `)}
        </nav>
        <div class="status-pill ${this._statusActive ? 'active' : ''}">
          <span class="status-dot"></span> ${this._statusMsg}
        </div>
      </header>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'ps-header': PsHeader; }
}
