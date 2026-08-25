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

    const cssFile = typeof parsed.css_file === 'string' && parsed.css_file.length > 0
      ? parsed.css_file
      : undefined;

    presets.push({
      name: parsed.name,
      description: parsed.description,
      source: 'user',
      css_file: cssFile,
      cssPath: cssFile ? join(dir, cssFile) : undefined,
    });
  }

  return presets;
}

export function findUserPreset(name, dir = USER_PRESETS_DIR) {
  return scanUserPresets(dir).find((p) => p.name === name);
}

export const PRESET_COLORS = {
  terminal: '#2DD4BF',
  minimal: '#888888',
  technical: '#C2410C',
  academic: '#3D6B55',
  newsletter: '#C85A48',
};

export const PRESET_PALETTES = {
  terminal: ['#1C2128', '#6E7683', '#2DD4BF', '#0F766E', '#12161C'],
  minimal: ['#1A1A1A', '#666666', '#888888', '#CCCCCC', '#F5F5F5'],
  technical: ['#1C1917', '#78716C', '#C2410C', '#EA580C', '#1C1917'],
  academic: ['#1B4A36', '#5A7A68', '#3D6B55', '#2D5040', '#0F291D'],
  newsletter: ['#2D2A24', '#8A8070', '#C85A48', '#A04030', '#FAF8F5'],
};

export function listPresets(dir = USER_PRESETS_DIR) {
  return [...BUILTIN_PRESETS, ...scanUserPresets(dir)];
}
