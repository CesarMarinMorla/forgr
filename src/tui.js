import React, { useState, useEffect, useRef } from 'react';
import { render, Box, Text, useInput } from 'ink';
import { existsSync, readdirSync, statSync } from 'fs';
import { execFile } from 'child_process';
import { stat, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { PRESET_COLORS } from './presets.js';
import { formatElapsed, formatFileSize } from './utils.js';
import { DEFAULTS } from './config.js';
import { parseFrontMatter, writeForgrFrontMatter } from './frontmatter.js';
import { run } from './pipeline.js';

const TUI_ACCENT = '#2DD4BF';
const TUI_TEXT_ACCENT = '#EAB308';
const SPINNER_CHARS = '\u280B\u2839\u2879\u2878\u283C\u2834\u2826\u2827\u2807\u280F';

function getMarkdownFiles(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  return entries
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(dir, f))
    .filter(f => statSync(f).isFile())
    .sort((a, b) => path.basename(a).localeCompare(path.basename(b)));
}

const SETTINGS = [
  { key: 'toc', label: 'Table of contents', values: ['auto', true, false], display: v => v === true ? 'on' : v === false ? 'off' : 'auto' },
  { key: 'docMeta', label: 'Doc-meta header', values: [true, false], display: v => v ? 'yes' : 'no' },
  { key: 'dateFormat', label: 'Date format', values: ['iso', 'locale'] },
  { key: 'footer', label: 'Footer', values: ['page-numbers', 'page-x-of-y', 'none'] },
  { key: 'cover', label: 'Cover page', values: [false, true], display: v => v ? 'yes' : 'no' },
  { key: 'coverDate', label: 'Cover date', values: ['auto', 'custom', 'none'] },
  { key: 'sectionNumbering', label: 'Section numbering', values: [false, true], display: v => v ? 'yes' : 'no' },
  { key: 'orientation', label: 'Orientation', values: ['portrait', 'landscape'] },
];

function Swatch({ color }) {
  return React.createElement(Text, { color }, ' \u2588\u2588');
}

function FilePicker({ files, onSelect, onQuit }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(new Set());

  useInput((input, key) => {
    if (key.upArrow) {
      setIndex(i => (i + files.length - 1) % files.length);
    } else if (key.downArrow) {
      setIndex(i => (i + 1) % files.length);
    } else if (input === ' ') {
      setSelected(prev => {
        const next = new Set(prev);
        if (next.has(index)) next.delete(index);
        else next.add(index);
        return next;
      });
    } else if (key.return) {
      if (selected.size === 0) return;
      const chosen = Array.from(selected).sort().map(i => files[i]);
      onSelect(chosen);
    } else if (input === 'q' || key.escape) {
      onQuit();
    }
  });

  const title = React.createElement(
    Text,
    { color: TUI_ACCENT, bold: true },
    'forgr \u2014 select files'
  );

  const hint = selected.size > 0
    ? React.createElement(Text, { dimColor: true }, `  ${selected.size} of ${files.length} selected`)
    : null;

  const rows = files.map((f, i) => {
    const isFocused = i === index;
    const isSelected = selected.has(i);
    const marker = isFocused
      ? React.createElement(Text, { color: TUI_ACCENT }, '\u276F ')
      : React.createElement(Text, null, '  ');
    const check = isSelected
      ? React.createElement(Text, { color: TUI_ACCENT }, '\u2713')
      : React.createElement(Text, null, ' ');
    const name = React.createElement(
      Text,
      { color: isFocused ? TUI_ACCENT : undefined },
      ` ${path.basename(f)}`
    );
    return React.createElement(
      Box,
      { key: f },
      marker,
      check,
      name
    );
  });

  const help = React.createElement(
    Box,
    null,
    React.createElement(Text, { color: TUI_ACCENT }, '\u2191/\u2193'),
    React.createElement(Text, { dimColor: true }, ' navigate \u00B7 '),
    React.createElement(Text, { color: TUI_ACCENT }, 'space'),
    React.createElement(Text, { dimColor: true }, ' toggle \u00B7 '),
    React.createElement(Text, { color: TUI_ACCENT }, 'enter'),
    React.createElement(Text, { dimColor: true }, ' confirm \u00B7 '),
    React.createElement(Text, { color: TUI_ACCENT }, 'q'),
    React.createElement(Text, { dimColor: true }, ' quit')
  );

  return React.createElement(
    Box,
    { flexDirection: 'column', paddingX: 1, width: '100%' },
    React.createElement(Box, { marginBottom: 1 }, title),
    React.createElement(Box, { marginBottom: 1 }, hint),
    React.createElement(Box, { flexDirection: 'column' }, ...rows),
    React.createElement(Box, { marginTop: 1 }, help)
  );
}

