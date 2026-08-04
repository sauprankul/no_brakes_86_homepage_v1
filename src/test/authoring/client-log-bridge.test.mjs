import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { clientLogRecord, installClientLogBridge } from '../../scripts/client-log-bridge.mjs';

test('development mirrors application console output and uncaught runtime failures', () => {
  const sent = [];
  const listeners = new Map();
  const originalCalls = [];
  const consoleObject = Object.fromEntries(['debug', 'info', 'log', 'warn', 'error'].map((level) => [level, (...args) => originalCalls.push([level, ...args])]));
  const windowObject = {
    addEventListener: (type, listener) => listeners.set(type, listener),
    removeEventListener: (type) => listeners.delete(type),
  };
  const cleanup = installClientLogBridge({ consoleObject, windowObject, send: (record) => sent.push(record) });

  consoleObject.warn('bad tag', 2026);
  listeners.get('error')({ message: 'render failed', error: new Error('render failed') });
  listeners.get('unhandledrejection')({ reason: new Error('request failed') });

  assert.deepEqual(originalCalls[0], ['warn', 'bad tag', 2026]);
  assert.equal(sent[0].message, 'bad tag 2026');
  assert.match(sent[1].message, /render failed/);
  assert.match(sent[2].message, /request failed/);
  cleanup();
  assert.equal(listeners.size, 0);
});

test('development server exposes the terminal log sink and production does not install it', async () => {
  const app = await readFile(path.join(process.cwd(), 'app.js'), 'utf8');
  const vite = await readFile(path.join(process.cwd(), 'vite.config.mjs'), 'utf8');
  assert.match(app, /if \(import\.meta\.env\.DEV\) installClientLogBridge/);
  assert.match(vite, /\/__dev\/client-log/);
  assert.deepEqual(clientLogRecord('log', ['route', { id: 'season' }]), { level: 'log', message: 'route {"id":"season"}' });
});
