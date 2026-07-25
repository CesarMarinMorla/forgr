import React, { useState, useEffect, useRef } from 'react';
import { render, Box, Text, useInput } from 'ink';
import { stat } from 'fs/promises';
import { PRESET_COLORS } from './presets.js';
import { formatElapsed, formatFileSize } from './utils.js';
import { run } from './pipeline.js';

const TUI_ACCENT = '#2DD4BF';
const SPINNER_CHARS = '\u280B\u2839\u2879\u2878\u283C\u2834\u2826\u2827\u2807\u280F';

function Swatch({ color }) {
  return React.createElement(Text, { color }, ' \u2588\u2588');
}

function PresetPicker({ presets, notification, onSelect }) {
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

  const notif = notification
    ? React.createElement(
        Box,
        { marginTop: 1 },
        React.createElement(Text, { color: '#C85A48' }, '\u26A0'),
        React.createElement(Text, { dimColor: true }, ` ${notification}`)
      )
    : null;

  return React.createElement(
    Box,
    { flexDirection: 'column', paddingX: 1 },
    React.createElement(Box, { marginBottom: 1 }, title),
    React.createElement(Box, { flexDirection: 'column' }, ...rows),
    notif,
    React.createElement(Box, { marginTop: 1 }, help)
  );
}

function RenderingScreen({ preset, progress }) {
  const [frame, setFrame] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setFrame((f) => (f + 1) % SPINNER_CHARS.length);
    }, 80);
    return () => clearInterval(intervalRef.current);
  }, []);

  const spinner = React.createElement(
    Text,
    { color: TUI_ACCENT },
    SPINNER_CHARS[frame]
  );

  const label = React.createElement(
    Text,
    { bold: true },
    ` Rendering with ${preset}...`
  );

  const prog = React.createElement(
    Box,
    { marginLeft: 3 },
    React.createElement(Text, { dimColor: true }, progress)
  );

  return React.createElement(
    Box,
    { flexDirection: 'column', paddingX: 1 },
    React.createElement(Box, null, spinner, label),
    prog
  );
}

function ResultScreen({ result, error, isError, onBack, onQuit }) {
  useInput((input, key) => {
    if (key.return) {
      onBack();
    } else if (input === 'q' || key.escape) {
      onQuit();
    }
  });

  if (isError) {
    const errBox = React.createElement(
      Box,
      { marginBottom: 1 },
      React.createElement(Text, { color: 'red' }, '\u2717'),
      React.createElement(Text, { bold: true }, ' Render failed')
    );

    const errMsg = React.createElement(
      Box,
      { marginLeft: 2 },
      React.createElement(Text, { dimColor: true }, error)
    );

    const footer = React.createElement(
      Box,
      { marginTop: 1 },
      React.createElement(Text, { dimColor: true }, 'Enter try again \u00B7 q quit')
    );

    return React.createElement(
      Box,
      { flexDirection: 'column', paddingX: 1 },
      errBox,
      errMsg,
      footer
    );
  }

  const fileSizeStr = result?.fileSize ? formatFileSize(result.fileSize) : '';
  const elapsedStr = result?.elapsed != null ? formatElapsed(result.elapsed) : '';
  const details = [
    result?.pageCount ? `${result.pageCount} pages` : null,
    fileSizeStr,
    result?.preset,
    elapsedStr,
  ].filter(Boolean).join(' \u00B7 ');

  const header = React.createElement(
    Box,
    { marginBottom: 1 },
    React.createElement(Text, { color: 'green' }, '\u2713'),
    React.createElement(Text, { bold: true }, ' PDF rendered')
  );

  const info = React.createElement(
    Box,
    { flexDirection: 'column', marginLeft: 2 },
    React.createElement(Text, null, result?.outputPath || ''),
    React.createElement(Text, { dimColor: true }, details)
  );

  const footer = React.createElement(
    Box,
    { marginTop: 1 },
    React.createElement(Text, { dimColor: true }, 'Enter render again \u00B7 q quit')
  );

  return React.createElement(
    Box,
    { flexDirection: 'column', paddingX: 1 },
    header,
    info,
    footer
  );
}

function TuiApp({ presets, inputPath, options }) {
  const [screen, setScreen] = useState('picker');
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState('');
  const [notification, setNotification] = useState('');
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (screen !== 'rendering' || !selectedPreset) return;
    let cancelled = false;

    (async () => {
      try {
        const cliOptions = { ...options, preset: selectedPreset };
        const res = await run(inputPath, cliOptions, {
          onProgress: (stage) => {
            if (!cancelled) setProgress(stage);
          },
        });

        if (cancelled) return;
        const elapsed = Date.now() - startTimeRef.current;
        let fileSize;
        try {
          fileSize = (await stat(res.outputPath)).size;
        } catch {}

        setResult({ ...res, elapsed, fileSize });
        setScreen('result');
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setScreen('result');
        }
      }
    })();

    return () => { cancelled = true; };
  }, [screen, selectedPreset, inputPath, options]);

  switch (screen) {
    case 'rendering':
      return React.createElement(RenderingScreen, { preset: selectedPreset, progress });
    case 'result':
      return React.createElement(ResultScreen, {
        result,
        error,
        isError: !!error,
        onBack: () => {
          setError(null);
          setResult(null);
          setProgress('');
          setScreen('picker');
        },
        onQuit: () => process.exit(0),
      });
    default:
      return React.createElement(PresetPicker, {
        presets,
        notification,
        onSelect: (preset) => {
          if (!preset) { process.exit(0); return; }
          if (preset.source === 'user') {
            setNotification('User presets not yet supported. Pick a built-in preset.');
            return;
          }
          setNotification('');
          setSelectedPreset(preset.name);
          startTimeRef.current = Date.now();
          setProgress('Reading file...');
          setScreen('rendering');
        },
      });
  }
}

export function launchTui(presets, inputPath, options = {}) {
  if (!process.stdin.isTTY) {
    return Promise.reject(new Error('interactive mode requires a terminal (stdin is not a TTY)'));
  }

  const { waitUntilExit } = render(
    React.createElement(TuiApp, { presets, inputPath, options })
  );
  return waitUntilExit;
}

export function classifyPreset(preset) {
  if (!preset) return { action: 'abort' };
  if (preset.source === 'user') return { action: 'unsupported-user', name: preset.name };
  return { action: 'render', name: preset.name };
}
