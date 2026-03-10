import { LitElement, html, css } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { engine } from '../../core/engine.js';
import { detectFace, downloadCanvas, bitmapFromFile } from '../../core/image-utils.js';
import type { SwatchDef, PillDef, FaceDetectionResult } from '../../core/types.js';
import '../../components/ps-drop-zone.js';
import '../../components/ps-slider.js';
import '../../components/ps-swatch-picker.js';
import '../../components/ps-preset-pills.js';
import '../../components/ps-progress-bar.js';
import '../../components/ps-collapsible-sidebar.js';

const SWATCHES: SwatchDef[] = [
  { color: '#ffffff', label: 'White' },
  { color: '#f1f5f9', label: 'Light Gray' },
  { color: '#1e293b', label: 'Dark' },
  { color: 'transparent', label: 'Transparent', transparent: true },
];

const ASPECT_PILLS: PillDef[] = [
  { id: '1:1', label: '1 : 1' },
  { id: '4:5', label: '4 : 5' },
  { id: '2:3', label: '2 : 3' },
  { id: '3:4', label: '3 : 4' },
  { id: '5:7', label: '5 : 7' },
];

@customElement('ps-smart-crop-panel')
export class PsSmartCropPanel extends LitElement {
  @state() private _aspect     = '1:1';
  @state() private _bgColor    = '#ffffff';
  @state() private _headSize   = 65;
  @state() private _vOffset    = 0;
  @state() private _padding    = 5;
  @state() private _hasSource  = false;
  @state() private _hasResult  = false;
  @state() private _faceInfo   = '';
  @state() private _faceDetected = false;
  @state() private _cropInfo   = '';

  @query('#crop-canvas') private _canvas!: HTMLCanvasElement;
  @query('#result')      private _resultEl!: HTMLElement;
  @query('#placeholder') private _placeholder!: HTMLElement;
  @query('ps-drop-zone') private _dropZone!: any;

  private _sourceBmp: ImageBitmap | null = null;
  private _face: FaceDetectionResult | null = null;

  connectedCallback() {
    super.connectedCallback();
    engine.bus.on('send:to-crop', ({ bmp }) => {
      this._loadSource(bmp);
      this._performCrop();
      // Show preview in drop-zone (image arrived from another panel)
      this.updateComplete.then(() => {
        const c = document.createElement('canvas');
        c.width = bmp.width; c.height = bmp.height;
        c.getContext('2d')!.drawImage(bmp, 0, 0);
        this._dropZone?.setPreview('From BG Studio', c.toDataURL('image/jpeg', 0.5));
      });
    });
  }

  static styles = css`
    :host { display: flex; flex: 1; overflow: hidden; min-height: 0; }
    [hidden] { display: none !important; }

    .split { display: grid; grid-template-columns: 320px 1fr; height: 100%; width: 100%; overflow: hidden; }
    .section { padding: 1rem 1.1rem; border-bottom: 1px solid var(--ps-border,#252a32); }
    .section-title { font-size: 0.65rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ps-muted,#6b7280); margin-bottom: 0.75rem; }

    .canvas-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: var(--ps-bg,#0b0d0f); min-width: 0; }
    .canvas-toolbar { display: flex; align-items: center; gap: 0.5rem; padding: 0.55rem 1rem; border-bottom: 1px solid var(--ps-border,#252a32); background: var(--ps-surface,#13161a); flex-shrink: 0; flex-wrap: wrap; }
    .spacer { flex: 1; }
    .canvas-body { flex: 1; display: flex; align-items: center; justify-content: center; overflow: auto; padding: 2rem; }

    .chip { display: inline-flex; align-items: center; padding: 0.2rem 0.55rem; border-radius: 20px; font-size: 0.65rem; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; }
    .chip-cyan { background: rgba(34,211,200,0.1); color: var(--ps-accent,#22d3c8); border: 1px solid rgba(34,211,200,0.2); }

    .placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--ps-muted,#6b7280); gap: 1rem; min-height: 300px; min-width: 360px; max-width: 480px; border-radius: 8px; border: 1.5px dashed var(--ps-border2,#2e3440); text-align: center; padding: 2rem; }
    .placeholder .big { font-size: 3rem; opacity: 0.3; }
    .placeholder p { font-size: 0.8rem; line-height: 1.6; max-width: 260px; margin: 0; }

    .img-frame { position: relative; border-radius: 8px; overflow: hidden; box-shadow: 0 0 0 1px var(--ps-border2,#2e3440), 0 8px 32px rgba(0,0,0,0.6); }
    canvas { display: block; max-width: min(100%,700px); max-height: calc(100vh - 170px); }

    .face-badge { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.25rem 0.6rem; border-radius: 20px; font-size: 0.68rem; font-weight: 600; background: rgba(34,197,94,0.1); color: var(--ps-green,#22c55e); border: 1px solid rgba(34,197,94,0.2); margin-top: 0.5rem; }
    .info-text { font-size: 0.68rem; color: var(--ps-muted,#6b7280); }

    .btn { display: flex; align-items: center; justify-content: center; gap: 0.45rem; padding: 0.55rem 1rem; border-radius: var(--ps-radius,6px); font-family: inherit; font-size: 0.78rem; font-weight: 600; cursor: pointer; border: none; transition: all 0.15s; width: 100%; }
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

    @media (max-width: 767px) {
      .split { display: flex; flex-direction: column; height: auto; }
    }
  `;

