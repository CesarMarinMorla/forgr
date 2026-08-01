const MM_TO_PX = 96 / 25.4;

const PAGE_SIZES = {
  A4: { widthMm: 210, heightMm: 297 },
  Letter: { widthMm: 215.9, heightMm: 279.4 },
};

const DEFAULT_MARGINS = { top: '2cm', bottom: '2cm', left: '2cm', right: '2cm' };

export const MAX_DIAGRAM_HEIGHT_RATIO = 0.85;
export const MAX_WIDTH_RATIO = 0.98;
export const LEGIBILITY_SCALE_FLOOR = 0.65;
export const DIAGRAM_FONT_REDUCTION = 0.7;
export const MIN_DIAGRAM_FONT = 9;
export const MAX_LAYOUT_ITERATIONS = 5;

export function toMm(value) {
  if (typeof value === 'number') return (value * 25.4) / 96;
  const m = /^([\d.]+)\s*(cm|mm|in|px|pt)?$/.exec(String(value).trim());
  if (!m) return 0;
  const n = parseFloat(m[1]);
  switch (m[2]) {
    case 'cm': return n * 10;
    case 'mm': return n;
    case 'in': return n * 25.4;
    case 'px': return (n * 25.4) / 96;
    case 'pt': return (n * 25.4) / 72;
    default: return n;
  }
}

export function toPx(value) {
  return Math.round(toMm(value) * MM_TO_PX);
}

export function pageSize(paperFormat) {
  return PAGE_SIZES[paperFormat] || PAGE_SIZES.A4;
}

export function contentSize(paperFormat, margins = DEFAULT_MARGINS) {
  const size = pageSize(paperFormat);
  return {
    widthPx: Math.round((size.widthMm - toMm(margins.left) - toMm(margins.right)) * MM_TO_PX),
    heightPx: Math.round((size.heightMm - toMm(margins.top) - toMm(margins.bottom)) * MM_TO_PX),
  };
}

export function contentHeight(paperFormat, margins = DEFAULT_MARGINS) {
  return contentSize(paperFormat, margins).heightPx;
}

export function pageOf(y, pageHeight) {
  return Math.floor(y / pageHeight) + 1;
}

export function diagramScale({ width, height, maxWidth, maxHeight }) {
  if (!width || !height) return 1;
  return Math.min(1, maxWidth / width, maxHeight / height);
}

export function parseViewBox(svg) {
  const m = /viewBox=["']([\d. -]+)["']/.exec(svg);
  if (!m) return null;
  const parts = m[1].trim().split(/[\s,]+/).map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return null;
  return { width: parts[2], height: parts[3] };
}
