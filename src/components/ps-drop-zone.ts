import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

/**
 * `<ps-drop-zone>` — File upload area with drag-and-drop support.
 *
 * @fires ps-file-selected - CustomEvent<{ file: File }>
 */
@customElement('ps-drop-zone')
export class PsDropZone extends LitElement {
  @property() icon   = '📁';
  @property() label  = 'Drop file here';
  @property() hint   = 'or click to browse';
  @property() accept = 'image/*';

  @state() private _dragging = false;

  static styles = css`
    :host { display: block; }

    .zone {
      position: relative;
      border: 1.5px dashed var(--ps-border2, #2e3440);
      border-radius: var(--ps-radius, 6px);
      padding: 1.5rem 1rem;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
      background: var(--ps-panel, #1a1e24);
    }
    .zone:hover,
    .zone.drag {
      border-color: var(--ps-accent, #22d3c8);
      background: rgba(34, 211, 200, 0.05);
    }
    input {
      position: absolute;
      inset: 0;
      opacity: 0;
      cursor: pointer;
      width: 100%;
      height: 100%;
    }
    .icon {
      font-size: 1.6rem;
      margin-bottom: 0.4rem;
      display: block;
    }
    h4 {
      font-size: 0.78rem;
      font-weight: 600;
      margin: 0 0 0.2rem;
      color: var(--ps-text, #e8eaf0);
    }
    p {
      font-size: 0.68rem;
      color: var(--ps-muted, #6b7280);
      margin: 0;
    }
  `;

  render() {
    return html`
      <div
        class="zone ${this._dragging ? 'drag' : ''}"
        @dragover=${this._onDragOver}
        @dragleave=${this._onDragLeave}
        @drop=${this._onDrop}
      >
        <input type="file" .accept=${this.accept} @change=${this._onChange} />
        <span class="icon">${this.icon}</span>
        <h4>${this.label}</h4>
        <p>${this.hint}</p>
      </div>
    `;
  }

  private _onDragOver(e: DragEvent) {
    e.preventDefault();
    this._dragging = true;
  }

  private _onDragLeave() {
    this._dragging = false;
  }

  private _onDrop(e: DragEvent) {
    e.preventDefault();
    this._dragging = false;
    const file = e.dataTransfer?.files[0];
    if (file) this._emit(file);
  }

  private _onChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this._emit(file);
  }

  private _emit(file: File) {
    this.dispatchEvent(new CustomEvent('ps-file-selected', { detail: { file }, bubbles: true, composed: true }));
  }
}

declare global {
  interface HTMLElementTagNameMap { 'ps-drop-zone': PsDropZone; }
}
