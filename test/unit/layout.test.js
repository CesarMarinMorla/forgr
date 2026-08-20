import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  contentSize,
  contentHeight,
  pageOf,
  diagramScale,
  diagramSizing,
  parseViewBox,
  toPx,
  toMm,
  MAX_DIAGRAM_HEIGHT_RATIO,
  WHOLE_PAGE_RATIO,
} from '../../src/layout.js';

test('toPx: converts css units to px', () => {
  assert.equal(toPx('2cm'), 76);
  assert.equal(toPx('40mm'), 151);
  assert.equal(toPx('1in'), 96);
  assert.equal(toPx('12pt'), 16);
  assert.equal(toPx(100), 100);
});

test('toMm: numbers are px, bare strings are mm', () => {
  assert.equal(toMm(20), (20 * 25.4) / 96);
  assert.equal(toMm('1cm'), 10);
  assert.equal(toMm('20'), 20);
});

test('contentSize: A4 with default 2cm margins', () => {
  const { widthPx, heightPx } = contentSize('A4');
  assert.equal(widthPx, Math.round(170 * (96 / 25.4)));
  assert.equal(heightPx, Math.round(257 * (96 / 25.4)));
});

test('contentSize: Letter with default margins', () => {
  const { widthPx, heightPx } = contentSize('Letter');
  assert.equal(widthPx, Math.round(175.9 * (96 / 25.4)));
  assert.equal(heightPx, Math.round(239.4 * (96 / 25.4)));
});

test('contentSize: honors asymmetric margins', () => {
  const { widthPx, heightPx } = contentSize('A4', { top: '3cm', bottom: '1cm', left: '1cm', right: '4cm' });
  assert.equal(widthPx, Math.round(160 * (96 / 25.4)));
  assert.equal(heightPx, Math.round(257 * (96 / 25.4)));
});

test('contentSize: landscape swaps width and height', () => {
  const portrait = contentSize('A4');
  const landscape = contentSize('A4', undefined, 'landscape');
  assert.equal(landscape.widthPx, portrait.heightPx);
  assert.equal(landscape.heightPx, portrait.widthPx);
});

test('contentSize: portrait orientation keeps portrait dims', () => {
  const portrait = contentSize('A4', undefined, 'portrait');
  assert.equal(portrait.widthPx, Math.round(170 * (96 / 25.4)));
  assert.equal(portrait.heightPx, Math.round(257 * (96 / 25.4)));
});

test('contentSize: landscape Letter swaps dimensions', () => {
  const portrait = contentSize('Letter');
  const landscape = contentSize('Letter', undefined, 'landscape');
  assert.equal(landscape.widthPx, portrait.heightPx);
  assert.equal(landscape.heightPx, portrait.widthPx);
});

test('contentHeight: landscape uses the swapped height', () => {
  assert.equal(contentHeight('A4', undefined, 'landscape'), contentSize('A4').widthPx);
});

test('contentHeight: A4 default matches legacy 40mm formula', () => {
  assert.equal(contentHeight('A4'), Math.round((297 - 40) * (96 / 25.4)));
});

test('pageOf: maps flow y to 1-based page', () => {
  const h = 971;
  assert.equal(pageOf(0, h), 1);
  assert.equal(pageOf(970.9, h), 1);
  assert.equal(pageOf(971, h), 2);
  assert.equal(pageOf(971 * 3, h), 4);
});

test('diagramScale: no scaling when diagram fits', () => {
  assert.equal(diagramScale({ width: 300, height: 200, maxWidth: 643, maxHeight: 825 }), 1);
});

test('diagramScale: caps to maxWidth', () => {
  assert.equal(diagramScale({ width: 1000, height: 500, maxWidth: 643, maxHeight: 825 }), 0.643);
});

test('diagramScale: caps to maxHeight', () => {
  assert.equal(diagramScale({ width: 500, height: 1200, maxWidth: 643, maxHeight: 825 }), 0.6875);
});

