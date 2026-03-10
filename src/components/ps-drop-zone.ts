import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

/**
 * `<ps-drop-zone>` — File upload with drag-and-drop and inline preview.
 *
 * States:
 *  - Empty:    shows the dashed drop zone with icon/label/hint
 *  - Loaded:   hides the zone, shows the preview thumbnail + filename + ✕ remove button
 *
 * @fires ps-file-selected  CustomEvent<{ file: File }>  — when a file is picked
 * @fires ps-file-removed   CustomEvent<{}>              — when the remove button is clicked
 *
 * Callers can also call `.reset()` programmatically (e.g. when a cross-plugin
 * image is loaded via the event bus, keeping the UI consistent).
 */
@customElement('ps-drop-zone')
export class PsDropZone extends LitElement {
  @property() icon   = '📁';
  @property() label  = 'Drop file here';
  @property() hint   = 'or click to browse';
  @property() accept = 'image/*';

  @state() private _dragging    = false;
  @state() private _previewUrl  = '';
  @state() private _fileName    = '';

  static styles = css`
    :host { display: block; }
    [hidden] { display: none !important; }

    /* ── Drop zone (empty state) ── */
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
    input[type="file"] {
      position: absolute;
      inset: 0;
      opacity: 0;
      cursor: pointer;
      width: 100%;
      height: 100%;
    }
    .icon  { font-size: 1.6rem; margin-bottom: 0.4rem; display: block; }
    h4     { font-size: 0.78rem; font-weight: 600; margin: 0 0 0.2rem; color: var(--ps-text, #e8eaf0); }
    p      { font-size: 0.68rem; color: var(--ps-muted, #6b7280); margin: 0; }

    /* ── Preview card (loaded state) ── */
    .preview {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: var(--ps-panel, #1a1e24);
      border: 1px solid var(--ps-border2, #2e3440);
      border-radius: var(--ps-radius, 6px);
      padding: 0.6rem 0.75rem;
    }
    .preview img {
      width: 52px;
      height: 52px;
      object-fit: cover;
      border-radius: 4px;
      flex-shrink: 0;
      background: var(--ps-bg, #0b0d0f);
    }
    .preview-info {
      flex: 1;
      min-width: 0;
    }
    .preview-name {
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--ps-text, #e8eaf0);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .preview-ready {
      font-size: 0.65rem;
      color: var(--ps-accent, #22d3c8);
      margin-top: 0.15rem;
    }
    .remove-btn {
      flex-shrink: 0;
      background: none;
      border: 1px solid var(--ps-border2, #2e3440);
      border-radius: 4px;
      color: var(--ps-muted, #6b7280);
      cursor: pointer;
      font-size: 0.7rem;
      padding: 0.25rem 0.5rem;
      transition: border-color 0.15s, color 0.15s;
      font-family: inherit;
    }
    .remove-btn:hover {
      border-color: var(--ps-red, #ef4444);
      color: var(--ps-red, #ef4444);
    }
  `;

  render() {
    const hasFile = Boolean(this._previewUrl);
    return html`
      <!-- Empty state: drop zone -->
      <div
        class="zone ${this._dragging ? 'drag' : ''}"
        ?hidden=${hasFile}
        @dragover=${this._onDragOver}
        @dragleave=${this._onDragLeave}
        @drop=${this._onDrop}
      >
        <input type="file" .accept=${this.accept} @change=${this._onChange} />
        <span class="icon">${this.icon}</span>
        <h4>${this.label}</h4>
        <p>${this.hint}</p>
      </div>

      <!-- Loaded state: preview card -->
      <div class="preview" ?hidden=${!hasFile}>
        <img src=${this._previewUrl} alt="preview" />
        <div class="preview-info">
          <div class="preview-name">${this._fileName}</div>
          <div class="preview-ready">✓ Ready to process</div>
        </div>
        <button class="remove-btn" @click=${this._onRemove} title="Remove and upload a new photo">✕ Remove</button>
      </div>
    `;
  }

  /** Called externally when an image arrives via the event bus (e.g. "Send to Enhance") */
  setPreview(name: string, url: string) {
    this._revoke();
    this._fileName   = name;
    this._previewUrl = url;
  }

  /** Reset to empty state programmatically */
  reset() {
    this._revoke();
    this._previewUrl = '';
    this._fileName   = '';
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._revoke();
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private _onDragOver(e: DragEvent)  { e.preventDefault(); this._dragging = true; }
  private _onDragLeave()             { this._dragging = false; }

  private _onDrop(e: DragEvent) {
    e.preventDefault();
    this._dragging = false;
    const file = e.dataTransfer?.files[0];
    if (file) this._accept(file);
  }

  private _onChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this._accept(file);
  }

  private _accept(file: File) {
    this._revoke();
    this._previewUrl = URL.createObjectURL(file);
    this._fileName   = file.name;
    this.dispatchEvent(new CustomEvent('ps-file-selected', { detail: { file }, bubbles: true, composed: true }));
  }

  private _onRemove() {
    this.reset();
    this.dispatchEvent(new CustomEvent('ps-file-removed', { bubbles: true, composed: true }));
  }

  private _revoke() {
    if (this._previewUrl.startsWith('blob:')) URL.revokeObjectURL(this._previewUrl);
  }
}

declare global {
  interface HTMLElementTagNameMap { 'ps-drop-zone': PsDropZone; }
}
