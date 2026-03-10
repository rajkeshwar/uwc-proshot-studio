import { LitElement, html, css } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { engine } from '../../core/engine.js';
import { BG_GRADIENTS, renderToCanvas, downloadCanvas, bitmapFromFile } from '../../core/image-utils.js';
import type { SwatchDef, BgGradientDef } from '../../core/types.js';
import '../../components/ps-drop-zone.js';
import '../../components/ps-slider.js';
import '../../components/ps-swatch-picker.js';
import '../../components/ps-progress-bar.js';
import '../../components/ps-toggle.js';
import '../../components/ps-collapsible-sidebar.js';

const SWATCHES: SwatchDef[] = [
  { color: '#ffffff', label: 'White' },
  { color: '#f1f5f9', label: 'Light Gray' },
  { color: '#dbeafe', label: 'Soft Blue' },
  { color: '#dcfce7', label: 'Soft Green' },
  { color: '#1e293b', label: 'Navy' },
  { color: '#0f172a', label: 'Dark Navy' },
  { color: 'transparent', label: 'Transparent (PNG)', transparent: true },
];

@customElement('ps-bg-studio-panel')
export class PsBgStudioPanel extends LitElement {
  @state() private _bgColor     = '#ffffff';
  @state() private _bgGradient  = 'none';
  @state() private _feather     = 2;
  @state() private _showBA      = true;
  @state() private _progress    = 0;
  @state() private _progMsg     = '';
  @state() private _progVisible = false;
  @state() private _hasSource   = false;
  @state() private _hasResult   = false;
  @state() private _dimLabel    = '';

  @query('#canvas-body') private _canvasBody!: HTMLElement;
  @query('ps-drop-zone') private _dropZone!: any;

  private _origBmp:   ImageBitmap | null = null;
  private _resultBmp: ImageBitmap | null = null;
  private _dlCanvas:  HTMLCanvasElement | null = null;

