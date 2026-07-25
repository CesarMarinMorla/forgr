import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ChromiumNotFoundError, PresetNotFoundError, PipelineError } from '../../src/errors.js';

test('ChromiumNotFoundError has correct name and message', () => {
  const err = new ChromiumNotFoundError();
  assert.equal(err.name, 'ChromiumNotFoundError');
  assert.match(err.message, /Chromium/);
  assert.match(err.message, /install-chromium/);
});

test('ChromiumNotFoundError accepts custom message', () => {
  const err = new ChromiumNotFoundError('custom hint');
  assert.match(err.message, /custom hint/);
});

test('PresetNotFoundError has correct name and message', () => {
  const err = new PresetNotFoundError('foo', ['terminal', 'minimal']);
  assert.equal(err.name, 'PresetNotFoundError');
  assert.match(err.message, /"foo"/);
  assert.match(err.message, /terminal/);
  assert.match(err.message, /minimal/);
});

test('PresetNotFoundError stores preset and available', () => {
  const err = new PresetNotFoundError('bad', ['a', 'b']);
  assert.equal(err.preset, 'bad');
  assert.deepEqual(err.available, ['a', 'b']);
});

test('PipelineError has correct name, message, and cause', () => {
  const cause = new Error('root cause');
  const err = new PipelineError('pipeline failed', cause);
  assert.equal(err.name, 'PipelineError');
  assert.match(err.message, /pipeline failed/);
  assert.equal(err.cause, cause);
});

test('PipelineError works without cause', () => {
  const err = new PipelineError('simple error');
  assert.equal(err.message, 'simple error');
  assert.equal(err.cause, undefined);
});
