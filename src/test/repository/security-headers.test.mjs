import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

test('production CSP allows only the intentional YouTube iframe providers', async () => {
  const headers = await readFile(path.join(process.cwd(), 'public', '_headers'), 'utf8');
  const csp = headers.match(/Content-Security-Policy:\s*([^\r\n]+)/)?.[1] ?? '';
  assert.match(csp, /frame-src\s+https:\/\/www\.youtube-nocookie\.com\s+https:\/\/www\.youtube\.com/);
  assert.doesNotMatch(csp, /frame-src[^;]*(?:\*|'self'\s+https:|youtube\.com\/\*)/);
});
