import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generatePdfOptions } from '../../src/pdf.js';

const render = {
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate: '<footer></footer>',
};

test('generatePdfOptions: portrait sets landscape false', () => {
  const opts = generatePdfOptions('A4', 'portrait', { top: '2cm' }, render);
  assert.equal(opts.format, 'A4');
  assert.equal(opts.landscape, false);
  assert.equal(opts.margin.top, '2cm');
  assert.equal(opts.printBackground, true);
});

test('generatePdfOptions: landscape sets landscape true', () => {
  const opts = generatePdfOptions('Letter', 'landscape', { top: '2cm' }, render);
  assert.equal(opts.format, 'Letter');
  assert.equal(opts.landscape, true);
});

test('generatePdfOptions: unknown orientation defaults to portrait', () => {
  const opts = generatePdfOptions('A4', undefined, { top: '2cm' }, render);
  assert.equal(opts.landscape, false);
});