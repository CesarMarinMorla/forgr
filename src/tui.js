import React, { useState } from 'react';
import { render, Box, Text, useInput } from 'ink';
import { PRESET_COLORS } from './presets.js';
import { formatElapsed, formatFileSize } from './utils.js';

const TUI_ACCENT = '#2DD4BF';

function Swatch({ color }) {
  return React.createElement(Text, { color }, ' \u2588\u2588');
}

function PresetPicker({ presets, onSelect }) {
  const [index, setIndex] = useState(0);

  useInput((input, key) => {
    if (key.upArrow) {
      setIndex((i) => (i + presets.length - 1) % presets.length);
    } else if (key.downArrow) {
      setIndex((i) => (i + 1) % presets.length);
    } else if (key.return) {
      onSelect(presets[index]);
    } else if (input === 'q' || key.escape) {
      onSelect(null);
    }
  });

  const rows = presets.map((p, i) => {
    const isSelected = i === index;
    const color = PRESET_COLORS[p.name] || '#888888';
    const marker = isSelected
      ? React.createElement(Text, { color: TUI_ACCENT }, '\u276F ')
      : React.createElement(Text, null, '  ');
    const swatch = React.createElement(Swatch, { color });
    const nameNode = React.createElement(
      Text,
      { color: isSelected ? TUI_ACCENT : undefined, bold: isSelected },
      ` ${p.name}`
    );
    const tag = p.source === 'user'
      ? React.createElement(Text, { dimColor: true }, ' (user)')
      : null;
    const descNode = isSelected
      ? React.createElement(Text, { dimColor: true, wrap: 'truncate' }, `  ${p.description}`)
      : null;
    return React.createElement(
      Box,
      { key: p.name, flexDirection: 'row', alignItems: 'center', gap: 1 },
      marker,
      swatch,
      nameNode,
      tag,
      descNode
    );
  });

  const title = React.createElement(
    Text,
    { color: TUI_ACCENT, bold: true },
    'forgr \u2014 choose a preset'
  );

  const help = React.createElement(
    Text,
    { dimColor: true },
    '\u2191/\u2193 navigate \u00B7 enter select \u00B7 q quit'
  );

  return React.createElement(
    Box,
    { flexDirection: 'column', paddingX: 1 },
    React.createElement(Box, { marginBottom: 1 }, title),
    React.createElement(Box, { flexDirection: 'column' }, ...rows),
    React.createElement(Box, { marginTop: 1 }, help)
  );
}

function ResultScreen({ outputPath, pageCount, preset, elapsed, fileSize }) {
  useInput((input, key) => {
    if (input === 'q' || key.escape) {
      process.exit(0);
    }
  });

  const fileSizeStr = fileSize ? formatFileSize(fileSize) : '';
  const elapsedStr = elapsed ? formatElapsed(elapsed) : '';
  const details = [pageCount ? `${pageCount} pages` : null, fileSizeStr, preset, elapsedStr]
    .filter(Boolean)
    .join(' \u00B7 ');

  const header = React.createElement(
    Box,
    { marginBottom: 1 },
    React.createElement(Text, { color: 'green' }, '\u2713'),
    React.createElement(Text, { bold: true }, ' PDF rendered')
  );

  const info = React.createElement(
    Box,
    { flexDirection: 'column', marginLeft: 2 },
    React.createElement(Text, null, outputPath),
    React.createElement(Text, { dimColor: true }, details)
  );

  const footer = React.createElement(
    Box,
    { marginTop: 1 },
    React.createElement(Text, { dimColor: true }, 'Press q to quit')
  );

  return React.createElement(
    Box,
    { flexDirection: 'column', paddingX: 1 },
    header,
    info,
    footer
  );
}

export function launchTui(presets) {
  if (!process.stdin.isTTY) {
    return Promise.reject(new Error('interactive mode requires a terminal (stdin is not a TTY)'));
  }

  return new Promise((resolve) => {
    const { unmount } = render(
      React.createElement(PresetPicker, {
        presets,
        onSelect: (preset) => {
          unmount();
          resolve(preset);
        },
      })
    );
  });
}

export function showResultScreen(result) {
  render(React.createElement(ResultScreen, result));
}

export function classifyPreset(preset) {
  if (!preset) return { action: 'abort' };
  if (preset.source === 'user') return { action: 'unsupported-user', name: preset.name };
  return { action: 'render', name: preset.name };
}
