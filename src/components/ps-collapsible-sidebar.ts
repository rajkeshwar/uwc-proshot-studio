import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

/**
 * `<ps-collapsible-sidebar>` — sidebar wrapper that collapses on mobile.
 *
 * On desktop (≥768px): always expanded, toggle button hidden.
 * On mobile (<768px):  shows a "⚙ Controls ▾" header; tap to collapse/expand.
 *
 * Usage:
 *   <ps-collapsible-sidebar>
 *     <div class="section">…</div>
 *     …
 *   </ps-collapsible-sidebar>
 */
@customElement('ps-collapsible-sidebar')
export class PsCollapsibleSidebar extends LitElement {
  @state() private _collapsed = false;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      background: var(--ps-surface, #13161a);
      border-right: 1px solid var(--ps-border, #252a32);
      overflow-y: auto;
      overflow-x: hidden;
    }
    :host::-webkit-scrollbar { width: 4px; }
    :host::-webkit-scrollbar-track { background: transparent; }
    :host::-webkit-scrollbar-thumb { background: var(--ps-border2, #2e3440); border-radius: 4px; }

    /* Toggle button — desktop: hidden */
    .toggle {
      display: none;
      align-items: center;
      justify-content: space-between;
      padding: 0.65rem 1rem;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      background: var(--ps-panel, #1a1e24);
      border-bottom: 1px solid var(--ps-border, #252a32);
      color: var(--ps-text, #e8eaf0);
      user-select: none;
      flex-shrink: 0;
    }
    .toggle:hover { background: var(--ps-border, #252a32); }

    .arrow {
      font-size: 0.8rem;
      transition: transform 0.2s;
      display: inline-block;
    }
    .arrow.rotated { transform: rotate(-90deg); }

    /* Content slot wrapper */
    .content {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .content.collapsed { display: none; }

    /* Mobile overrides */
    @media (max-width: 767px) {
      :host {
        border-right: none;
        border-bottom: 1px solid var(--ps-border, #252a32);
        overflow: visible;
        max-height: none;
      }
      .toggle { display: flex; }
      .content { overflow: visible; }
    }
  `;

  render() {
    return html`
      <div class="toggle" @click=${this._toggle}>
        <span>⚙ Controls</span>
        <span class="arrow ${this._collapsed ? 'rotated' : ''}">▾</span>
      </div>
      <div class="content ${this._collapsed ? 'collapsed' : ''}">
        <slot></slot>
      </div>
    `;
  }

  private _toggle() {
    this._collapsed = !this._collapsed;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'ps-collapsible-sidebar': PsCollapsibleSidebar; }
}
