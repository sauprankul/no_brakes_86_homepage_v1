import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const stylesheet = await readFile(path.join(process.cwd(), 'styles.css'), 'utf8');

test('mobile global search preserves room for its field, action, and full-width suggestions', () => {
  assert.match(stylesheet, /@media \(max-width: 800px\)\s*\{[\s\S]*?\.global-search \{ flex: 1 1 0; width: auto; min-width: 0; \}/);
  assert.match(stylesheet, /@media \(max-width: 520px\)\s*\{[\s\S]*?\.global-search button \{ min-width: 76px; padding: 0 10px; \}/);
  assert.match(stylesheet, /\.search-suggestions \{[^}]*right: 0; left: 0;/);
});
