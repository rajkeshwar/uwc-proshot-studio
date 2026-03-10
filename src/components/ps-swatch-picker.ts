import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { SwatchDef } from '../core/types.js';

/**
 * `<ps-swatch-picker>` — Color swatch selector with optional custom color picker.
 *
 * @fires ps-color-change - CustomEvent<{ color: string }>
 */
@customElement('ps-swatch-picker')
export class PsSwatchPicker extends LitElement {
  @property({ type: Array }) swatches: SwatchDef[] = [];
  @property() value = '#ffffff';
  @property({ type: Boolean }) showCustom = false;

  static styles = css`
    :host { display: block; }

    .swatches {
      display: flex;
      gap: 0.4rem;
      flex-wrap: wrap;
      align-items: center;
    }
    .swatch {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      cursor: pointer;
      border: 2px solid transparent;
      transition: transform 0.15s, border-color 0.15s;
      flex-shrink: 0;
    }
    .swatch:hover { transform: scale(1.2); }
    .swatch.active {
      border-color: var(--ps-accent, #22d3c8);
      transform: scale(1.1);
    }
    .swatch.transp {
      background-image: repeating-conic-gradient(#444 0% 25%, #222 0% 50%);
      background-size: 10px 10px;
    }
    .custom-btn {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 1.5px dashed var(--ps-muted, #6b7280);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      position: relative;
      overflow: hidden;
      background: none;
    }
    .custom-btn input {
      position: absolute;
      opacity: 0;
      inset: 0;
      cursor: pointer;
      padding: 0;
      border: 0;
      width: 100%;
      height: 100%;
    }
  `;

  render() {
    return html`
      <div class="swatches">
        ${this.swatches.map(sw => html`
          <div
            class="swatch ${sw.transparent ? 'transp' : ''} ${this.value === sw.color ? 'active' : ''}"
            style=${sw.transparent ? '' : `background:${sw.color}`}
            title=${sw.label ?? sw.color}
            @click=${() => this._select(sw.color)}
          ></div>
        `)}
        ${this.showCustom ? html`
          <div class="custom-btn" title="Custom color">
            🎨
            <input type="color" .value=${this.value} @input=${this._onCustom} />
          </div>
        ` : ''}
      </div>
    `;
  }

  private _select(color: string) {
    this.value = color;
    this._emit(color);
  }

  private _onCustom(e: Event) {
    const color = (e.target as HTMLInputElement).value;
    this.value = color;
    this._emit(color);
  }

  private _emit(color: string) {
    this.dispatchEvent(new CustomEvent('ps-color-change', { detail: { color }, bubbles: true, composed: true }));
  }
}

declare global {
  interface HTMLElementTagNameMap { 'ps-swatch-picker': PsSwatchPicker; }
}
