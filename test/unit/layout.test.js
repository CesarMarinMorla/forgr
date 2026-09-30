import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  contentSize,
  contentHeight,
  toMm,
} from '../../src/layout.js';

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
