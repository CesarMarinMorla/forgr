import { existsSync, readFileSync, readdirSync, statSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { createRequire } from 'module';
import { homedir } from 'os';
import { BROWSERS_PATH } from './browsers-path.js';
import { getHeadlessShellPath } from './pdf.js';
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

function sep() {
  console.log('');
}

function ok(line, detail) {
  console.log(`  ${G}OK${N}  ${line}${detail ? `  ${D}${detail}${N}` : ''}`);
}

function fail(line, hint) {
  console.log(`  ${R}FAIL${N} ${line}`);
  if (hint) console.log(`       ${B}→${N} ${hint}`);
}

function warn(line, detail) {
  console.log(`  ${Y}WARN${N} ${line}${detail ? `  ${D}${detail}${N}` : ''}`);
}

function detail(line) {
  console.log(`       ${D}${line}${N}`);
}

export async function runDoctor({ fix, verbose } = {}) {
  let passed = 0;
  let warnings = 0;
  let errors = 0;

  function record(status) {
    if (status === 'pass') passed++;
    else if (status === 'warn') warnings++;
    else errors++;
  }

  console.log(`  ${B}forgr doctor${N}  (v${PACKAGE_VERSION})`);
  sep();

  // 1. Chromium
  const execPath = getHeadlessShellPath();
  const chromiumOk = execPath && existsSync(execPath);
  if (chromiumOk) {
    ok('Chromium binary found', verbose ? execPath : undefined);
    record('pass');
  } else if (fix) {
    warn('Chromium binary not found — attempting download');
    try {
      execSync('npx playwright-core install chromium-headless-shell', {
        stdio: 'inherit',
        env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: BROWSERS_PATH },
      });
      ok('Chromium downloaded successfully');
      record('pass');
    } catch {
      fail('Failed to download Chromium', 'Try running: npx playwright-core install chromium-headless-shell');
      record('fail');
    }
  } else {
    fail('Chromium binary not found', 'Run: forgr uninstall && forgr convert <file> to re-download');
    record('fail');
  }

  // 2. Built-in preset CSS
  const presetResults = BUILTIN_PRESETS.map(p => {
    const cssPath = join(PRESETS_DIR, `${p.name}.css`);
    return { name: p.name, path: cssPath, exists: existsSync(cssPath) };
  });
  const missingPresets = presetResults.filter(r => !r.exists);
  if (missingPresets.length === 0) {
    const all = verbose ? presetResults.map(r => r.name).join(', ') : `${presetResults.length}/${BUILTIN_PRESETS.length} files`;
    ok('Preset CSS files', all);
    record('pass');
  } else {
    fail('Preset CSS files missing', missingPresets.map(r => r.name).join(', ') + ' — reinstall package: npm install -g forgr');
    record('fail');
  }

  // 3. User preset files
  let malformedFiles = [];
  let cssTargetsMissing = [];
  if (existsSync(USER_PRESETS_DIR)) {
    const files = readdirSync(USER_PRESETS_DIR).filter(f => f.endsWith('.json'));
    if (files.length > 0) {
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
        ok('User presets valid', `${files.length} file${files.length !== 1 ? 's' : ''}`);
        record('pass');
      } else {
        if (malformedFiles.length > 0) {
          warn('User presets', `${valid} valid, ${malformedFiles.length} malformed`);
          if (verbose) malformedFiles.forEach(f => detail(f));
          if (fix) {
            sep();
            for (const mf of malformedFiles) {
              try {
                rmSync(mf);
                ok(`Removed: ${mf}`);
              } catch (err) {
                fail(`Could not remove: ${mf}`, err.message);
              }
            }
          }
        }
        if (cssTargetsMissing.length > 0) {
          warn('User preset CSS targets', `${cssTargetsMissing.length} missing`);
          for (const c of cssTargetsMissing) {
            const msg = verbose ? c.path : `${c.file} (referenced by "${c.preset}")`;
            detail(msg);
          }
        }
        record('warn');
      }
    } else {
      ok('User presets', 'none found');
      record('pass');
    }
  } else {
    ok('User presets', 'none found');
    record('pass');
  }

  // 4. Font files
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
    const all = verbose ? fontResults.map(r => `${r.name} (${r.extra})`).join(', ') : `${fontResults.length}/${FONT_FILES.length} files`;
    ok('Font files found', all);
    record('pass');
  } else {
    fail('Font files missing', missingFonts.map(r => r.name).join(', ') + ' — reinstall package: npm install -g forgr');
    record('fail');
  }

  // 5. Template file
  const templateOk = existsSync(TEMPLATE_PATH);
  if (templateOk) {
    let extra = '';
    if (verbose) {
      const st = statSync(TEMPLATE_PATH);
      extra = `${(st.size / 1024).toFixed(1)}KB`;
    }
    ok('Template found', verbose ? `${TEMPLATE_PATH} (${extra})` : 'base.html');
    record('pass');
  } else {
    fail('Template file missing (base.html)', 'Reinstall package: npm install -g forgr');
    record('fail');
  }

  // 6. Node version
  const current = process.versions.node;
  const currentParts = current.split('.').map(Number);
  const minParts = MIN_NODE_VERSION.split('.').map(Number);
  const nodeOk = currentParts[0] >= minParts[0] &&
    (currentParts[0] > minParts[0] || currentParts[1] >= minParts[1]);
  if (nodeOk) {
    ok('Node version', `v${current} \u2265 v${MIN_NODE_VERSION}`);
    record('pass');
  } else {
    warn('Node version', `v${current} (expected v${MIN_NODE_VERSION}+)`);
    record('warn');
  }

  sep();

  const total = passed + warnings + errors;
  const summary = `${passed} passed`;
  const warnStr = `${warnings} warning${warnings !== 1 ? 's' : ''}`;
  const errStr = `${errors} error${errors !== 1 ? 's' : ''}`;
  console.log(`  ${summary}, ${warnStr}, ${errStr}`);
  sep();

  return errors > 0 ? 1 : 0;
}
