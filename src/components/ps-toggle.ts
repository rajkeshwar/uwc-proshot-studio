import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * `<ps-toggle>` — Labelled toggle switch.
 *
 * @fires ps-change - CustomEvent<{ checked: boolean }>
 */
@customElement('ps-toggle')
export class PsToggle extends LitElement {
  @property() label   = '';
  @property({ type: Boolean }) checked  = false;
  @property({ type: Boolean }) disabled = false;

  static styles = css`
    :host { display: block; }

    .row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }
    .label {
      font-size: 0.72rem;
      color: var(--ps-muted, #6b7280);
    }
    .toggle {
      position: relative;
      width: 32px;
      height: 18px;
      flex-shrink: 0;
    }
    .toggle input {
      opacity: 0;
      position: absolute;
      width: 0;
      height: 0;
    }
    .track {
      position: absolute;
      inset: 0;
      background: var(--ps-border2, #2e3440);
      border-radius: 10px;
      cursor: pointer;
      transition: background 0.2s;
    }
    input:checked + .track { background: var(--ps-accent, #22d3c8); }
    input:disabled + .track { cursor: not-allowed; opacity: 0.4; }
    .thumb {
      position: absolute;
      top: 3px;
      left: 3px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #fff;
      transition: transform 0.2s;
      pointer-events: none;
    }
    input:checked ~ .thumb { transform: translateX(14px); }
  `;

  render() {
    return html`
      <div class="row">
        <span class="label">${this.label}</span>
        <label class="toggle">
          <input
            type="checkbox"
            ?checked=${this.checked}
            ?disabled=${this.disabled}
            @change=${this._onChange}
          />
          <div class="track"></div>
          <div class="thumb"></div>
        </label>
      </div>
    `;
  }

  private _onChange(e: Event) {
    this.checked = (e.target as HTMLInputElement).checked;
    this.dispatchEvent(new CustomEvent('ps-change', { detail: { checked: this.checked }, bubbles: true, composed: true }));
  }
}

declare global {
  interface HTMLElementTagNameMap { 'ps-toggle': PsToggle; }
}