function PresetPicker({ presets, onSelect, fileLabel }) {
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
      ? React.createElement(Text, { dimColor: true }, `       ${p.description}`)
      : null;
    return React.createElement(
      Box,
      { key: p.name, flexDirection: 'column' },
      React.createElement(
        Box,
        { flexDirection: 'row', alignItems: 'center', gap: 1 },
        marker,
        swatch,
        nameNode,
        tag
      ),
      descNode
    );
  });

  const title = React.createElement(
    Text,
    { color: TUI_ACCENT, bold: true },
    'forgr \u2014 choose a preset'
  );

  const help = React.createElement(
    Box,
    null,
    React.createElement(Text, { color: TUI_ACCENT }, '\u2191/\u2193'),
    React.createElement(Text, { dimColor: true }, ' navigate \u00B7 '),
    React.createElement(Text, { color: TUI_ACCENT }, 'enter'),
    React.createElement(Text, { dimColor: true }, ' select \u00B7 '),
    React.createElement(Text, { color: TUI_ACCENT }, 'q'),
    React.createElement(Text, { dimColor: true }, ' quit')
  );

  return React.createElement(
    Box,
    { flexDirection: 'column', paddingX: 1, width: '100%' },
    React.createElement(Box, { marginBottom: 1 }, title),
    fileLabel ? React.createElement(Box, { marginBottom: 1 }, React.createElement(Text, { dimColor: true }, `  ${fileLabel}`)) : null,
    React.createElement(Box, { flexDirection: 'column' }, ...rows),
    React.createElement(Box, { marginTop: 1 }, help)
  );
}

const COVER_FIELDS = [
  { key: 'coverTitle', label: 'Cover title', type: 'text' },
  { key: 'coverAuthor', label: 'Cover author', type: 'text' },
  { key: 'coverDateText', label: 'Custom date', type: 'text' },
];

