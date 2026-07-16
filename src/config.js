export const DEFAULTS = {
  preset: 'terminal',
  pdf: {
    format: 'A4',
    margin: { top: '2cm', bottom: '2cm', left: '2cm', right: '2cm' },
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: '<div style="width:100%; font-family:Menlo,monospace; font-size:7px; color:#666; text-align:center; padding:0 2cm;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
    viewport: { width: 720, height: 720 },
  },
  toc: {
    longDocWords: 8000,
    minPages: 3,
    title: 'Contents',
  },
};
