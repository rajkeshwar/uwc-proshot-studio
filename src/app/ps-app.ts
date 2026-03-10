import { LitElement, css } from 'lit';
import { html as staticHtml, unsafeStatic } from 'lit/static-html.js';
import { customElement, state } from 'lit/decorators.js';
import { engine } from '../core/engine.js';
import type { IPlugin } from '../core/types.js';
import '../components/ps-notification-host.js';
import '../components/ps-loader-overlay.js';
import './ps-header.js';

@customElement('ps-app')
export class PsApp extends LitElement {
  @state() private _activeTab   = 'bg-studio';
  @state() private _plugins: IPlugin[] = [];
  @state() private _loaderVisible = false;
  @state() private _loaderTitle   = 'Loading AI Model';
  @state() private _loaderDesc    = 'Please wait…';
  @state() private _loaderSub     = 'Initialising…';
  @state() private _loaderPct     = 0;

  private _notifHost!: any;

  connectedCallback() {
    super.connectedCallback();
    this._plugins = engine.getPlugins();

    engine.bus.on('tab:switch',    ({ tabId }) => { this._activeTab = tabId; });
    engine.bus.on('notify',        ({ msg, type }) => this._notifHost?.push(msg, type));
    engine.bus.on('loader:show',   ({ title, desc }) => {
      this._loaderTitle = title;
      this._loaderDesc  = desc;
      this._loaderSub   = 'Initialising…';
      this._loaderPct   = 0;
      this._loaderVisible = true;
    });
    engine.bus.on('loader:update', ({ pct, msg }) => {
      this._loaderPct = pct;
      this._loaderSub = msg;
    });
    engine.bus.on('loader:hide',   () => { this._loaderVisible = false; });

    // Default to first plugin
    if (this._plugins.length > 0) this._activeTab = this._plugins[0].id;
  }

  protected firstUpdated() {
    this._notifHost = this.shadowRoot?.querySelector('ps-notification-host');
  }

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
      font-family: var(--ps-font-body, 'Plus Jakarta Sans', sans-serif);
      background: var(--ps-bg, #0b0d0f);
      color: var(--ps-text, #e8eaf0);
    }

    .workspaces {
      flex: 1;
      overflow: hidden;
      min-height: 0;
      /* Use position:relative so workspaces stack; active is shown, rest hidden */
      position: relative;
      display: flex;
      flex-direction: column;
    }

    .workspace {
      /* Hidden panels: removed from layout entirely */
      display: none;
      flex: 1;
      overflow: hidden;
      min-height: 0;
    }
    .workspace.active {
      display: flex;
    }

    /* ── Mobile bottom nav ── */
    /* Hidden on desktop, shown on mobile via media query */
    .mobile-nav {
      display: none;
      position: fixed;
      bottom: 0; left: 0; right: 0;
      background: var(--ps-surface, #13161a);
      border-top: 1px solid var(--ps-border, #252a32);
      z-index: 500;
      height: 56px;
    }
    .mnav-btn {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.15rem;
      font-size: 0.55rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--ps-muted, #6b7280);
      border: none;
      background: none;
      cursor: pointer;
      transition: color 0.15s;
      font-family: inherit;
      padding: 0;
    }
    .mnav-btn .icon { font-size: 1.1rem; line-height: 1; }
    .mnav-btn.active { color: var(--ps-accent, #22d3c8); }

    @media (max-width: 767px) {
      :host {
        overflow: auto;
        height: auto;
        min-height: 100dvh;
        padding-bottom: 56px;
      }
      /* Show mobile nav on small screens */
      .mobile-nav { display: flex; }
      .workspace.active { min-height: calc(100dvh - 104px); }
    }
  `;

  render() {
    /**
     * IMPORTANT: Lit's html`` tag cannot interpolate dynamic element tag names.
     * We use staticHtml + unsafeStatic from 'lit/static-html.js' for that purpose.
     *
     * All plugin panels are always mounted in the DOM (display toggled via CSS).
     * This preserves component state (canvas pixels, loaded bitmaps, etc.)
     * when the user switches tabs.
     */
    return staticHtml`
      <ps-header .plugins=${this._plugins}></ps-header>

      <div class="workspaces">
        ${this._plugins.map(p => {
          const tag = unsafeStatic(p.getPanelTag());
          return staticHtml`
            <div class="workspace ${this._activeTab === p.id ? 'active' : ''}">
              <${tag}></${tag}>
            </div>
          `;
        })}
      </div>

      <!-- Mobile bottom nav -->
      <nav class="mobile-nav">
        ${this._plugins.map(p => staticHtml`
          <button
            class="mnav-btn ${this._activeTab === p.id ? 'active' : ''}"
            @click=${() => engine.switchTab(p.id)}
          >
            <span class="icon">${p.icon}</span>
            ${p.label}
          </button>
        `)}
      </nav>

      <!-- AI Loader -->
      <ps-loader-overlay
        ?visible=${this._loaderVisible}
        .title=${this._loaderTitle}
        .desc=${this._loaderDesc}
        .sub=${this._loaderSub}
        .progress=${this._loaderPct}
      ></ps-loader-overlay>

      <!-- Toast notifications -->
      <ps-notification-host></ps-notification-host>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'ps-app': PsApp; }
}