function SettingsScreen({ settings, onChange, preset, fileLabel, sourceNote, onRender, onBack }) {
  const [focus, setFocus] = useState(0);
  const [editingField, setEditingField] = useState(null);
  const [editBuffer, setEditBuffer] = useState('');

  const visibleCover = settings.cover && settings.coverDate === 'custom'
    ? [...COVER_FIELDS]
    : settings.cover ? COVER_FIELDS.slice(0, 2) : [];
  const allSettings = [...SETTINGS, ...visibleCover];

  useEffect(() => {
    setFocus(i => Math.min(i, allSettings.length - 1));
  }, [allSettings.length]);

  useInput((input, key) => {
    if (editingField) {
      if (key.return) {
        onChange(editingField, editBuffer);
        setEditingField(null);
        setEditBuffer('');
      } else if (key.escape) {
        setEditingField(null);
        setEditBuffer('');
      } else if (key.backspace || key.delete) {
        setEditBuffer(prev => prev.slice(0, -1));
      } else if (input && !key.ctrl && !key.meta && !key.escape) {
        setEditBuffer(prev => prev + input);
      }
      return;
    }

    if (key.upArrow) {
      setFocus(i => Math.max(0, i - 1));
    } else if (key.downArrow) {
      setFocus(i => Math.min(allSettings.length - 1, i + 1));
    } else if (key.leftArrow || key.rightArrow) {
      const def = allSettings[focus];
      if (def.type !== 'text') {
        const val = settings[def.key];
        const idx = def.values.indexOf(val);
        if (key.leftArrow && idx > 0) onChange(def.key, def.values[idx - 1]);
        else if (key.rightArrow && idx < def.values.length - 1) onChange(def.key, def.values[idx + 1]);
      }
    } else if (key.return) {
      onRender();
    } else if (input === 'e' && !editingField) {
      const def = allSettings[focus];
      if (def.type === 'text') {
        setEditingField(def.key);
        setEditBuffer(settings[def.key] || '');
      }
    } else if (input === 'q' || key.escape) {
      onBack();
    }
  });

  const title = React.createElement(
    Text,
    { color: TUI_ACCENT, bold: true },
    `forgr \u2014 settings (${preset})`
  );

  const fileCountLine = React.createElement(
    Box,
    null,
    React.createElement(Text, { dimColor: true }, '  '),
    React.createElement(Text, null, fileLabel)
  );

  const sourceLine = sourceNote
    ? React.createElement(Text, { dimColor: true }, `  ${sourceNote}`)
    : null;

  const rows = allSettings.map((def, i) => {
    const isFocused = i === focus;
    const isEditing = def.type === 'text' && def.key === editingField;
    const isText = def.type === 'text';
    const accent = isText ? TUI_TEXT_ACCENT : TUI_ACCENT;
    const val = isEditing ? editBuffer : settings[def.key];
    const marker = React.createElement(Text, { color: isFocused ? accent : undefined }, isFocused ? '\u276F ' : '  ');
    const label = React.createElement(Text, null, ` ${def.label}:`);

    let value;
    let hint;
    if (isText) {
      const display = isEditing ? `${val || ''}\u2588` : `[${val || '--'}]`;
      value = React.createElement(Text, { color: isEditing ? 'white' : accent }, ` ${display}`);
      hint = isFocused && !isEditing ? React.createElement(Text, { dimColor: true }, '  e edit') : null;
    } else {
      const displayVal = (def.display || String)(val);
      value = React.createElement(Text, { color: accent }, ` [${displayVal}]`);
      hint = isFocused ? React.createElement(Text, { dimColor: true }, '  \u25C0 \u25B6') : null;
    }

    return React.createElement(
      Box,
      { key: def.key },
      marker,
      label,
      value,
      hint
    );
  });

  const help = editingField
    ? React.createElement(
        Box,
        null,
        React.createElement(Text, { color: TUI_ACCENT }, '\u23CE'),
        React.createElement(Text, { dimColor: true }, ' confirm \u00B7 '),
        React.createElement(Text, { color: TUI_ACCENT }, 'Esc'),
        React.createElement(Text, { dimColor: true }, ' cancel \u00B7 '),
        React.createElement(Text, { color: TUI_ACCENT }, '\u232B'),
        React.createElement(Text, { dimColor: true }, ' delete')
      )
    : React.createElement(
        Box,
        null,
        React.createElement(Text, { color: TUI_ACCENT }, '\u2191/\u2193'),
        React.createElement(Text, { dimColor: true }, ' navigate \u00B7 '),
        React.createElement(Text, { color: TUI_ACCENT }, '\u2190/\u2192'),
        React.createElement(Text, { dimColor: true }, ' change \u00B7 '),
        React.createElement(Text, { color: TUI_ACCENT }, 'enter'),
        React.createElement(Text, { dimColor: true }, ' render \u00B7 '),
        React.createElement(Text, { color: TUI_TEXT_ACCENT }, 'e'),
        React.createElement(Text, { dimColor: true }, ' edit \u00B7 '),
        React.createElement(Text, { color: TUI_ACCENT }, 'q'),
        React.createElement(Text, { dimColor: true }, ' back')
      );

  return React.createElement(
    Box,
    { flexDirection: 'column', paddingX: 1, width: '100%' },
    React.createElement(Box, { marginBottom: 1 }, title),
    fileCountLine,
    sourceLine,
    React.createElement(Box, { marginTop: 1, flexDirection: 'column' }, ...rows),
    React.createElement(Box, { marginTop: 1 }, help)
  );
}

