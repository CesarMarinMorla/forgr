import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TEMPLATE_PATH = path.join(__dirname, 'templates', 'base.html');
const PRESETS_DIR = path.join(__dirname, 'templates', 'presets');
const PLEX_SANS_PATH = path.join(__dirname, 'assets', 'fonts', 'IBMPlexSans-Variable.woff2');
const PLEX_MONO_400_PATH = path.join(__dirname, 'assets', 'fonts', 'IBMPlexMono-400.woff2');
const PLEX_MONO_600_PATH = path.join(__dirname, 'assets', 'fonts', 'IBMPlexMono-600.woff2');

export async function renderTemplate(context = {}) {
  const preset = context.preset || 'terminal';
  const presetPath = path.join(PRESETS_DIR, `${preset}.css`);

  let presetCss;
  try {
    presetCss = await readFile(presetPath, 'utf8');
  } catch {
    console.error(`Error: preset "${preset}" not found. Available: terminal, minimal, technical, academic`);
    process.exit(1);
  }

  const [templateSrc, plexSansRaw, plexMono400Raw, plexMono600Raw] = await Promise.all([
    readFile(TEMPLATE_PATH, 'utf8'),
    readFile(PLEX_SANS_PATH).catch(() => null),
    readFile(PLEX_MONO_400_PATH).catch(() => null),
    readFile(PLEX_MONO_600_PATH).catch(() => null),
  ]);

  const plexSansB64 = plexSansRaw ? plexSansRaw.toString('base64') : null;
  const plexMono400B64 = plexMono400Raw ? plexMono400Raw.toString('base64') : null;
  const plexMono600B64 = plexMono600Raw ? plexMono600Raw.toString('base64') : null;

  const template = Handlebars.compile(templateSrc);

  return template({
    css: presetCss,
    plexSansB64,
    plexMono400B64,
    plexMono600B64,
    hasFonts: !!(plexSansB64 && plexMono400B64),
    ...context,
  });
}