  static styles = css`
    :host {
      display: flex;
      flex: 1;
      overflow: hidden;
      min-height: 0;
    }
    /* ── [hidden] override — Shadow DOM CSS overrides UA display:none ── */
    [hidden] { display: none !important; }

    /* ── Layout ── */
    .split { display: grid; grid-template-columns: 320px 1fr; height: 100%; width: 100%; overflow: hidden; }

    .section { padding: 1rem 1.1rem; border-bottom: 1px solid var(--ps-border, #252a32); }
    .section-title {
      font-size: 0.65rem; font-weight: 700; letter-spacing: 0.12em;
      text-transform: uppercase; color: var(--ps-muted, #6b7280); margin-bottom: 0.75rem;
    }

    /* ── Canvas Area ── */
    .canvas-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: var(--ps-bg, #0b0d0f); min-width: 0; }
    .canvas-toolbar {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.55rem 1rem; border-bottom: 1px solid var(--ps-border, #252a32);
      background: var(--ps-surface, #13161a); flex-shrink: 0; flex-wrap: wrap;
    }
    .spacer { flex: 1; }
    .canvas-body { flex: 1; display: flex; align-items: center; justify-content: center; overflow: auto; padding: 2rem; }
    .canvas-body::-webkit-scrollbar { width: 6px; height: 6px; }
    .canvas-body::-webkit-scrollbar-thumb { background: var(--ps-border2, #2e3440); border-radius: 4px; }

    /* ── Chips ── */
    .chip { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.2rem 0.55rem; border-radius: 20px; font-size: 0.65rem; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; }
    .chip-cyan  { background: rgba(34,211,200,0.1); color: var(--ps-accent,#22d3c8); border: 1px solid rgba(34,211,200,0.2); }
    .chip-amber { background: rgba(245,158,11,0.1); color: var(--ps-amber,#f59e0b);  border: 1px solid rgba(245,158,11,0.2); }

    /* ── Placeholder ── */
    .placeholder {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      color: var(--ps-muted,#6b7280); gap: 1rem; min-height: 300px; min-width: 360px;
      max-width: 480px; border-radius: 8px; border: 1.5px dashed var(--ps-border2,#2e3440);
      text-align: center; padding: 2rem;
    }
    .placeholder .big { font-size: 3rem; opacity: 0.3; }
    .placeholder p { font-size: 0.8rem; line-height: 1.6; max-width: 260px; margin: 0; }

    /* ── Before/After ── */
    .img-frame { position: relative; border-radius: 8px; overflow: hidden; box-shadow: 0 0 0 1px var(--ps-border2,#2e3440), 0 8px 32px rgba(0,0,0,0.6); }
    .img-frame.checkerboard {
      background-image: repeating-conic-gradient(#1e2228 0% 25%,#15181d 0% 50%);
      background-size: 20px 20px;
    }
    .ba-wrap { position: relative; user-select: none; display: flex; }
    .ba-wrap canvas { display: block; max-width: min(100%,700px); max-height: calc(100vh - 170px); width: auto; height: auto; }
    .ba-after { position: absolute; inset: 0; overflow: hidden; }
    .ba-after canvas { position: absolute; top: 0; left: 0; height: 100%; width: 100%; object-fit: contain; object-position: left; }
    .ba-divider { position: absolute; top: 0; bottom: 0; width: 2px; background: var(--ps-accent,#22d3c8); cursor: ew-resize; z-index: 10; }
    .ba-handle {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
      width: 32px; height: 32px; border-radius: 50%; background: var(--ps-accent,#22d3c8);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.5); font-size: 0.7rem;
      color: var(--ps-bg,#0b0d0f); font-weight: 700;
    }

    /* ── Gradient Presets ── */
    .gradient-presets { display: grid; grid-template-columns: repeat(4,1fr); gap: 0.35rem; margin-top: 0.3rem; }
    .grad-preset { aspect-ratio: 1; border-radius: 4px; cursor: pointer; border: 2px solid transparent; transition: border-color 0.15s; overflow: hidden; }
    .grad-preset:hover, .grad-preset.active { border-color: var(--ps-accent,#22d3c8); }
    .grad-none { background: var(--ps-panel,#1a1e24); display: flex; align-items: center; justify-content: center; font-size: 0.6rem; color: #999; font-weight: 600; }

    /* ── Buttons ── */
    .btn { display: flex; align-items: center; justify-content: center; gap: 0.45rem; padding: 0.55rem 1rem; border-radius: var(--ps-radius,6px); font-family: inherit; font-size: 0.78rem; font-weight: 600; cursor: pointer; border: none; transition: all 0.15s; letter-spacing: 0.02em; width: 100%; }
    .btn-primary { background: var(--ps-accent,#22d3c8); color: var(--ps-bg,#0b0d0f); }
    .btn-primary:hover { background: #1ab8af; }
    .btn-primary:disabled { background: var(--ps-border2,#2e3440); color: var(--ps-muted,#6b7280); cursor: not-allowed; }
    .btn-ghost { background: var(--ps-panel,#1a1e24); color: var(--ps-text,#e8eaf0); border: 1px solid var(--ps-border2,#2e3440); font-size: 0.7rem; padding: 0.3rem 0.65rem; }
    .btn-ghost:hover { border-color: var(--ps-accent,#22d3c8); color: var(--ps-accent,#22d3c8); }
    .btn-ghost:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-green { background: var(--ps-green,#22c55e); color: #000; }
    .btn-green:hover { background: #16a34a; }
    .btn-green:disabled { background: var(--ps-border2,#2e3440); color: var(--ps-muted,#6b7280); cursor: not-allowed; }
    .btn-row { display: flex; gap: 0.4rem; margin-top: 0.5rem; }

    /* ── Dim label ── */
    .dim-label { font-size: 0.68rem; color: var(--ps-muted,#6b7280); }

    @media (max-width: 767px) {
      .split { display: flex; flex-direction: column; height: auto; }
      .canvas-body { padding: 1rem; }
      .placeholder { min-width: 0; width: 100%; }
    }
  `;