function RenderingScreen({ preset, selectedFiles, results, currentFileIndex, progress }) {
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

  const header = React.createElement(
    Box,
    null,
    spinner,
    React.createElement(Text, { bold: true }, ` Rendering with ${preset}...`)
  );

  const currentFile = currentFileIndex < selectedFiles.length
    ? React.createElement(
        Box,
        { marginLeft: 2 },
        React.createElement(Text, { dimColor: true }, `[${currentFileIndex + 1}/${selectedFiles.length}] ${path.basename(selectedFiles[currentFileIndex])}`)
      )
    : null;

  const prog = React.createElement(
    Box,
    { marginLeft: 4 },
    React.createElement(Text, { dimColor: true }, progress)
  );

  const doneLines = results.map((r, i) =>
    React.createElement(
      Box,
      { key: i, marginLeft: 2 },
      React.createElement(Text, { color: 'green' }, '\u2713'),
      React.createElement(Text, { dimColor: true }, ` ${path.basename(r.outputPath || r.filePath)}`),
      r.pageCount ? React.createElement(Text, { dimColor: true }, `  ${r.pageCount} pages`) : null
    )
  );

  return React.createElement(
    Box,
    { flexDirection: 'column', paddingX: 1, width: '100%' },
    header,
    currentFile,
    prog,
    ...doneLines
  );
}

function BatchResultScreen({ results, saveStatus, onSave, onBack, onQuit, onOpen }) {
  useInput((input, key) => {
    if (key.return) {
      onBack();
    } else if (input === 'q' || key.escape) {
      onQuit();
    } else if (input === 'o') {
      onOpen();
    } else if (input === 's' && !saveStatus) {
      onSave();
    }
  });

  const succeeded = results.filter(r => !r.error);
  const failed = results.filter(r => r.error);
  const totalElapsed = results.reduce((sum, r) => sum + (r.elapsed || 0), 0);

  const headerText = failed.length === 0
    ? `\u2713  Batch complete \u2014 ${results.length} files`
    : `\u2713  Batch complete \u2014 ${results.length} files (${failed.length} failed)`;
  const headerColor = failed.length === results.length ? 'red' : 'green';

  const header = React.createElement(
    Box,
    { marginBottom: 1 },
    React.createElement(Text, { color: headerColor, bold: true }, headerText)
  );

  const MAX_VISIBLE = 6;
  let visibleResults = results;
  let overflow = 0;
  if (results.length > MAX_VISIBLE) {
    visibleResults = [...results.slice(0, MAX_VISIBLE - 1), ...results.slice(-1)];
    overflow = results.length - MAX_VISIBLE;
  }

  const fileLines = visibleResults.map((r, i) => {
    const isError = !!r.error;
    const icon = isError ? '\u2717' : '\u2713';
    const iconColor = isError ? 'red' : 'green';
    const name = path.basename(r.outputPath || r.filePath);
    let detail = '';
    if (!isError && r.pageCount) {
      const parts = [`${r.pageCount} pages`];
      if (r.fileSize) parts.push(formatFileSize(r.fileSize));
      detail = `  ${parts.join(' \u00B7 ')}`;
    } else if (isError && r.error) {
      detail = `  ${r.error}`;
    }
    return React.createElement(
      Box,
      { key: i, marginLeft: 2 },
      React.createElement(Text, { color: iconColor }, icon),
      React.createElement(Text, { dimColor: isError ? 'red' : undefined }, ` ${name}${detail}`)
    );
  });

  const overflowLine = overflow > 0
    ? React.createElement(Box, { marginLeft: 2 },
        React.createElement(Text, { dimColor: true }, `  ... ${overflow} more`)
      )
    : null;

  const presetLine = succeeded.length > 0
    ? React.createElement(Box, { marginTop: 1 },
        React.createElement(Text, { dimColor: true }, `  ${succeeded[0].preset} \u00B7 ${formatElapsed(totalElapsed)}`)
      )
    : null;

  const saveMsg = saveStatus === 'saving'
    ? React.createElement(Text, { dimColor: true }, '  saving settings...')
    : saveStatus === 'saved'
    ? React.createElement(Text, { color: 'green' }, '  settings saved to front-matter')
    : saveStatus === 'error'
    ? React.createElement(Text, { color: 'red' }, '  failed to save settings')
    : null;

  const footer = React.createElement(
    Box,
    { marginTop: 1 },
    React.createElement(Text, { color: TUI_ACCENT }, 'Enter'),
    React.createElement(Text, { dimColor: true }, ' back \u00B7 '),
    React.createElement(Text, { color: TUI_ACCENT }, 's'),
    React.createElement(Text, { dimColor: true }, ' save \u00B7 '),
    React.createElement(Text, { color: TUI_ACCENT }, 'o'),
    React.createElement(Text, { dimColor: true }, ' open folder \u00B7 '),
    React.createElement(Text, { color: TUI_ACCENT }, 'q'),
    React.createElement(Text, { dimColor: true }, ' quit')
  );

  return React.createElement(
    Box,
    { flexDirection: 'column', paddingX: 1, width: '100%' },
    header,
    ...fileLines,
    overflowLine,
    presetLine,
    saveMsg,
    footer
  );
}

