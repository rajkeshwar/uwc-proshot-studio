import { LitElement, html, css } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { engine } from '../../core/engine.js';
import { downloadCanvas, bitmapFromFile } from '../../core/image-utils.js';
import type { SwatchDef, PillDef, PassportStandard, PaperSize } from '../../core/types.js';
import '../../components/ps-drop-zone.js';
import '../../components/ps-swatch-picker.js';
import '../../components/ps-preset-pills.js';
import '../../components/ps-toggle.js';
import '../../components/ps-collapsible-sidebar.js';

const PASSPORT_SIZES: Record<string, PassportStandard> = {
  us:     { w: 51, h: 51,  label: 'US 2×2"' },
  eu:     { w: 35, h: 45,  label: 'EU / UK 35×45mm' },
  in:     { w: 35, h: 45,  label: 'India 35×45mm' },
  cn:     { w: 33, h: 48,  label: 'China 33×48mm' },
  custom: { w: 35, h: 45,  label: 'Custom' },
};

const PAPER_SIZES: Record<string, PaperSize> = {
  '4x6':   { w: 101.6, h: 152.4, label: '4×6 inch' },
  'a4':    { w: 210,   h: 297,   label: 'A4' },
  'letter':{ w: 215.9, h: 279.4, label: 'US Letter' },
  '5x7':   { w: 127,   h: 177.8, label: '5×7 inch' },
};

const COUNTRY_PILLS: PillDef[] = [
  { id: 'us',     label: '🇺🇸 US'      },
  { id: 'eu',     label: '🇪🇺 EU / UK' },
  { id: 'in',     label: '🇮🇳 India'   },
  { id: 'cn',     label: '🇨🇳 China'   },
  { id: 'custom', label: 'Custom'        },
];

const BG_SWATCHES: SwatchDef[] = [
  { color: '#ffffff', label: 'White'    },
  { color: '#f0f0f0', label: 'Light Gray' },
  { color: '#dbeafe', label: 'Soft Blue' },
];

@customElement('ps-passport-print-panel')
export class PsPassportPrintPanel extends LitElement {
  @state() private _country   = 'us';
  @state() private _paper     = '4x6';
  @state() private _dpi       = 300;
  @state() private _bgColor   = '#ffffff';
  @state() private _guides    = true;
  @state() private _customW   = 35;
  @state() private _customH   = 45;
  @state() private _hasSource = false;
  @state() private _hasResult = false;
  @state() private _sheetInfo = '';

  // Info grid computed
  @state() private _infoW     = '51mm';
  @state() private _infoH     = '51mm';
  @state() private _infoCount = 8;

  @query('#p-canvas')       private _canvas!: HTMLCanvasElement;
  @query('#p-result')       private _resultEl!: HTMLElement;
  @query('#p-placeholder')  private _placeholder!: HTMLElement;
  @query('ps-drop-zone')    private _dropZone!: any;

  private _sourceBmp: ImageBitmap | null = null;

  connectedCallback() {
    super.connectedCallback();
    engine.bus.on('send:to-passport', ({ bmp }) => {
      this._sourceBmp = bmp;
      this._hasSource = true;
      this._updateInfo();
      engine.notify('Photo loaded for passport sheet', 'info');
      this.updateComplete.then(() => {
        const c = document.createElement('canvas');
        c.width = bmp.width; c.height = bmp.height;
        c.getContext('2d')!.drawImage(bmp, 0, 0);
        this._dropZone?.setPreview('From Smart Crop', c.toDataURL('image/jpeg', 0.5));
      });
    });
    this._updateInfo();
  }

