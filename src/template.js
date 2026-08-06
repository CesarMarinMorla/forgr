import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';
import { USER_PRESETS_DIR, findUserPreset, listPresets } from './presets.js';
import { PresetNotFoundError } from './errors.js';
import { FONTS } from './assets/fonts/manifest.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TEMPLATE_PATH = path.join(__dirname, 'templates', 'base.html');
const PRESETS_DIR = path.join(__dirname, 'templates', 'presets');
const FONTS_DIR = path.join(__dirname, 'assets', 'fonts');

export async function renderTemplate(context = {}, { userPresetsDir = USER_PRESETS_DIR } = {}) {
  const preset = context.preset || 'terminal';
  const builtinPath = path.join(PRESETS_DIR, `${preset}.css`);

  let presetCss;
  try {
    presetCss = await readFile(builtinPath, 'utf8');
  } catch {
    const user = findUserPreset(preset, userPresetsDir);
    if (user && user.cssPath) {
      presetCss = await readFile(user.cssPath, 'utf8');
    } else {
      const names = listPresets(userPresetsDir).map(p => p.name);
      throw new PresetNotFoundError(preset, names);
    }
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
