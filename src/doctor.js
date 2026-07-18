import { existsSync, readFileSync, readdirSync, statSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { createRequire } from 'module';
import { homedir } from 'os';
import { BROWSERS_PATH, getChromiumInstallCmd, getHeadlessShellPath } from './browsers-path.js';
import { BUILTIN_PRESETS } from './presets.js';

const require = createRequire(import.meta.url);
const { version: PACKAGE_VERSION, engines } = require('../package.json');

const __dirname = dirname(fileURLToPath(import.meta.url));
const PRESETS_DIR = join(__dirname, 'templates', 'presets');
const TEMPLATE_PATH = join(__dirname, 'templates', 'base.html');
const FONT_DIR = join(__dirname, 'assets', 'fonts');
const FONT_FILES = ['IBMPlexSans-Variable.woff2', 'IBMPlexMono-400.woff2', 'IBMPlexMono-600.woff2'];
const USER_PRESETS_DIR = join(homedir(), '.config', 'forgr', 'presets');

const MIN_NODE_VERSION = engines && engines.node ? engines.node.replace('>=', '') : '18.0.0';

const G = '\x1b[32m';
const R = '\x1b[31m';
const Y = '\x1b[33m';
const B = '\x1b[1m';
const D = '\x1b[2m';
const N = '\x1b[0m';

function reportResults(results) {
  let passed = 0;
  let warnings = 0;
  let errors = 0;

  for (const { status, label, detail: det, hint } of results) {
    if (status === 'pass') {
      console.log(`  ${G}OK${N}  ${label}${det ? `  ${D}${det}${N}` : ''}`);
      passed++;
    } else if (status === 'warn') {
      console.log(`  ${Y}WARN${N} ${label}${det ? `  ${D}${det}${N}` : ''}`);
      warnings++;
    } else {
      console.log(`  ${R}FAIL${N} ${label}`);
      if (hint) console.log(`       ${B}\u2192${N} ${hint}`);
      errors++;
    }
  }

  return { passed, warnings, errors };
}

async function checkChromium({ fix, verbose }) {
  const execPath = getHeadlessShellPath();
  const chromiumOk = execPath && existsSync(execPath);
  if (chromiumOk) {
    return { status: 'pass', label: 'Chromium binary found', detail: verbose ? execPath : undefined };
  }
  if (fix) {
    console.log(`  ${Y}WARN${N} Chromium binary not found — attempting download`);
    try {
      execSync(getChromiumInstallCmd(), {
        stdio: 'inherit',
        env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: BROWSERS_PATH },
      });
      return { status: 'pass', label: 'Chromium downloaded successfully' };
    } catch {
      return { status: 'fail', label: 'Failed to download Chromium', hint: 'Try running: npx playwright-core install chromium-headless-shell' };
    }
  }
  return { status: 'fail', label: 'Chromium binary not found', hint: 'Run: forgr uninstall && forgr convert <file> to re-download' };
}

function checkPresets({ verbose }) {
  const presetResults = BUILTIN_PRESETS.map(p => {
    const cssPath = join(PRESETS_DIR, `${p.name}.css`);
    return { name: p.name, path: cssPath, exists: existsSync(cssPath) };
  });
  const missingPresets = presetResults.filter(r => !r.exists);
  if (missingPresets.length === 0) {
    const det = verbose ? presetResults.map(r => r.name).join(', ') : `${presetResults.length}/${BUILTIN_PRESETS.length} files`;
    return { status: 'pass', label: 'Preset CSS files', detail: det };
  }
  return { status: 'fail', label: 'Preset CSS files missing', hint: missingPresets.map(r => r.name).join(', ') + ' — reinstall package: npm install -g forgr' };
}

