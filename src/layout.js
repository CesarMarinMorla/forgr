const MM_TO_PX = 96 / 25.4;

const PAGE_SIZES = {
  A4: { widthMm: 210, heightMm: 297 },
  Letter: { widthMm: 215.9, heightMm: 279.4 },
};

const DEFAULT_MARGINS = { top: '2cm', bottom: '2cm', left: '2cm', right: '2cm' };

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

export function pageSize(paperFormat) {
  return PAGE_SIZES[paperFormat] || PAGE_SIZES.A4;
}

export function contentSize(paperFormat, margins = DEFAULT_MARGINS, orientation = 'portrait') {
  const size = pageSize(paperFormat);
  const width = size.widthMm - toMm(margins.left) - toMm(margins.right);
  const height = size.heightMm - toMm(margins.top) - toMm(margins.bottom);
  const landscape = orientation === 'landscape';
  return {
    widthPx: Math.round((landscape ? height : width) * MM_TO_PX),
    heightPx: Math.round((landscape ? width : height) * MM_TO_PX),
  };
}

export function contentHeight(paperFormat, margins = DEFAULT_MARGINS, orientation = 'portrait') {
  return contentSize(paperFormat, margins, orientation).heightPx;
}
