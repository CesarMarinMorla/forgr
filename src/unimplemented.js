export const UNIMPLEMENTED = {
  docMeta: { default: true, hint: '--no-doc-meta flag has no effect yet' },
  dateFormat: { default: 'iso', hint: 'dateFormat other than "iso" falls back to ISO' },
  dateLocale: { default: undefined, hint: 'dateLocale is not implemented yet' },
  cover: { default: false, hint: 'cover page is not implemented yet' },
  coverTitle: { default: '', hint: 'cover page is not implemented yet' },
  coverAuthor: { default: '', hint: 'cover page is not implemented yet' },
  coverDate: { default: '', hint: 'cover page is not implemented yet' },
  footer: { default: 'page-numbers', hint: 'footer style switching is not implemented yet' },
  sectionNumbering: { default: false, hint: 'section numbering toggle is not implemented yet' },
};

export function warnUnimplemented(config) {
  for (const [key, { default: def, hint }] of Object.entries(UNIMPLEMENTED)) {
    const val = config[key];
    if (val !== undefined && val !== def) {
      console.warn(`Warning: "${key}" is set to ${JSON.stringify(val)} but has no effect — ${hint}`);
    }
  }
}