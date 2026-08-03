import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const stylesheet = await readFile(path.join(process.cwd(), 'styles.css'), 'utf8');

test('article tables have a responsive yellow perimeter, centered padded cells, and a yellow header', () => {
  assert.match(stylesheet, /\.article-table-scroll \{[^}]*overflow-x: auto; border: 1px solid var\(--yellow\);/);
  assert.match(stylesheet, /\.article-markdown th, \.article-markdown td \{[^}]*padding: 12px 18px;[^}]*border-right: 1px solid #4a4e54;[^}]*text-align: center;/);
  assert.match(stylesheet, /\.article-markdown th \{ color: #171307; background: var\(--yellow\);/);
});
