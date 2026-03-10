import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * `<ps-slider>` — Labelled range slider with live value display.
 *
 * @fires ps-change - CustomEvent<{ value: number }>
 */
@customElement('ps-slider')
export class PsSlider extends LitElement {
  @property() label  = '';
  @property({ type: Number }) min   = 0;
  @property({ type: Number }) max   = 100;
  @property({ type: Number }) value = 50;
  @property({ type: Number }) step  = 1;
  @property() unit   = '';
  @property({ type: Boolean }) disabled = false;

  static styles = css`
    :host { display: block; }

    .row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      margin-bottom: 0.55rem;
    }
    .label {
      font-size: 0.72rem;
      color: var(--ps-muted, #6b7280);
      font-weight: 500;
      flex-shrink: 0;
      min-width: 72px;
    }
    input[type=range] {
      flex: 1;
      -webkit-appearance: none;
      appearance: none;
      height: 3px;
      background: var(--ps-border2, #2e3440);
      border-radius: 2px;
      cursor: pointer;
      outline: none;
    }
    input[type=range]:disabled { cursor: not-allowed; opacity: 0.4; }
    input[type=range]::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--ps-accent, #22d3c8);
      cursor: pointer;
      transition: transform 0.1s;
    }
    input[type=range]::-webkit-slider-thumb:hover { transform: scale(1.3); }
    input[type=range]::-moz-range-thumb {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--ps-accent, #22d3c8);
      border: none;
      cursor: pointer;
    }
    .val {
      font-size: 0.7rem;
      color: var(--ps-accent, #22d3c8);
      min-width: 2.6rem;
      text-align: right;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }
  `;

  render() {
    return html`
      <div class="row">
        <span class="label">${this.label}</span>
        <input
          type="range"
          .min=${String(this.min)}
          .max=${String(this.max)}
          .step=${String(this.step)}
          .value=${String(this.value)}
          ?disabled=${this.disabled}
          @input=${this._onInput}
        />
        <span class="val">${this.value}${this.unit}</span>
      </div>
    `;
  }

  private _onInput(e: Event) {
    const val = parseFloat((e.target as HTMLInputElement).value);
    this.value = val;
    this.dispatchEvent(new CustomEvent('ps-change', { detail: { value: val }, bubbles: true, composed: true }));
  }
}

declare global {
  interface HTMLElementTagNameMap { 'ps-slider': PsSlider; }
}
