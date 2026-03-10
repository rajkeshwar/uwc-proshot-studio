import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * `<ps-loader-overlay>` — Full-screen AI processing overlay.
 */
@customElement('ps-loader-overlay')
export class PsLoaderOverlay extends LitElement {
  @property({ type: Boolean }) visible = false;
  @property() title   = 'Loading AI Model';
  @property() desc    = 'Please wait…';
  @property() sub     = 'Initialising…';
  @property({ type: Number }) progress = 0;

  static styles = css`
    :host {
      position: fixed;
      inset: 0;
      background: rgba(11,13,15,0.92);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 9000;
      gap: 1.5rem;
      backdrop-filter: blur(6px);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s;
    }
    :host([visible]) {
      opacity: 1;
      pointer-events: all;
    }

    .ring { width: 64px; height: 64px; position: relative; }
    .ring svg { animation: spin 1.2s linear infinite; }

    @keyframes spin { to { transform: rotate(360deg); } }

    .ring circle {
      fill: none;
      stroke: var(--ps-accent, #22d3c8);
      stroke-width: 3;
      stroke-dasharray: 120 200;
      stroke-dashoffset: -30;
      stroke-linecap: round;
      animation: dash 1.5s ease-in-out infinite;
    }
    @keyframes dash {
      0%   { stroke-dasharray: 1 200;   stroke-dashoffset: 0;    }
      50%  { stroke-dasharray: 120 200; stroke-dashoffset: -50;  }
      100% { stroke-dasharray: 120 200; stroke-dashoffset: -170; }
    }

    .text { text-align: center; }
    .text h3 {
      font-family: var(--ps-font-display, 'Syne', sans-serif);
      font-size: 1rem;
      margin: 0 0 0.3rem;
      color: var(--ps-text, #e8eaf0);
    }
    .text p {
      font-size: 0.75rem;
      color: var(--ps-muted, #6b7280);
      max-width: 220px;
      line-height: 1.5;
      margin: 0;
    }
    .sub {
      font-size: 0.68rem;
      color: var(--ps-accent, #22d3c8);
      margin-top: 0.3rem;
      min-height: 1em;
    }
    .bar-track {
      width: 200px;
      height: 3px;
      background: var(--ps-border, #252a32);
      border-radius: 2px;
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      background: var(--ps-accent, #22d3c8);
      border-radius: 2px;
      transition: width 0.3s;
    }
  `;

  render() {
    return html`
      <div class="ring">
        <svg viewBox="0 0 64 64" width="64" height="64">
          <circle cx="32" cy="32" r="28"/>
        </svg>
      </div>
      <div class="text">
        <h3>${this.title}</h3>
        <p>${this.desc}</p>
        <div class="sub">${this.sub}</div>
      </div>
      <div class="bar-track">
        <div class="bar-fill" style="width:${this.progress}%"></div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'ps-loader-overlay': PsLoaderOverlay; }
}
