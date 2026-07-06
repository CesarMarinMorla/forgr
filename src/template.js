import { readFile } from 'fs/promises';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TEMPLATE_PATH = path.join(__dirname, 'templates', 'base.html');
const STOCK_CSS_PATH = path.join(__dirname, 'templates', 'presets', 'stock.css');
const PLEX_SANS_PATH = path.join(__dirname, 'assets', 'fonts', 'IBMPlexSans-Variable.woff2');
const PLEX_MONO_PATH = path.join(__dirname, 'assets', 'fonts', 'IBMPlexMono.woff2');

export async function renderTemplate(context = {}) {
  const [templateSrc, stockCss, plexSansRaw, plexMonoRaw] = await Promise.all([
    readFile(TEMPLATE_PATH, 'utf8'),
    readFile(STOCK_CSS_PATH, 'utf8'),
    readFile(PLEX_SANS_PATH).catch(() => null),
    readFile(PLEX_MONO_PATH).catch(() => null),
  ]);

  const plexSansB64 = plexSansRaw ? plexSansRaw.toString('base64') : null;
  const plexMonoB64 = plexMonoRaw ? plexMonoRaw.toString('base64') : null;

  const template = Handlebars.compile(templateSrc);

  return template({
    css: stockCss,
    plexSansB64,
    plexMonoB64,
    hasFonts: !!(plexSansB64 && plexMonoB64),
    ...context,
  });
}
