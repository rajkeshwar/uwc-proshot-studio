import { LitElement, html, css } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { engine } from '../../core/engine.js';
import { applyEnhancement, downloadCanvas, bitmapFromFile } from '../../core/image-utils.js';
import type { PillDef, EnhanceParams } from '../../core/types.js';
import '../../components/ps-drop-zone.js';
import '../../components/ps-slider.js';
import '../../components/ps-preset-pills.js';
import '../../components/ps-collapsible-sidebar.js';

const PRESETS: Record<string, EnhanceParams> = {
  natural: { brightness: 103, contrast: 102, saturation: 105, warmth: 5,   sharpen: 0.5, blur: 0,   vignette: 10 },
  studio:  { brightness: 108, contrast: 115, saturation: 90,  warmth: -5,  sharpen: 1.0, blur: 0.3, vignette: 20 },
  crisp:   { brightness: 100, contrast: 120, saturation: 110, warmth: 0,   sharpen: 2.0, blur: 0,   vignette: 0  },
  warm:    { brightness: 105, contrast: 100, saturation: 110, warmth: 30,  sharpen: 0.5, blur: 0.2, vignette: 15 },
  cool:    { brightness: 100, contrast: 105, saturation: 95,  warmth: -25, sharpen: 0.5, blur: 0,   vignette: 10 },
  bw:      { brightness: 100, contrast: 115, saturation: 0,   warmth: 0,   sharpen: 1.0, blur: 0,   vignette: 25 },
  reset:   { brightness: 100, contrast: 100, saturation: 100, warmth: 0,   sharpen: 0,   blur: 0,   vignette: 0  },
};

const PRESET_PILLS: PillDef[] = [
  { id: 'natural', label: 'Natural' },
  { id: 'studio',  label: 'Studio'  },
  { id: 'crisp',   label: 'Crisp'   },
  { id: 'warm',    label: 'Warm'    },
  { id: 'cool',    label: 'Cool'    },
  { id: 'bw',      label: 'B&W'     },
  { id: 'reset',   label: '↺ Reset' },
];

@customElement('ps-enhance-panel')
export class PsEnhancePanel extends LitElement {
  @state() private _params: EnhanceParams = { ...PRESETS.reset };
  @state() private _activePreset  = '';
  @state() private _hasSource     = false;
  @state() private _hasResult     = false;

  @query('#e-canvas')       private _canvas!: HTMLCanvasElement;
  @query('ps-drop-zone')    private _dropZone!: any;

  private _sourceBmp: ImageBitmap | null = null;

