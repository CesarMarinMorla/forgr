export class ChromiumNotFoundError extends Error {
  constructor(hint) {
    super(hint || 'Chromium binary not found. Run: npm run install-chromium');
    this.name = 'ChromiumNotFoundError';
  }
}

export class PresetNotFoundError extends Error {
  constructor(preset, available) {
    const list = Array.isArray(available) ? available.join(', ') : '';
    super(`preset "${preset}" not found. Available: ${list}`);
    this.name = 'PresetNotFoundError';
    this.preset = preset;
    this.available = available;
  }
}

export class PipelineError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'PipelineError';
    this.cause = cause;
  }
}
