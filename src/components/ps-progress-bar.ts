import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * `<ps-progress-bar>` — Animated progress bar with status message.
 */
@customElement('ps-progress-bar')
export class PsProgressBar extends LitElement {
  @property({ type: Number }) value   = 0;
  @property() message  = '';
  @property({ type: Boolean }) visible = false;

  static styles = css`
    :host { display: block; }

    .wrap { margin-top: 0.5rem; display: none; }
    .wrap.show { display: block; }

    .track {
      height: 3px;
      background: var(--ps-border, #252a32);
      border-radius: 2px;
      overflow: hidden;
    }
    .bar {
      height: 100%;
      background: var(--ps-accent, #22d3c8);
      border-radius: 2px;
      transition: width 0.3s;
    }
    .msg {
      font-size: 0.68rem;
      color: var(--ps-muted, #6b7280);
      margin-top: 0.3rem;
      min-height: 1em;
    }
  `;

  render() {
    return html`
      <div class="wrap ${this.visible ? 'show' : ''}">
        <div class="track">
          <div class="bar" style="width:${this.value}%"></div>
        </div>
        <div class="msg">${this.message}</div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'ps-progress-bar': PsProgressBar; }
}