  connectedCallback() {
    super.connectedCallback();
    engine.bus.on('send:to-enhance', ({ bmp }) => {
      this._loadSource(bmp);
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
    .canvas-body { flex: 1; display: flex; align-items: center; justify-content: center; overflow: auto; padding: 2rem; }

    .chip { display: inline-flex; align-items: center; padding: 0.2rem 0.55rem; border-radius: 20px; font-size: 0.65rem; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; }
    .chip-cyan  { background: rgba(34,211,200,0.1); color: var(--ps-accent,#22d3c8); border: 1px solid rgba(34,211,200,0.2); }
    .chip-amber { background: rgba(245,158,11,0.1); color: var(--ps-amber,#f59e0b);  border: 1px solid rgba(245,158,11,0.2); }

    .placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--ps-muted,#6b7280); gap: 1rem; min-height: 300px; min-width: 360px; max-width: 480px; border-radius: 8px; border: 1.5px dashed var(--ps-border2,#2e3440); text-align: center; padding: 2rem; }
    .placeholder .big { font-size: 3rem; opacity: 0.3; }
    .placeholder p { font-size: 0.8rem; line-height: 1.6; max-width: 260px; margin: 0; }

    .img-frame { position: relative; border-radius: 8px; overflow: hidden; box-shadow: 0 0 0 1px var(--ps-border2,#2e3440), 0 8px 32px rgba(0,0,0,0.6); }
    canvas { display: block; max-width: min(100%,700px); max-height: calc(100vh - 170px); }

    .btn { display: flex; align-items: center; justify-content: center; gap: 0.45rem; padding: 0.55rem 1rem; border-radius: var(--ps-radius,6px); font-family: inherit; font-size: 0.78rem; font-weight: 600; cursor: pointer; border: none; transition: all 0.15s; width: 100%; }
    .btn-green { background: var(--ps-green,#22c55e); color: #000; }
    .btn-green:hover { background: #16a34a; }
    .btn-green:disabled { background: var(--ps-border2,#2e3440); color: var(--ps-muted,#6b7280); cursor: not-allowed; }

    @media (max-width: 767px) {
      .split { display: flex; flex-direction: column; height: auto; }
    }
  `;

  render() {
    const p = this._params;
    return html`
      <div class="split">
        <ps-collapsible-sidebar>
          <div class="section">
            <div class="section-title">Upload or Use Current</div>
            <ps-drop-zone icon="◈" label="Drop photo here"
              hint='Or use "Send to Enhance" from BG Studio'
              @ps-file-selected=${this._onFile}
              @ps-file-removed=${this._onFileRemoved}
            ></ps-drop-zone>
          </div>

          <div class="section">
            <div class="section-title">Quick Presets</div>
            <ps-preset-pills
              .pills=${PRESET_PILLS}
              .value=${this._activePreset}
              @ps-select=${this._onPreset}
            ></ps-preset-pills>
          </div>

          <div class="section">
            <div class="section-title">Tone &amp; Color</div>
            <ps-slider label="Brightness" min="0" max="200" .value=${p.brightness}
              @ps-change=${(e: CustomEvent) => this._setParam('brightness', e.detail.value)}></ps-slider>
            <ps-slider label="Contrast"   min="0" max="200" .value=${p.contrast}
              @ps-change=${(e: CustomEvent) => this._setParam('contrast',   e.detail.value)}></ps-slider>
            <ps-slider label="Saturation" min="0" max="200" .value=${p.saturation}
              @ps-change=${(e: CustomEvent) => this._setParam('saturation', e.detail.value)}></ps-slider>
            <ps-slider label="Warmth"     min="-50" max="50" .value=${p.warmth}
              @ps-change=${(e: CustomEvent) => this._setParam('warmth',     e.detail.value)}></ps-slider>
          </div>

          <div class="section">
            <div class="section-title">Sharpness &amp; Smoothing</div>
            <ps-slider label="Sharpen" min="0" max="3" step="0.1" .value=${p.sharpen}
              @ps-change=${(e: CustomEvent) => this._setParam('sharpen', e.detail.value)}></ps-slider>
            <ps-slider label="Denoise" min="0" max="3" step="0.1" .value=${p.blur}
              @ps-change=${(e: CustomEvent) => this._setParam('blur',    e.detail.value)}></ps-slider>
            <ps-slider label="Vignette" min="0" max="100" .value=${p.vignette}
              @ps-change=${(e: CustomEvent) => this._setParam('vignette', e.detail.value)}></ps-slider>
          </div>

          <div class="section">
            <button class="btn btn-green" ?disabled=${!this._hasSource} @click=${this._download}>
              ↓ Download Enhanced
            </button>
          </div>
        </ps-collapsible-sidebar>

        <div class="canvas-area">
          <div class="canvas-toolbar">
            <span class="chip chip-cyan">◈ Enhance &amp; Polish</span>
            <span class="chip chip-amber">All processing done locally</span>
          </div>
          <div class="canvas-body">
            <div class="placeholder" ?hidden=${this._hasResult}>
              <div class="big">◈</div>
              <p>Upload a photo to enhance tone, color, sharpness, and skin smoothing.</p>
            </div>
            <div class="img-frame" ?hidden=${!this._hasResult}>
              <canvas id="e-canvas"></canvas>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private async _onFile(e: CustomEvent) {
    const bmp = await bitmapFromFile(e.detail.file);
    this._loadSource(bmp);
  }

  private _onFileRemoved() {
    this._sourceBmp    = null;
    this._hasSource    = false;
    this._hasResult    = false;
    this._activePreset = '';
    if (this._canvas) { const ctx = this._canvas.getContext('2d'); ctx?.clearRect(0,0,this._canvas.width,this._canvas.height); }
  }

  private _loadSource(bmp: ImageBitmap): void {
    this._sourceBmp = bmp;
    this._hasSource = true;
    this.updateComplete.then(() => this._apply());
  }

  private _setParam(key: keyof EnhanceParams, value: number): void {
    this._params = { ...this._params, [key]: value };
    this._activePreset = '';
    this._apply();
  }

  private _onPreset(e: CustomEvent): void {
    const id: string = e.detail.id;
    const preset = PRESETS[id];
    if (!preset) return;
    this._params = { ...preset };
    this._activePreset = id === 'reset' ? '' : id;
    this._apply();
  }

  private _apply(): void {
    if (!this._sourceBmp) return;
    this.updateComplete.then(() => {
      if (this._canvas) {
        applyEnhancement(this._canvas, this._sourceBmp!, this._params);
        this._hasResult = true;
      }
    });
  }

  private _download(): void {
    if (this._canvas) {
      downloadCanvas(this._canvas, 'proshot-enhanced.png');
      engine.notify('Downloaded!', 'success');
    }
  }
}

declare global {
  interface HTMLElementTagNameMap { 'ps-enhance-panel': PsEnhancePanel; }
}