test('diagramScale: smallest constraint wins', () => {
  assert.equal(diagramScale({ width: 2000, height: 900, maxWidth: 643, maxHeight: 825 }), 0.3215);
});

test('diagramScale: missing dims returns 1', () => {
  assert.equal(diagramScale({ width: 0, height: 0, maxWidth: 643, maxHeight: 825 }), 1);
});

test('MAX_DIAGRAM_HEIGHT_RATIO caps diagrams below full page', () => {
  assert.ok(MAX_DIAGRAM_HEIGHT_RATIO < 1);
  assert.ok(MAX_DIAGRAM_HEIGHT_RATIO > 0.8);
});

test('parseViewBox: extracts width and height', () => {
  assert.deepEqual(parseViewBox('<svg viewBox="0 0 1234.5 678.25"><g></g></svg>'), {
    width: 1234.5,
    height: 678.25,
  });
});

test('parseViewBox: tolerates negative origin', () => {
  assert.deepEqual(parseViewBox('<svg viewBox="-10 -5 100 50"></svg>'), { width: 100, height: 50 });
});

test('parseViewBox: null on missing or malformed', () => {
  assert.equal(parseViewBox('<svg></svg>'), null);
  assert.equal(parseViewBox('<svg viewBox="0 0 100"></svg>'), null);
});

test('diagramSizing: natural when diagram fits without scaling', () => {
  const r = diagramSizing({ width: 300, height: 200, maxWidth: 643, maxHeight: 825, wholePageHeight: 893, floor: 0.65 });
  assert.equal(r.mode, 'natural');
  assert.equal(r.target, 'content');
  assert.equal(r.scale, 1);
});

test('diagramSizing: fit when diagram scales into content box at acceptable level', () => {
  const r = diagramSizing({ width: 800, height: 600, maxWidth: 643, maxHeight: 825, wholePageHeight: 893, floor: 0.65 });
  assert.equal(r.mode, 'fit');
  assert.equal(r.target, 'content');
  assert.ok(r.scale < 1);
  assert.ok(r.scale >= 0.65);
});

test('diagramSizing: fit for wide-but-short diagram (only width binds)', () => {
  const r = diagramSizing({ width: 2000, height: 200, maxWidth: 643, maxHeight: 825, wholePageHeight: 893, floor: 0.65 });
  assert.equal(r.target, 'content');
  assert.equal(r.mode, 'fit');
  assert.ok(r.scale < 0.65);
});

test('diagramSizing: whole-page when height can not fit content box legibly', () => {
  const r = diagramSizing({ width: 200, height: 1300, maxWidth: 643, maxHeight: 825, wholePageHeight: 893, floor: 0.65 });
  assert.equal(r.target, 'page');
  assert.equal(r.mode, 'whole-page');
  assert.ok(r.scale >= 0.65);
});

test('diagramSizing: xl when even whole page can not hold the diagram legibly', () => {
  const r = diagramSizing({ width: 200, height: 5000, maxWidth: 643, maxHeight: 825, wholePageHeight: 893, floor: 0.65 });
  assert.equal(r.target, 'page');
  assert.equal(r.mode, 'xl');
  assert.ok(r.scale < 0.65);
});

test('diagramSizing: zero dims returns natural', () => {
  const r = diagramSizing({ width: 0, height: 0, maxWidth: 643, maxHeight: 825, wholePageHeight: 893, floor: 0.65 });
  assert.equal(r.mode, 'natural');
  assert.equal(r.scale, 1);
});

test('WHOLE_PAGE_RATIO allows more of the page than MAX_DIAGRAM_HEIGHT_RATIO', () => {
  assert.ok(WHOLE_PAGE_RATIO > MAX_DIAGRAM_HEIGHT_RATIO);
  assert.ok(WHOLE_PAGE_RATIO <= 0.95);
});