function checkUserPresets({ fix, verbose }) {
  let malformedFiles = [];
  let cssTargetsMissing = [];
  if (!existsSync(USER_PRESETS_DIR)) {
    return { status: 'pass', label: 'User presets', detail: 'none found' };
  }
  const files = readdirSync(USER_PRESETS_DIR).filter(f => f.endsWith('.json'));
  if (files.length === 0) {
    return { status: 'pass', label: 'User presets', detail: 'none found' };
  }
  for (const file of files) {
    const fullPath = join(USER_PRESETS_DIR, file);
    try {
      const parsed = JSON.parse(readFileSync(fullPath, 'utf8'));
      if (typeof parsed.name !== 'string' || typeof parsed.description !== 'string') {
        malformedFiles.push(fullPath);
      } else if (typeof parsed.css_file === 'string' && parsed.css_file.length > 0) {
        const cssTarget = join(USER_PRESETS_DIR, parsed.css_file);
        if (!existsSync(cssTarget)) {
          cssTargetsMissing.push({ preset: parsed.name, file: parsed.css_file, path: cssTarget });
        }
      }
    } catch {
      malformedFiles.push(fullPath);
    }
  }
  const valid = files.length - malformedFiles.length;
  if (malformedFiles.length === 0 && cssTargetsMissing.length === 0) {
    return { status: 'pass', label: 'User presets valid', detail: `${files.length} file${files.length !== 1 ? 's' : ''}` };
  }
  const out = { status: 'warn', label: 'User presets', detail: `${valid} valid, ${malformedFiles.length} malformed` };
  if (malformedFiles.length > 0) {
    out._malformed = malformedFiles;
    if (verbose) out._detailLines = (out._detailLines || []).concat(malformedFiles);
    if (fix) {
      console.log('');
      for (const mf of malformedFiles) {
        try {
          rmSync(mf);
          console.log(`  ${G}OK${N}  Removed: ${mf}`);
        } catch (err) {
          console.log(`  ${R}FAIL${N} Could not remove: ${mf}`);
          console.log(`       ${B}\u2192${N} ${err.message}`);
        }
      }
    }
  }
  if (cssTargetsMissing.length > 0) {
    out._cssMissing = cssTargetsMissing;
  }
  return out;
}

function checkFonts({ verbose }) {
  const fontResults = FONT_FILES.map(name => {
    const fontPath = join(FONT_DIR, name);
    let extra = '';
    if (verbose && existsSync(fontPath)) {
      const st = statSync(fontPath);
      extra = `${(st.size / 1024).toFixed(1)}KB`;
    }
    return { name, path: fontPath, exists: existsSync(fontPath), extra };
  });
  const missingFonts = fontResults.filter(r => !r.exists);
  if (missingFonts.length === 0) {
    const det = verbose ? fontResults.map(r => `${r.name} (${r.extra})`).join(', ') : `${fontResults.length}/${FONT_FILES.length} files`;
    return { status: 'pass', label: 'Font files found', detail: det };
  }
  return { status: 'fail', label: 'Font files missing', hint: missingFonts.map(r => r.name).join(', ') + ' — reinstall package: npm install -g forgr' };
}

function checkTemplate({ verbose }) {
  const templateOk = existsSync(TEMPLATE_PATH);
  if (templateOk) {
    let det;
    if (verbose) {
      const st = statSync(TEMPLATE_PATH);
      det = `${(st.size / 1024).toFixed(1)}KB`;
    }
    return { status: 'pass', label: 'Template found', detail: verbose ? `${TEMPLATE_PATH} (${det})` : 'base.html' };
  }
  return { status: 'fail', label: 'Template file missing (base.html)', hint: 'Reinstall package: npm install -g forgr' };
}

function checkNodeVersion() {
  const current = process.versions.node;
  const currentParts = current.split('.').map(Number);
  const minParts = MIN_NODE_VERSION.split('.').map(Number);
  const nodeOk = currentParts[0] >= minParts[0] &&
    (currentParts[0] > minParts[0] || currentParts[1] >= minParts[1]);
  if (nodeOk) {
    return { status: 'pass', label: 'Node version', detail: `v${current} \u2265 v${MIN_NODE_VERSION}` };
  }
  return { status: 'warn', label: 'Node version', detail: `v${current} (expected v${MIN_NODE_VERSION}+)` };
}

export async function runDoctor({ fix, verbose } = {}) {
  console.log(`  ${B}forgr doctor${N}  (v${PACKAGE_VERSION})`);
  console.log('');

  const checks = [
    () => checkChromium({ fix, verbose }),
    () => checkPresets({ verbose }),
    () => checkUserPresets({ fix, verbose }),
    () => checkFonts({ verbose }),
    () => checkTemplate({ verbose }),
    checkNodeVersion,
  ];

  const results = [];
  for (const check of checks) {
    const result = await check();
    results.push(result);
  }

  console.log('');
  const { passed, warnings, errors } = reportResults(results);
  const total = passed + warnings + errors;
  const summary = `${passed} passed`;
  const warnStr = `${warnings} warning${warnings !== 1 ? 's' : ''}`;
  const errStr = `${errors} error${errors !== 1 ? 's' : ''}`;
  console.log(`  ${summary}, ${warnStr}, ${errStr}`);
  console.log('');

  return errors > 0 ? 1 : 0;
}
