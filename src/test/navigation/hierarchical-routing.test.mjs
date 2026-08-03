import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const app = await readFile(path.join(process.cwd(), 'app.js'), 'utf8');
const shell = await readFile(path.join(process.cwd(), 'index.html'), 'utf8');

test('navigation uses path history without category or article URL prefixes', () => {
  assert.match(app, /resolveContentRoute\(categories, articles, window\.location\.pathname\)/);
  assert.match(app, /window\.history\[replace \? 'replaceState' : 'pushState'\]/);
  assert.match(app, /addEventListener\('popstate'/);
  assert.doesNotMatch(shell, /href="#(?:home|about|category|article)/);
  assert.doesNotMatch(shell, /data-route=/);
});
