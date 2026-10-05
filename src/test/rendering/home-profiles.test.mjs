import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const app = await readFile(path.join(process.cwd(), 'app.js'), 'utf8');
const stylesheet = await readFile(path.join(process.cwd(), 'styles.css'), 'utf8');

test('Home alone exposes readable links to the author profiles', () => {
  const home = app.slice(app.indexOf('function renderHome()'), app.indexOf('function tagTableMarkup'));
  assert.match(home, /https:\/\/www\.reddit\.com\/user\/404-no-brkz\//);
  assert.match(home, /https:\/\/www\.youtube\.com\/@404nobrakes/);
  assert.match(home, /https:\/\/www\.instagram\.com\/oldmansaurabh\//);
  assert.match(home, /u\/404-no-brkz/);
  assert.match(home, /@404nobrakes/);
  assert.match(home, /@oldmansaurabh/);
  assert.match(home, /class="home-profiles__icon"/);
  assert.match(stylesheet, /\.home-profiles \{ display: flex; align-items: baseline;/);
  assert.match(stylesheet, /\.home-profiles a:hover \{ color: var\(--yellow\); \}/);
});
