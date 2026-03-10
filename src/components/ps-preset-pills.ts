import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { PillDef } from '../core/types.js';

/**
 * `<ps-preset-pills>` — Horizontal pill selector for presets/ratios/countries.
 *
 * @fires ps-select - CustomEvent<{ id: string }>
 */
@customElement('ps-preset-pills')
export class PsPresetPills extends LitElement {
  @property({ type: Array }) pills: PillDef[] = [];
  @property() value = '';

  static styles = css`
    :host { display: block; }

    .row {
      display: flex;
      gap: 0.35rem;
      flex-wrap: wrap;
      margin-bottom: 0.5rem;
    }
    .pill {
      padding: 0.2rem 0.55rem;
      border-radius: 20px;
      font-size: 0.65rem;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid var(--ps-border2, #2e3440);
      background: var(--ps-panel, #1a1e24);
      color: var(--ps-muted, #6b7280);
      transition: background 0.15s, color 0.15s, border-color 0.15s;
      white-space: nowrap;
      font-family: inherit;
    }
    .pill:hover,
    .pill.active {
      background: var(--ps-accent, #22d3c8);
      color: var(--ps-bg, #0b0d0f);
      border-color: var(--ps-accent, #22d3c8);
    }
  `;

  render() {
    return html`
      <div class="row">
        ${this.pills.map(p => html`
          <button
            class="pill ${this.value === p.id ? 'active' : ''}"
            @click=${() => this._select(p.id)}
          >${p.label}</button>
        `)}
      </div>
    `;
  }

  private _select(id: string) {
    this.value = id;
    this.dispatchEvent(new CustomEvent('ps-select', { detail: { id }, bubbles: true, composed: true }));
  }
}

declare global {
  interface HTMLElementTagNameMap { 'ps-preset-pills': PsPresetPills; }
}
