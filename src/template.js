import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';
import { BUILTIN_PRESETS } from './presets.js';
import { FONTS } from './assets/fonts/manifest.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TEMPLATE_PATH = path.join(__dirname, 'templates', 'base.html');
const PRESETS_DIR = path.join(__dirname, 'templates', 'presets');
const FONTS_DIR = path.join(__dirname, 'assets', 'fonts');

export async function renderTemplate(context = {}) {
  const preset = context.preset || 'terminal';
  const presetPath = path.join(PRESETS_DIR, `${preset}.css`);

  let presetCss;
  try {
    presetCss = await readFile(presetPath, 'utf8');
  } catch {
    const names = BUILTIN_PRESETS.map(p => p.name).join(', ');
    throw new Error(`preset "${preset}" not found. Available: ${names}`);
  }

  const reads = FONTS.map(f =>
    readFile(path.join(FONTS_DIR, f.file)).catch(() => null)
  );

  const [templateSrc, ...fontRaws] = await Promise.all([
    readFile(TEMPLATE_PATH, 'utf8'),
    ...reads,
  ]);

  const fontVars = {};
  let hasFonts = true;
  FONTS.forEach((f, i) => {
    const raw = fontRaws[i];
    if (!raw) {
      console.warn(`Warning: font not found: ${f.file} (falling back to system fonts)`);
      fontVars[f.key] = null;
      hasFonts = false;
    } else {
      fontVars[f.key] = raw.toString('base64');
    }
  });

  const template = Handlebars.compile(templateSrc);

  return template({
    css: presetCss,
    ...fontVars,
    hasFonts,
    ...context,
  });
}