  render() {
    const gradients: BgGradientDef[] = BG_GRADIENTS;
    return html`
      <div class="split">
        <!-- ── Sidebar ── -->
        <ps-collapsible-sidebar>
          <div class="section">
            <div class="section-title">Upload Photo</div>
            <ps-drop-zone
              icon="📷"
              label="Drop headshot here"
              hint="JPG · PNG · WEBP · up to 10MB"
              @ps-file-selected=${this._onFileSelected}
              @ps-file-removed=${this._onFileRemoved}
            ></ps-drop-zone>
          </div>

          <div class="section">
            <div class="section-title">Background Color</div>
            <ps-swatch-picker
              .swatches=${SWATCHES}
              .value=${this._bgColor}
              showCustom
              @ps-color-change=${(e: CustomEvent) => { this._bgGradient = 'none'; this._bgColor = e.detail.color; this._updateBg(); }}
            ></ps-swatch-picker>
          </div>

          <div class="section">
            <div class="section-title">Background Presets</div>
            <div class="gradient-presets">
              ${gradients.map(g => html`
                <div
                  class="grad-preset ${g.id === 'none' ? 'grad-none' : ''} ${this._bgGradient === g.id ? 'active' : ''}"
                  style=${g.css !== 'none' ? `background:${g.css}` : ''}
                  title=${g.label}
                  @click=${() => { this._bgGradient = g.id; this._updateBg(); }}
                >${g.id === 'none' ? 'NONE' : ''}</div>
              `)}
            </div>
          </div>

          <div class="section">
            <div class="section-title">Options</div>
            <ps-slider
              label="Feather edges"
              min="0" max="10"
              .value=${this._feather}
              @ps-change=${(e: CustomEvent) => { this._feather = e.detail.value; }}
            ></ps-slider>
            <ps-toggle
              label="Show before / after"
              .checked=${this._showBA}
              @ps-change=${(e: CustomEvent) => { this._showBA = e.detail.checked; }}
            ></ps-toggle>
          </div>

          <div class="section">
            <button class="btn btn-primary" ?disabled=${!this._hasSource} @click=${this._process}>
              ✦ Remove Background (AI)
            </button>
            <ps-progress-bar
              .value=${this._progress}
              .message=${this._progMsg}
              .visible=${this._progVisible}
            ></ps-progress-bar>
          </div>

          <div class="section">
            <button class="btn btn-green" ?disabled=${!this._hasResult} @click=${this._download}>
              ↓ Download PNG
            </button>
            <div class="btn-row">
              <button class="btn btn-ghost" ?disabled=${!this._hasResult} @click=${this._sendToCrop}>
                → Smart Crop
              </button>
              <button class="btn btn-ghost" ?disabled=${!this._hasResult} @click=${this._sendToEnhance}>
                → Enhance
              </button>
            </div>
          </div>
        </ps-collapsible-sidebar>

        <!-- ── Canvas Area ── -->
        <div class="canvas-area">
          <div class="canvas-toolbar">
            <span class="chip chip-cyan">✦ AI · U2-Net Model · Runs Locally</span>
            <span class="chip chip-amber">🔒 Private — No Server Upload</span>
            <span class="spacer"></span>
            <span class="dim-label">${this._dimLabel}</span>
          </div>
          <div class="canvas-body" id="canvas-body">
            <!-- Placeholder: visible until a result is rendered into the canvas-body -->
            <div class="placeholder" ?hidden=${this._hasSource}>
              <div class="big">✦</div>
              <p>Upload a headshot to get started.<br>The AI model runs entirely in your browser.</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private async _onFileSelected(e: CustomEvent) {
    const file: File = e.detail.file;
    this._origBmp = await bitmapFromFile(file);
    engine.state.studioOriginalBmp = this._origBmp;
    this._resultBmp = null;
    this._hasSource = true;
    this._hasResult = false;
    this._dimLabel  = `${this._origBmp.width} × ${this._origBmp.height}px`;
    this._showOriginal();
    engine.notify('Photo loaded — ready to process', 'info');
  }

  private _onFileRemoved() {
    this._origBmp   = null;
    this._resultBmp = null;
    this._hasSource = false;
    this._hasResult = false;
    this._dimLabel  = '';
    this._canvasBody?.querySelectorAll('.img-frame').forEach(el => el.remove());
  }

  private _showOriginal(): void {
    const body = this._canvasBody;
    if (!body || !this._origBmp) return;
    body.querySelectorAll('.img-frame').forEach(el => el.remove());

    const frame = document.createElement('div');
    frame.className = 'img-frame checkerboard';
    const c = document.createElement('canvas');
    c.width = this._origBmp.width;
    c.height = this._origBmp.height;
    c.getContext('2d')!.drawImage(this._origBmp, 0, 0);
    c.style.maxWidth = 'min(100%,700px)';
    c.style.maxHeight = 'calc(100vh - 170px)';
    frame.appendChild(c);
    body.appendChild(frame);
  }

  private _showResult(): void {
    if (!this._origBmp || !this._resultBmp) return;
    const body = this._canvasBody;
    body.querySelectorAll('.img-frame').forEach(el => el.remove());

    const frame = document.createElement('div');
    frame.className = 'img-frame checkerboard';

    // Before/After slider
    const baWrap = document.createElement('div');
    baWrap.className = 'ba-wrap';

    const before = document.createElement('canvas');
    before.width = this._origBmp.width;
    before.height = this._origBmp.height;
    before.getContext('2d')!.drawImage(this._origBmp, 0, 0);
    baWrap.appendChild(before);

    const afterDiv = document.createElement('div');
    afterDiv.className = 'ba-after';
    const afterCanvas = document.createElement('canvas');
    renderToCanvas(afterCanvas, this._resultBmp, this._bgColor, this._bgGradient);
    afterDiv.appendChild(afterCanvas);
    baWrap.appendChild(afterDiv);

    const divider = document.createElement('div');
    divider.className = 'ba-divider';
    const handle = document.createElement('div');
    handle.className = 'ba-handle';
    handle.textContent = '⇔';
    divider.appendChild(handle);
    baWrap.appendChild(divider);

    this._initBaDrag(baWrap, afterDiv, divider, 50);

    frame.appendChild(baWrap);

    // Download canvas
    this._dlCanvas = document.createElement('canvas');
    renderToCanvas(this._dlCanvas, this._resultBmp, this._bgColor, this._bgGradient);

    // Store result ref on frame for bg updates
    (frame as any)._resultBmp = this._resultBmp;
    (frame as any)._afterCanvas = afterCanvas;

    body.appendChild(frame);
  }

  private _initBaDrag(wrap: HTMLElement, afterDiv: HTMLElement, divider: HTMLElement, initPct: number): void {
    const setDiv = (p: number) => {
      const pct = Math.max(2, Math.min(98, p));
      divider.style.left = pct + '%';
      afterDiv.style.clipPath = `inset(0 0 0 ${pct}%)`;
    };
    setDiv(initPct);
    let dragging = false;
    divider.addEventListener('mousedown', () => dragging = true);
    document.addEventListener('mouseup',  () => dragging = false);
    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      const r = wrap.getBoundingClientRect();
      setDiv(((e.clientX - r.left) / r.width) * 100);
    });
    divider.addEventListener('touchstart', () => dragging = true, { passive: true });
    document.addEventListener('touchend',  () => dragging = false);
    document.addEventListener('touchmove', e => {
      if (!dragging) return;
      const r = wrap.getBoundingClientRect();
      setDiv(((e.touches[0].clientX - r.left) / r.width) * 100);
    }, { passive: true });
  }

  private _updateBg(): void {
    if (!this._resultBmp) return;
    const frame = this._canvasBody?.querySelector('.img-frame') as any;
    if (!frame || !frame._resultBmp) return;
    if (frame._afterCanvas) renderToCanvas(frame._afterCanvas, frame._resultBmp, this._bgColor, this._bgGradient);
    if (this._dlCanvas) renderToCanvas(this._dlCanvas, this._resultBmp, this._bgColor, this._bgGradient);
  }

  private async _process(): Promise<void> {
    if (!this._origBmp) return;

    this._progVisible = true;
    this._progress = 5;
    this._progMsg  = 'Loading AI model…';
    engine.state.setStatus('Processing…', true);
    engine.showLoader('Removing Background', 'Running U2-Net AI model in your browser. First load fetches ~10MB model.');

    try {
      const { removeBackground } = await import('@imgly/background-removal');

      const oc = new OffscreenCanvas(this._origBmp.width, this._origBmp.height);
      oc.getContext('2d')!.drawImage(this._origBmp, 0, 0);
      const inputBlob = await oc.convertToBlob({ type: 'image/png' });

      engine.updateLoader(10, 'Preparing image…');
      this._progress = 10;

      const resultBlob = await removeBackground(inputBlob, {
        progress: (key: string, current: number, total: number) => {
          const pct = 10 + Math.round((current / total) * 82);
          const lbl = key?.includes('fetch')     ? `Downloading model: ${Math.round((current / total) * 100)}%`
                    : key?.includes('inference') ? `Running AI: ${Math.round((current / total) * 100)}%`
                    : `Processing: ${Math.round((current / total) * 100)}%`;
          this._progress = pct;
          this._progMsg  = lbl;
          engine.updateLoader(pct, lbl);
        }
      } as any);

      this._resultBmp = await createImageBitmap(resultBlob);
      engine.state.studioResultBmp = this._resultBmp;
      this._progress = 100;
      this._progMsg  = '✓ Done!';

      this._showResult();
      this._hasResult = true;
      engine.hideLoader();
      engine.state.setStatus('Ready', false);
      engine.notify('Background removed successfully!', 'success');

    } catch (err: any) {
      this._progMsg = '⚠ ' + err.message;
      engine.hideLoader();
      engine.state.setStatus('Error', false);
      engine.notify(err.message, 'error');
      console.error(err);
    }
  }

  private _download(): void {
    if (this._dlCanvas) {
      downloadCanvas(this._dlCanvas, 'proshot-headshot.png');
      engine.notify('Downloaded!', 'success');
    }
  }

  private async _sendToCrop(): Promise<void> {
    if (!this._resultBmp) return;
    engine.bus.emit('send:to-crop', { bmp: this._resultBmp });
    engine.switchTab('smart-crop');
    engine.notify('Sent to Smart Crop', 'success');
  }

  private _sendToEnhance(): void {
    const bmp = this._resultBmp || this._origBmp;
    if (!bmp) return;
    engine.bus.emit('send:to-enhance', { bmp });
    engine.switchTab('enhance');
    engine.notify('Sent to Enhance', 'success');
  }
}

declare global {
  interface HTMLElementTagNameMap { 'ps-bg-studio-panel': PsBgStudioPanel; }
}