  static styles = css`
    :host { display: flex; flex: 1; overflow: hidden; min-height: 0; }
    [hidden] { display: none !important; }

    .split { display: grid; grid-template-columns: 340px 1fr; height: 100%; width: 100%; overflow: hidden; }
    .section { padding: 1rem 1.1rem; border-bottom: 1px solid var(--ps-border,#252a32); }
    .section-title { font-size: 0.65rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ps-muted,#6b7280); margin-bottom: 0.75rem; }

    .canvas-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: var(--ps-bg,#0b0d0f); min-width: 0; }
    .canvas-toolbar { display: flex; align-items: center; gap: 0.5rem; padding: 0.55rem 1rem; border-bottom: 1px solid var(--ps-border,#252a32); background: var(--ps-surface,#13161a); flex-shrink: 0; flex-wrap: wrap; }
    .spacer { flex: 1; }
    .canvas-body { flex: 1; display: flex; align-items: flex-start; justify-content: center; overflow: auto; padding: 2rem; }

    .chip { display: inline-flex; align-items: center; padding: 0.2rem 0.55rem; border-radius: 20px; font-size: 0.65rem; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; }
    .chip-cyan  { background: rgba(34,211,200,0.1); color: var(--ps-accent,#22d3c8); border: 1px solid rgba(34,211,200,0.2); }
    .chip-amber { background: rgba(245,158,11,0.1); color: var(--ps-amber,#f59e0b);  border: 1px solid rgba(245,158,11,0.2); }

    .placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--ps-muted,#6b7280); gap: 1rem; min-height: 300px; min-width: 360px; max-width: 480px; border-radius: 8px; border: 1.5px dashed var(--ps-border2,#2e3440); text-align: center; padding: 2rem; }
    .placeholder .big { font-size: 3rem; opacity: 0.3; }
    .placeholder p { font-size: 0.8rem; line-height: 1.6; max-width: 260px; margin: 0; }

    .passport-grid { background: #f0f0f0; border-radius: 6px; overflow: hidden; display: inline-block; box-shadow: 0 4px 24px rgba(0,0,0,0.5); }
    .passport-grid canvas { display: block; max-width: 100%; height: auto; }

    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem; margin-top: 0.6rem; }
    .info-card { background: var(--ps-panel,#1a1e24); border: 1px solid var(--ps-border,#252a32); border-radius: var(--ps-radius,6px); padding: 0.5rem 0.6rem; text-align: center; }
    .info-card .val { font-size: 0.9rem; font-weight: 700; font-family: var(--ps-font-display,'Syne',sans-serif); color: var(--ps-accent,#22d3c8); }
    .info-card .lbl { font-size: 0.6rem; color: var(--ps-muted,#6b7280); margin-top: 0.1rem; text-transform: uppercase; letter-spacing: 0.06em; }

    .custom-row { display: flex; gap: 0.4rem; margin-top: 0.5rem; }
    .num-input { background: var(--ps-panel,#1a1e24); color: var(--ps-text,#e8eaf0); border: 1px solid var(--ps-border2,#2e3440); border-radius: 4px; padding: 0.3rem 0.5rem; font-size: 0.75rem; width: 70px; }
    .num-input:focus { outline: 1px solid var(--ps-accent,#22d3c8); }

    .ctrl-row { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.6rem; }
    .ctrl-label { font-size: 0.72rem; color: var(--ps-muted,#6b7280); font-weight: 500; flex-shrink: 0; }
    select { background: var(--ps-panel,#1a1e24); color: var(--ps-text,#e8eaf0); border: 1px solid var(--ps-border2,#2e3440); border-radius: var(--ps-radius,6px); padding: 0.3rem 0.5rem; font-size: 0.75rem; font-family: inherit; cursor: pointer; flex: 1; }
    select:focus { outline: 1px solid var(--ps-accent,#22d3c8); }

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
    const isCustom = this._country === 'custom';
    return html`
      <div class="split">
        <ps-collapsible-sidebar>
          <div class="section">
            <div class="section-title">Upload Photo</div>
            <ps-drop-zone icon="⊞" label="Drop headshot here" hint="Use a photo with removed background for best results" @ps-file-selected=${this._onFile} @ps-file-removed=${this._onFileRemoved}></ps-drop-zone>
          </div>

