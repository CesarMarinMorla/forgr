export const UNIMPLEMENTED = {};

export function warnUnimplemented(config) {
  for (const [key, { default: def, hint }] of Object.entries(UNIMPLEMENTED)) {
    const val = config[key];
    if (val !== undefined && val !== def) {
      console.warn(`Warning: "${key}" is set to ${JSON.stringify(val)} but has no effect — ${hint}`);
    }
  }
}