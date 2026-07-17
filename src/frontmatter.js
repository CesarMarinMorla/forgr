import matter from 'gray-matter';
import { DEFAULTS } from './config.js';

const FORGR_ONLY_KEYS = [
  'tocTitle', 'docMeta', 'dateFormat', 'dateLocale',
  'cover', 'coverTitle', 'coverAuthor', 'coverDate',
  'footer', 'sectionNumbering', 'paperFormat', 'margins',
];

function normalizeTocFromYaml(val) {
  if (val === true || val === 'on' || val === 'yes') return 'on';
  if (val === false || val === 'off' || val === 'no') return 'off';
  return 'auto';
}

function pickForgr(data, key) {
  const f = data.forgr || {};
  if (f[key] !== undefined) return { value: f[key], source: 'forgr' };
  if (data[key] !== undefined) return { value: data[key], source: 'shared' };
  return { value: undefined, source: null };
}

export function parseFrontMatter(source) {
  const { data, content, isEmpty } = matter(source);
  const frontMatter = {};
  if (!isEmpty) {
    const f = data.forgr || {};

    // preset: forgr > top-level > layout
    {
      const { value } = pickForgr(data, 'preset');
      if (value) frontMatter.preset = String(value);
      else if (data.layout) frontMatter.preset = String(data.layout);
    }

    // toc: forgr > top-level
    {
      const { value } = pickForgr(data, 'toc');
      if (value !== undefined) frontMatter.toc = normalizeTocFromYaml(value);
    }

    // title, date, author (shared keys with forgr override)
    for (const key of ['title', 'date', 'author']) {
      const { value } = pickForgr(data, key);
      if (value !== undefined) {
        frontMatter[key] = value instanceof Date ? value.toISOString().slice(0, 10) : String(value);
      }
    }

    // forgr-only keys
    FORGR_ONLY_KEYS.forEach((key) => {
      if (f[key] !== undefined) {
        const def = DEFAULTS[key];
        frontMatter[key] = typeof def === 'boolean' ? Boolean(f[key]) : f[key];
      }
    });
  }
  return { frontMatter, rawData: data, body: content };
}

export function writeForgrFrontMatter(body, existingData, writeKeys) {
  const data = { ...existingData };
  const f = { ...(data.forgr || {}) };

  for (const [key, value] of Object.entries(writeKeys)) {
    if (value !== undefined && value !== null) {
      if (value !== DEFAULTS[key]) {
        f[key] = typeof value === 'object' ? { ...value } : value;
      } else {
        delete f[key];
      }
    }
  }

  if (Object.keys(f).length === 0) {
    delete data.forgr;
  } else {
    data.forgr = f;
  }

  return matter.stringify(body, data);
}
