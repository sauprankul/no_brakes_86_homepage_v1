import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const app = await readFile(path.join(process.cwd(), 'app.js'), 'utf8');
const stylesheet = await readFile(path.join(process.cwd(), 'styles.css'), 'utf8');

test('drilled navigation keeps each path entry as a separate full-size row with a collapse action', () => {
  assert.match(app, /const contextRows = \(context\?\.path \?\? \[\]\)\.map/);
  assert.match(app, /baseClass: 'tree__context'/);
  assert.match(app, />\^ Collapse<\/button>/);
  assert.match(app, /data-tree-context="\$\{category\.id\}" data-tree-root="\$\{category\.id\}" href="\$\{esc\(entryHref\(category\)\)\}"/);
  assert.match(stylesheet, /\.tree__category, \.tree__context \{ font-size: \.83rem; font-weight: 700; \}/);
  assert.match(stylesheet, /\.tree__label \{ min-width: 0; overflow-wrap: anywhere; white-space: normal;/);
});
