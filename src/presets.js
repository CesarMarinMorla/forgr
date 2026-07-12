import { homedir } from 'os';
import { join } from 'path';
import { existsSync, readdirSync, readFileSync } from 'fs';

export const USER_PRESETS_DIR = join(homedir(), '.config', 'forgr', 'presets');

export const BUILTIN_PRESETS = [
  {
    name: 'terminal',
    description: 'Default terminal look: all-mono headings, graphite/teal palette, terminal code panes',
    source: 'builtin',
  },
  {
    name: 'minimal',
    description: 'Plain black-on-white, hairline rules, no accent',
    source: 'builtin',
  },
  {
    name: 'technical',
    description: 'Dense monospace ops/infra style with amber accent and full-grid tables',
    source: 'builtin',
  },
  {
    name: 'academic',
    description: 'Typeset-journal serif with marginal counters and restrained typography',
    source: 'builtin',
  },
  {
    name: 'newsletter',
    description: 'Warm editorial off-white with coral accents and pull-quotes',
    source: 'builtin',
  },
];

export function scanUserPresets(dir = USER_PRESETS_DIR) {
  if (!existsSync(dir)) return [];

  const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
  const presets = [];

  for (const file of files) {
    const fullPath = join(dir, file);
    let parsed;
    try {
      parsed = JSON.parse(readFileSync(fullPath, 'utf8'));
    } catch (err) {
      console.warn(`Warning: skipping user preset "${file}": invalid JSON (${err.message})`);
      continue;
    }

    if (typeof parsed.name !== 'string' || typeof parsed.description !== 'string') {
      console.warn(`Warning: skipping user preset "${file}": requires "name" and "description" strings`);
      continue;
    }

    presets.push({ name: parsed.name, description: parsed.description, source: 'user' });
  }

  return presets;
}

export function listPresets(dir = USER_PRESETS_DIR) {
  return [...BUILTIN_PRESETS, ...scanUserPresets(dir)];
}
