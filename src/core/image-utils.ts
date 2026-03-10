import type { BgGradientDef, FaceDetectionResult, EnhanceParams } from './types.js';

// ─── Background Gradient Definitions ────────────────────────────────────────
export const BG_GRADIENTS: BgGradientDef[] = [
  { id: 'none',      css: 'none',                                        label: 'None' },
  { id: 'gradient1', css: 'linear-gradient(135deg,#667eea,#764ba2)',     label: 'Purple' },
  { id: 'gradient2', css: 'linear-gradient(135deg,#f093fb,#f5576c)',     label: 'Pink' },
  { id: 'gradient3', css: 'linear-gradient(135deg,#4facfe,#00f2fe)',     label: 'Sky' },
  { id: 'gradient4', css: 'linear-gradient(135deg,#43e97b,#38f9d7)',     label: 'Mint' },
  { id: 'gradient5', css: 'linear-gradient(135deg,#fa709a,#fee140)',     label: 'Sunset' },
  { id: 'gradient6', css: 'linear-gradient(135deg,#a18cd1,#fbc2eb)',     label: 'Lavender' },
  { id: 'gradient7', css: 'linear-gradient(135deg,#ffecd2,#fcb69f)',     label: 'Peach' },
];

/** Resolve a gradient id to a CanvasGradient or null */
export function resolveGradient(
  ctx: CanvasRenderingContext2D,
  gradientId: string,
  w: number,
  h: number
): CanvasGradient | null {
  const def = BG_GRADIENTS.find(g => g.id === gradientId);
  if (!def || def.css === 'none') return null;

  const match = def.css.match(/linear-gradient\(135deg,(#[0-9a-f]+),(#[0-9a-f]+)\)/i);
  if (!match) return null;

  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, match[1]);
  grad.addColorStop(1, match[2]);
  return grad;
}

/** Render a source bitmap onto a canvas with optional solid/gradient background */
export function renderToCanvas(
  canvas: HTMLCanvasElement,
  source: ImageBitmap | HTMLCanvasElement,
  bgColor: string,
  bgGradientId = 'none'
): void {
  const w = 'width' in source ? source.width : (source as HTMLCanvasElement).width;
  const h = 'height' in source ? source.height : (source as HTMLCanvasElement).height;

  canvas.width  = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, w, h);

  if (bgGradientId !== 'none') {
    const grad = resolveGradient(ctx, bgGradientId, w, h);
    if (grad) {
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }
  } else if (bgColor && bgColor !== 'transparent') {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, w, h);
  }

  ctx.drawImage(source as CanvasImageSource, 0, 0);
}

/** Download a canvas as PNG */
export function downloadCanvas(canvas: HTMLCanvasElement, filename: string): void {
  canvas.toBlob(blob => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  }, 'image/png');
}

/** Download a blob directly */
export function downloadBlob(blob: Blob, filename: string): void {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

/** Create ImageBitmap from a File */
export function bitmapFromFile(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file);
}

// ─── Face Detection ──────────────────────────────────────────────────────────

/** Use native FaceDetector API or fall back to pixel heuristic */
export async function detectFace(bmp: ImageBitmap): Promise<FaceDetectionResult | null> {
  try {
    if ('FaceDetector' in window) {
      const detector = new (window as any).FaceDetector({ maxDetectedFaces: 1 });
      const faces = await detector.detect(bmp);
      if (faces.length === 0) return fallbackPixelDetect(bmp);
      const box = faces[0].boundingBox;
      return { x: box.x + box.width / 2, y: box.y + box.height / 2, w: box.width, h: box.height, top: box.y, left: box.x };
    }
  } catch (_) { /* fall through */ }
  return fallbackPixelDetect(bmp);
}

function fallbackPixelDetect(bmp: ImageBitmap): FaceDetectionResult | null {
  try {
    const c = Object.assign(document.createElement('canvas'), { width: bmp.width, height: bmp.height });
    const ctx = c.getContext('2d')!;
    ctx.drawImage(bmp, 0, 0);
    const data = ctx.getImageData(0, 0, c.width, c.height).data;

    let minX = c.width, maxX = 0, minY = c.height, maxY = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 30) {
        const px = (i / 4) % c.width;
        const py = Math.floor((i / 4) / c.width);
        if (px < minX) minX = px;
        if (px > maxX) maxX = px;
        if (py < minY) minY = py;
        if (py > maxY) maxY = py;
      }
    }
    if (maxX <= minX) return null;
    const subjectH = maxY - minY;
    const subjectW = maxX - minX;
    const headBottom = minY + subjectH * 0.38;
    const headCX = (minX + maxX) / 2;
    const headCY = (minY + headBottom) / 2;
    return { x: headCX, y: headCY, w: subjectW * 0.7, h: headBottom - minY, top: minY, left: headCX - subjectW * 0.35 };
  } catch (_) { return null; }
}

// ─── Image Enhancement ───────────────────────────────────────────────────────

export function applyEnhancement(
  canvas: HTMLCanvasElement,
  source: ImageBitmap,
  params: EnhanceParams
): void {
  canvas.width  = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext('2d')!;

  let filterStr = `brightness(${params.brightness}%) contrast(${params.contrast}%) saturate(${params.saturation}%)`;
  if (params.blur > 0) filterStr += ` blur(${params.blur}px)`;
  ctx.filter = filterStr;
  ctx.drawImage(source, 0, 0);
  ctx.filter = 'none';

  if (params.warmth !== 0) applyWarmth(ctx, canvas.width, canvas.height, params.warmth);
  if (params.sharpen > 0)  applySharpen(ctx, canvas.width, canvas.height, params.sharpen);
  if (params.vignette > 0) applyVignette(ctx, canvas.width, canvas.height, params.vignette / 100);
}

function applyWarmth(ctx: CanvasRenderingContext2D, w: number, h: number, warmth: number): void {
  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;
  const rShift = warmth > 0 ? warmth * 1.5 : warmth;
  const bShift = warmth > 0 ? -warmth * 0.5 : -warmth * 1.5;
  for (let i = 0; i < d.length; i += 4) {
    d[i]     = Math.min(255, Math.max(0, d[i]     + rShift));
    d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + bShift));
  }
  ctx.putImageData(imgData, 0, 0);
}

function applySharpen(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number): void {
  const imgData = ctx.getImageData(0, 0, w, h);
  const src = new Uint8ClampedArray(imgData.data);
  const dst = imgData.data;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) {
        const center = src[i + c];
        const up    = src[((y - 1) * w + x) * 4 + c];
        const down  = src[((y + 1) * w + x) * 4 + c];
        const left  = src[(y * w + x - 1) * 4 + c];
        const right = src[(y * w + x + 1) * 4 + c];
        dst[i + c] = Math.min(255, Math.max(0, center * (1 + 4 * amount) - amount * (up + down + left + right)));
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);
}

function applyVignette(ctx: CanvasRenderingContext2D, w: number, h: number, strength: number): void {
  const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.sqrt(w * w + h * h) / 2);
  grad.addColorStop(0,   'rgba(0,0,0,0)');
  grad.addColorStop(0.5, 'rgba(0,0,0,0)');
  grad.addColorStop(1,   `rgba(0,0,0,${Math.min(0.85, strength * 0.85)})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}
