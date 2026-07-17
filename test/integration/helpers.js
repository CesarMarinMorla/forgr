import fs from 'fs-extra';
import { open } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { countPdfPages } from '../../src/pdf.js';

export async function assertValidPdf(outputPath, label, { minSize, minPages, fontName } = {}) {
  const exists = await fs.pathExists(outputPath);
  if (!exists) throw new assert.AssertionError({ message: `${label}: PDF file was not created`, actual: outputPath });

  const stats = await fs.stat(outputPath);
  const min = minSize ?? 1024;
  if (stats.size <= min) {
    throw new assert.AssertionError({ message: `${label}: PDF too small (${stats.size} <= ${min})`, actual: stats.size });
  }

  let buf = Buffer.alloc(5);
  const handle = await open(outputPath, 'r');
  await handle.read(buf, 0, 5, 0);
  await handle.close();
  if (buf.toString('ascii') !== '%PDF-') {
    throw new assert.AssertionError({ message: `${label}: not a PDF`, actual: buf.toString('ascii') });
  }

  if (minPages !== undefined) {
    const full = await fs.readFile(outputPath);
    const pages = countPdfPages(full);
    if (pages < minPages) {
      throw new assert.AssertionError({ message: `${label}: expected >= ${minPages} pages, got ${pages}`, actual: pages });
    }
  }

  if (fontName) {
    const full = await fs.readFile(outputPath);
    if (!full.includes(fontName)) {
      throw new assert.AssertionError({ message: `${label}: font "${fontName}" not embedded` });
    }
  }
}