  render() {
    return html`
      <div class="split">
        <ps-collapsible-sidebar>
          <div class="section">
            <div class="section-title">Upload or Use Current</div>
            <ps-drop-zone
              icon="⊡" label="Drop photo here"
              hint='Or use "Send to Smart Crop" from BG Studio'
              @ps-file-selected=${this._onFile}
              @ps-file-removed=${this._onFileRemoved}
            ></ps-drop-zone>
            ${this._faceDetected ? html`<div class="face-badge">✓ Face detected — ready to align</div>` : ''}
          </div>

          <div class="section">
            <div class="section-title">Crop Preset</div>
            <ps-preset-pills
              .pills=${ASPECT_PILLS}
              .value=${this._aspect}
              @ps-select=${(e: CustomEvent) => { this._aspect = e.detail.id; if (this._sourceBmp) this._performCrop(); }}
            ></ps-preset-pills>
          </div>

          <div class="section">
            <div class="section-title">Head Position</div>
            <ps-slider label="Head size"  min="40" max="90" .value=${this._headSize} unit="%"
              @ps-change=${(e: CustomEvent) => { this._headSize = e.detail.value; if (this._sourceBmp) this._performCrop(); }}
            ></ps-slider>
            <ps-slider label="Vertical"   min="-30" max="30" .value=${this._vOffset} unit="%"
              @ps-change=${(e: CustomEvent) => { this._vOffset = e.detail.value; if (this._sourceBmp) this._performCrop(); }}
            ></ps-slider>
            <ps-slider label="Padding"    min="0" max="20" .value=${this._padding} unit="%"
              @ps-change=${(e: CustomEvent) => { this._padding = e.detail.value; if (this._sourceBmp) this._performCrop(); }}
            ></ps-slider>
          </div>

          <div class="section">
            <div class="section-title">Background Fill</div>
            <ps-swatch-picker
              .swatches=${SWATCHES} .value=${this._bgColor}
              @ps-color-change=${(e: CustomEvent) => { this._bgColor = e.detail.color; if (this._sourceBmp) this._performCrop(); }}
            ></ps-swatch-picker>
          </div>

          <div class="section">
            <button class="btn btn-primary" ?disabled=${!this._hasSource} @click=${() => this._performCrop()}>
              ⊡ Auto-Align &amp; Crop
            </button>
          </div>

          <div class="section">
            <button class="btn btn-green" ?disabled=${!this._hasResult} @click=${this._download}>
              ↓ Download Cropped
            </button>
            <div class="btn-row">
              <button class="btn btn-ghost" ?disabled=${!this._hasResult} @click=${this._sendToPassport}>
                → Passport Print
              </button>
            </div>
          </div>
        </ps-collapsible-sidebar>

        <div class="canvas-area">
          <div class="canvas-toolbar">
            <span class="chip chip-cyan">Smart Align — Face-Aware Cropping</span>
            <span class="spacer"></span>
            <span class="info-text">${this._faceInfo}</span>
          </div>
          <div class="canvas-body">
            <div class="placeholder" id="placeholder" ?hidden=${this._hasResult}>
              <div class="big">⊡</div>
              <p>Upload a photo and hit Auto-Align.<br>Faces are automatically detected and centered.</p>
            </div>
            <div class="img-frame" id="result" ?hidden=${!this._hasResult}>
              <canvas id="crop-canvas"></canvas>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private async _onFile(e: CustomEvent) {
    const bmp = await bitmapFromFile(e.detail.file);
    await this._loadSource(bmp);
  }

  private _onFileRemoved() {
    this._sourceBmp    = null;
    this._hasSource    = false;
    this._hasResult    = false;
    this._faceDetected = false;
    this._faceInfo     = '';
    if (this._canvas) { const ctx = this._canvas.getContext('2d'); ctx?.clearRect(0,0,this._canvas.width,this._canvas.height); }
  }

  private async _loadSource(bmp: ImageBitmap): Promise<void> {
    this._sourceBmp = bmp;
    engine.state.studioOriginalBmp = bmp;
    this._hasSource = true;
    this._face = await detectFace(bmp);
    if (this._face) {
      this._faceDetected = true;
      this._faceInfo = `Face at (${Math.round(this._face.x)}, ${Math.round(this._face.y)})`;
    } else {
      this._faceDetected = false;
      this._faceInfo = 'No face detected — using center crop';
    }
  }

  private async _performCrop(): Promise<void> {
    if (!this._sourceBmp) return;
    await this.updateComplete;

    const [rw, rh] = this._aspect.split(':').map(Number);
    const headSizePct = this._headSize / 100;
    const voffset     = this._vOffset / 100;
    const paddingPct  = this._padding / 100;

    const srcW = this._sourceBmp.width;
    const srcH = this._sourceBmp.height;

    let cx: number, cy: number, faceH: number;
    if (this._face) {
      cx = this._face.x; cy = this._face.y; faceH = this._face.h;
    } else {
      cx = srcW / 2; cy = srcH * 0.35; faceH = srcH * 0.3;
    }

    const cropH = faceH / headSizePct;
    const cropW = cropH * (rw / rh);
    let cropX = cx - cropW / 2;
    let cropY = cy - cropH * (0.45 + voffset);
    cropX = Math.max(0, Math.min(srcW - cropW, cropX));
    cropY = Math.max(0, Math.min(srcH - cropH, cropY));

    const padPx = Math.min(cropW, cropH) * paddingPct;
    const outW = Math.round(cropW + padPx * 2);
    const outH = Math.round(cropH + padPx * 2);

    const canvas = this._canvas;
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, outW, outH);
    if (this._bgColor && this._bgColor !== 'transparent') {
      ctx.fillStyle = this._bgColor;
      ctx.fillRect(0, 0, outW, outH);
    }
    ctx.drawImage(this._sourceBmp, cropX, cropY, cropW, cropH, padPx, padPx, cropW, cropH);

    canvas.style.maxWidth = 'min(100%,700px)';
    this._hasResult = true;
    engine.state.cropResultBmp = await createImageBitmap(canvas);
    this._cropInfo = `${outW}×${outH}px (${this._aspect})`;
  }

  private _download(): void {
    if (this._canvas) {
      downloadCanvas(this._canvas, 'proshot-cropped.png');
      engine.notify('Downloaded!', 'success');
    }
  }

  private async _sendToPassport(): Promise<void> {
    if (!this._canvas) return;
    const bmp = await createImageBitmap(this._canvas);
    engine.bus.emit('send:to-passport', { bmp });
    engine.switchTab('passport-print');
    engine.notify('Sent to Passport Print', 'success');
  }
}

declare global {
  interface HTMLElementTagNameMap { 'ps-smart-crop-panel': PsSmartCropPanel; }
}
