import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { buildPagefindIndex, pagefindDocument } from '../../scripts/pagefind-index.mjs';

test('Pagefind indexes article HTML under its real hierarchical URL with searchable metadata', async () => {
  const entry = { id: 'round-1', path: '/86-challenge/2026-season/round-1', category: '86-challenge', title: 'Round 1', subtitle: 'Thunderhill', date: '2026-08-03T00:00:00.000Z', tags: ['thunderhill'], thumbnail: '/media/round-1/thumbnail.jpg', hasArticle: true, html: '<h2 id="recap">Recap</h2><p>Body-only cyclone evidence.</p>' };
  const document = pagefindDocument(entry);
  assert.match(document, /data-pagefind-meta="entry_id\[content\]" content="round-1"/);
  assert.match(document, /data-pagefind-meta="category\[content\]" content="86-challenge"/);
  assert.match(document, /data-pagefind-meta="date\[content\]" content="2026-08-03T00:00:00.000Z"/);
  assert.match(document, /data-pagefind-meta="tag\[content\]" content="thunderhill"/);
  assert.match(document, /data-pagefind-body/);
  assert.match(document, /Body-only cyclone evidence/);
  const output = path.join(await mkdtemp(path.join(os.tmpdir(), 'no-brakes-pagefind-')), 'pagefind');
  assert.equal(await buildPagefindIndex([entry], output), 1);
  const files = await readdir(output);
  assert.ok(files.includes('pagefind.js'));
  const metadataFile = files.find((file) => file.endsWith('.pf_meta'));
  assert.ok(metadataFile);
  assert.ok((await readFile(path.join(output, metadataFile))).byteLength > 0);
});