          <div class="section">
            <div class="section-title">Photo Size Standard</div>
            <ps-preset-pills .pills=${COUNTRY_PILLS} .value=${this._country}
              @ps-select=${(e: CustomEvent) => { this._country = e.detail.id; this._updateInfo(); }}
            ></ps-preset-pills>
            ${isCustom ? html`
              <div class="custom-row">
                <input type="number" class="num-input" placeholder="W mm" .value=${String(this._customW)}
                  @input=${(e: Event) => { this._customW = parseFloat((e.target as HTMLInputElement).value) || 35; this._updateInfo(); }} />
                <input type="number" class="num-input" placeholder="H mm" .value=${String(this._customH)}
                  @input=${(e: Event) => { this._customH = parseFloat((e.target as HTMLInputElement).value) || 45; this._updateInfo(); }} />
              </div>
            ` : ''}
            <div class="info-grid">
              <div class="info-card"><div class="val">${this._infoW}</div><div class="lbl">Width</div></div>
              <div class="info-card"><div class="val">${this._infoH}</div><div class="lbl">Height</div></div>
              <div class="info-card"><div class="val">${this._infoCount}</div><div class="lbl">Photos</div></div>
              <div class="info-card"><div class="val">${this._dpi}</div><div class="lbl">DPI</div></div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Print Sheet</div>
            <div class="ctrl-row">
              <span class="ctrl-label">Paper</span>
              <select @change=${(e: Event) => { this._paper = (e.target as HTMLSelectElement).value; this._updateInfo(); }}>
                <option value="4x6">4×6 inch (Photo Print)</option>
                <option value="a4">A4 (210×297mm)</option>
                <option value="letter">US Letter (8.5×11 in)</option>
                <option value="5x7">5×7 inch</option>
              </select>
            </div>
            <div class="ctrl-row">
              <span class="ctrl-label">Background</span>
              <ps-swatch-picker .swatches=${BG_SWATCHES} .value=${this._bgColor}
                @ps-color-change=${(e: CustomEvent) => { this._bgColor = e.detail.color; }}
              ></ps-swatch-picker>
            </div>
            <div class="ctrl-row">
              <span class="ctrl-label">DPI</span>
              <select @change=${(e: Event) => { this._dpi = parseInt((e.target as HTMLSelectElement).value); this._updateInfo(); }}>
                <option value="150">150 dpi (web view)</option>
                <option value="300" selected>300 dpi (print quality)</option>
                <option value="600">600 dpi (high quality)</option>
              </select>
            </div>
            <ps-toggle label="Show crop guides" .checked=${this._guides}
              @ps-change=${(e: CustomEvent) => { this._guides = e.detail.checked; }}
            ></ps-toggle>
          </div>

          <div class="section">
            <button class="btn btn-primary" ?disabled=${!this._hasSource} @click=${this._generate}>
              ⊞ Generate Passport Sheet
            </button>
            <div class="btn-row">
              <button class="btn btn-green" ?disabled=${!this._hasResult} @click=${this._download}>↓ Download Sheet</button>
              <button class="btn btn-ghost" ?disabled=${!this._hasResult} @click=${this._print}>🖨 Print</button>
            </div>
          </div>
        </ps-collapsible-sidebar>

        <div class="canvas-area">
          <div class="canvas-toolbar">
            <span class="chip chip-cyan">Passport Print Layout</span>
            ${this._sheetInfo ? html`<span class="chip chip-amber">${this._sheetInfo}</span>` : ''}
            <span class="spacer"></span>
            <span style="font-size:0.68rem;color:var(--ps-muted,#6b7280)">Ready to print at selected DPI</span>
          </div>
          <div class="canvas-body">
            <div class="placeholder" id="p-placeholder" ?hidden=${this._hasResult}>
              <div class="big">⊞</div>
              <p>Upload a headshot, choose your country's passport standard, then generate a print-ready sheet.</p>
            </div>
            <div class="passport-grid" id="p-result" ?hidden=${!this._hasResult}>
              <canvas id="p-canvas"></canvas>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private async _onFile(e: CustomEvent) {
    this._sourceBmp = await bitmapFromFile(e.detail.file);
    this._hasSource = true;
    this._updateInfo();
    engine.notify('Photo loaded for passport sheet', 'info');
  }

  private _onFileRemoved() {
    this._sourceBmp = null;
    this._hasSource = false;
    this._hasResult = false;
    if (this._canvas) { const ctx = this._canvas.getContext('2d'); ctx?.clearRect(0,0,this._canvas.width,this._canvas.height); }
  }

  private _getPassportSize(): { w: number; h: number } {
    if (this._country === 'custom') return { w: this._customW, h: this._customH };
    return PASSPORT_SIZES[this._country];
  }

  private _updateInfo(): void {
    const ps    = this._getPassportSize();
    const paper = PAPER_SIZES[this._paper];
    const margin = 5, gap = 3;
    const usableW = paper.w - margin * 2;
    const usableH = paper.h - margin * 2;
    const cols = Math.floor((usableW + gap) / (ps.w + gap));
    const rows = Math.floor((usableH + gap) / (ps.h + gap));
    this._infoW = ps.w + 'mm';
    this._infoH = ps.h + 'mm';
    this._infoCount = cols * rows;
  }

