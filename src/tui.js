import React from 'react';
import { useState } from 'react';
import { render, Box, Text, useInput } from 'ink';

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
    const marker = i === index ? '> ' : '  ';
    const tag = p.source === 'user' ? ' (user)' : '';
    const nameNode = React.createElement(
      Text,
      { key: 'name', color: i === index ? 'cyan' : undefined, bold: i === index },
      `${marker}${p.name}${tag}`
    );
    const descNode = i === index
      ? React.createElement(Text, { key: 'desc', dimColor: true }, `  ${p.description}`)
      : null;
    return React.createElement(Box, { key: p.name, flexDirection: 'row' }, nameNode, descNode);
  });

  return React.createElement(
    Box,
    { flexDirection: 'column' },
    React.createElement(
      Box,
      { marginBottom: 1 },
      React.createElement(Text, { bold: true }, 'forgr — choose a preset')
    ),
    React.createElement(Box, { flexDirection: 'column' }, ...rows),
    React.createElement(
      Box,
      { marginTop: 1 },
      React.createElement(Text, { dimColor: true }, '↑/↓ navigate · enter select · q quit')
    )
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

export function classifyPreset(preset) {
  if (!preset) return { action: 'abort' };
  if (preset.source === 'user') return { action: 'unsupported-user', name: preset.name };
  return { action: 'render', name: preset.name };
}