function defaultSettings() {
  return {
    toc: DEFAULTS.toc,
    docMeta: DEFAULTS.docMeta,
    dateFormat: DEFAULTS.dateFormat,
    footer: DEFAULTS.footer,
    cover: DEFAULTS.cover,
    coverTitle: DEFAULTS.coverTitle,
    coverAuthor: DEFAULTS.coverAuthor,
    coverDate: DEFAULTS.coverDate,
    coverDateText: DEFAULTS.coverDateText,
    sectionNumbering: DEFAULTS.sectionNumbering,
    orientation: DEFAULTS.orientation,
  };
}

const SETTINGS_KEYS = [...SETTINGS.map((d) => d.key), ...COVER_FIELDS.map((d) => d.key)];

export function settingsFromFrontMatter(frontMatter, fallback = defaultSettings()) {
  const out = { ...fallback };
  for (const key of SETTINGS_KEYS) {
    if (frontMatter[key] !== undefined) out[key] = frontMatter[key];
  }
  return out;
}

function TuiApp({ presets, inputFile }) {
  const [screen, setScreen] = useState(() => inputFile ? 'picker' : 'files');
  const [selectedFiles, setSelectedFiles] = useState(() => inputFile ? [path.resolve(inputFile)] : []);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [settings, setSettings] = useState(defaultSettings);
  const [settingsSource, setSettingsSource] = useState('');
  const [results, setResults] = useState([]);
  const [progress, setProgress] = useState('');
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [saveStatus, setSaveStatus] = useState(null);
  const startTimeRef = useRef(null);

  const mdFiles = React.useMemo(() => getMarkdownFiles(process.cwd()), []);

  const handleSave = async () => {
    setSaveStatus('saving');
    let ok = true;
    for (const filePath of selectedFiles) {
      try {
        const content = await readFile(filePath, 'utf8');
        const { rawData, body } = parseFrontMatter(content);
        const updated = writeForgrFrontMatter(body, rawData, settings);
        await writeFile(filePath, updated, 'utf8');
      } catch {
        ok = false;
      }
    }
    setSaveStatus(ok ? 'saved' : 'error');
  };

  useEffect(() => {
    if (selectedFiles.length === 0) return;
    const filePath = selectedFiles[0];
    let cancelled = false;

    (async () => {
      try {
        const content = await readFile(filePath, 'utf8');
        if (cancelled) return;
        const { frontMatter } = parseFrontMatter(content);
        setSettings(settingsFromFrontMatter(frontMatter));
        setSettingsSource(Object.keys(frontMatter).length > 0 ? path.basename(filePath) : '');
      } catch {
        if (!cancelled) setSettingsSource('');
      }
    })();

    return () => { cancelled = true; };
  }, [selectedFiles]);

  useEffect(() => {
    if (screen !== 'rendering' || !selectedPreset || selectedFiles.length === 0) return;
    let cancelled = false;

    (async () => {
      const cliOptions = { ...settings, preset: selectedPreset };
      const batchResults = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        if (cancelled) return;
        const filePath = selectedFiles[i];
        setCurrentFileIndex(i);
        try {
          const res = await run(filePath, cliOptions, {
            onProgress: (stage) => { if (!cancelled) setProgress(stage); },
          });
          if (cancelled) return;
          const elapsed = Date.now() - startTimeRef.current;
          let fileSize;
          try { fileSize = (await stat(res.outputPath)).size; } catch {}
          batchResults.push({ ...res, filePath, elapsed, fileSize, error: null });
        } catch (err) {
          batchResults.push({ filePath, error: err.message, outputPath: null, pageCount: null, preset: selectedPreset, elapsed: 0, fileSize: 0 });
        }
        setResults([...batchResults]);
      }

      if (!cancelled) {
        setScreen('result');
      }
    })();

    return () => { cancelled = true; };
  }, [screen, selectedPreset, settings, selectedFiles]);

  const fileLabel = selectedFiles.length === 1
    ? `File: ${path.basename(selectedFiles[0])}`
    : `Files: ${selectedFiles.length}`;
  switch (screen) {
    case 'files': {
      if (mdFiles.length === 0) {
        return React.createElement(
          Box,
          { flexDirection: 'column', paddingX: 1, width: '100%' },
          React.createElement(Text, null, 'No Markdown files found in this directory'),
          React.createElement(
            Box,
            { marginTop: 1 },
            React.createElement(Text, { color: TUI_ACCENT }, 'q'),
            React.createElement(Text, { dimColor: true }, ' quit')
          )
        );
      }
      if (mdFiles.length === 1) {
        setSelectedFiles(mdFiles);
        setScreen('picker');
        return null;
      }
      return React.createElement(FilePicker, {
        files: mdFiles,
        onSelect: (chosen) => {
          setSelectedFiles(chosen);
          setScreen('picker');
        },
        onQuit: () => process.exit(0),
      });
    }
    case 'picker':
      return React.createElement(PresetPicker, {
        presets,
        fileLabel,
        onSelect: (preset) => {
          if (!preset) { process.exit(0); return; }
          setSelectedPreset(preset.name);
          setScreen('settings');
        },
      });
    case 'settings':
      return React.createElement(SettingsScreen, {
        settings,
        onChange: (key, value) => setSettings(prev => ({ ...prev, [key]: value })),
        preset: selectedPreset,
        fileLabel,
        sourceNote: settingsSource ? `pre-filled from ${settingsSource}` : '',
        onRender: () => {
          startTimeRef.current = Date.now();
          setProgress('Reading file...');
          setResults([]);
          setCurrentFileIndex(0);
          setScreen('rendering');
        },
        onBack: () => {
          setScreen('picker');
        },
      });
    case 'rendering':
      return React.createElement(RenderingScreen, {
        preset: selectedPreset,
        selectedFiles,
        results,
        currentFileIndex,
        progress,
      });
    case 'result':
      return React.createElement(BatchResultScreen, {
        results,
        saveStatus,
        onSave: handleSave,
        onBack: () => {
          setResults([]);
          setProgress('');
          setSaveStatus(null);
          setCurrentFileIndex(0);
          setScreen('files');
        },
        onQuit: () => process.exit(0),
        onOpen: () => {
          const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'linux' ? 'xdg-open' : '';
          if (!cmd) return;
          const first = results.find(r => !r.error && r.outputPath);
          const target = first ? path.dirname(first.outputPath) : process.cwd();
          execFile(cmd, [target], () => {});
        },
      });
    default:
      return null;
  }
}

export function launchTui(presets, inputFile) {
  if (!process.stdin.isTTY) {
    return Promise.reject(new Error('interactive mode requires a terminal (stdin is not a TTY)'));
  }

  if (inputFile) {
    const resolved = path.resolve(inputFile);
    if (!existsSync(resolved)) {
      return Promise.reject(new Error(`File not found: ${inputFile}`));
    }
    if (!statSync(resolved).isFile()) {
      return Promise.reject(new Error(`Not a file: ${inputFile}`));
    }
  }

  const { waitUntilExit } = render(
    React.createElement(TuiApp, { presets, inputFile })
  );
  return waitUntilExit;
}

export function classifyPreset(preset) {
  if (!preset) return { action: 'abort' };
  return { action: 'render', name: preset.name };
}