  private async _generate(): Promise<void> {
    if (!this._sourceBmp) return;
    await this.updateComplete;

    const ps      = this._getPassportSize();
    const paper   = PAPER_SIZES[this._paper];
    const dpi     = this._dpi;
    const mmToPx  = dpi / 25.4;
    const margin  = 5, gap = 3;

    const sheetW  = Math.round(paper.w * mmToPx);
    const sheetH  = Math.round(paper.h * mmToPx);
    const photoW  = Math.round(ps.w * mmToPx);
    const photoH  = Math.round(ps.h * mmToPx);
    const marginPx= Math.round(margin * mmToPx);
    const gapPx   = Math.round(gap * mmToPx);

    const cols = Math.floor(((sheetW - marginPx * 2) + gapPx) / (photoW + gapPx));
    const rows = Math.floor(((sheetH - marginPx * 2) + gapPx) / (photoH + gapPx));

    const canvas = this._canvas;
    canvas.width  = sheetW;
    canvas.height = sheetH;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, sheetW, sheetH);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = marginPx + col * (photoW + gapPx);
        const y = marginPx + row * (photoH + gapPx);

        ctx.fillStyle = this._bgColor;
        ctx.fillRect(x, y, photoW, photoH);

        const srcAR = this._sourceBmp!.width / this._sourceBmp!.height;
        const dstAR = photoW / photoH;
        let drawW, drawH, drawX, drawY;
        if (srcAR > dstAR) {
          drawH = photoH; drawW = photoH * srcAR;
          drawX = x + (photoW - drawW) / 2; drawY = y;
        } else {
          drawW = photoW; drawH = photoW / srcAR;
          drawX = x; drawY = y + (photoH - drawH) / 2;
        }
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, photoW, photoH);
        ctx.clip();
        ctx.drawImage(this._sourceBmp!, drawX, drawY, drawW, drawH);
        ctx.restore();

        if (this._guides) {
          ctx.strokeStyle = 'rgba(180,180,180,0.8)';
          ctx.lineWidth = Math.max(1, mmToPx * 0.3);
          ctx.setLineDash([Math.round(gapPx * 0.3), Math.round(gapPx * 0.3)]);
          ctx.strokeRect(x, y, photoW, photoH);
          ctx.setLineDash([]);
        }
      }
    }

    // Label
    ctx.fillStyle = 'rgba(150,150,150,0.6)';
    ctx.font = `${Math.round(6 * mmToPx)}px sans-serif`;
    ctx.fillText(
      `ProShot Studio · ${PASSPORT_SIZES[this._country]?.label ?? 'Custom'} · ${cols}×${rows}=${cols*rows} photos · ${dpi}dpi`,
      marginPx, sheetH - Math.round(2 * mmToPx)
    );

    // Scale for display
    const body = this.shadowRoot?.querySelector('.canvas-body') as HTMLElement;
    if (body) {
      const availW = body.clientWidth - 32;
      const availH = body.clientHeight - 32;
      const scale = Math.min(1, availW / sheetW, (availH > 100 ? availH : 500) / sheetH);
      canvas.style.width  = Math.round(sheetW * scale) + 'px';
      canvas.style.height = Math.round(sheetH * scale) + 'px';
    }

    this._hasResult = true;
    this._sheetInfo = `${cols}×${rows} = ${cols * rows} photos on ${this._paper}`;
    engine.notify(`Generated ${cols * rows} passport photos at ${dpi}dpi`, 'success');
  }

  private _download(): void {
    if (this._canvas) {
      downloadCanvas(this._canvas, 'proshot-passport-sheet.png');
      engine.notify('Downloaded!', 'success');
    }
  }

  private _print(): void {
    if (!this._canvas) return;
    this._canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const win = window.open('', '_blank')!;
      win.document.write(`
        <html><head><title>ProShot Passport Print</title>
        <style>body{margin:0;background:#fff}img{width:100%;height:auto;display:block}
        @media print{body{margin:0}img{width:100%;height:auto}@page{margin:0;size:auto}}</style>
        </head><body><img src="${url}" onload="window.print()"></body></html>
      `);
    }, 'image/png');
  }
}

declare global {
  interface HTMLElementTagNameMap { 'ps-passport-print-panel': PsPassportPrintPanel; }
}
