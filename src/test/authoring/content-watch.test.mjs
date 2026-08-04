import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { authorFingerprint, changedAuthorDirectories, changedSources, contentChangeLog, contentSnapshot, watchedSourceKind } from '../../scripts/content-watch.mjs';

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'no-brakes-watch-'));
  const entry = path.join(root, 'season', 'round-1');
  await mkdir(path.join(entry, 'Media'), { recursive: true });
  await mkdir(path.join(entry, 'SizedMedia'), { recursive: true });
  await writeFile(path.join(entry, 'config.yaml'), 'id: round-1\npublished: false\n');
  await writeFile(path.join(entry, 'article.md'), 'Original article.\n');
  await writeFile(path.join(entry, 'Media', 'lap.jpg'), 'original media');
  await writeFile(path.join(entry, 'SizedMedia', 'lap.jpg'), 'generated media');
  return { root, entry };
}

test('content snapshots hash source content and ignore generated SizedMedia feedback', async () => {
  const { root, entry } = await fixture();
  const first = await contentSnapshot(root);
  assert.equal(watchedSourceKind('season/round-1/SizedMedia/lap.jpg'), null);
  assert.equal(first.has('season/round-1/SizedMedia/lap.jpg'), false);
  await writeFile(path.join(entry, 'article.md'), 'Original article.\n');
  const identical = await contentSnapshot(root, first);
  assert.deepEqual(changedSources(first, identical), []);
  await writeFile(path.join(entry, 'article.md'), 'Changed article.\n');
  const changed = await contentSnapshot(root, identical);
  assert.deepEqual(changedSources(identical, changed).map(({ path: sourcePath, kind }) => ({ path: sourcePath, kind })), [
    { path: 'season/round-1/article.md', kind: 'article' },
  ]);
});

test('only article and Media deltas change an entry author fingerprint and timestamp candidate', async () => {
  const { root, entry } = await fixture();
  const initial = await contentSnapshot(root);
  const baseline = authorFingerprint(initial, 'season/round-1');
  await writeFile(path.join(entry, 'config.yaml'), 'id: round-1\npublished: true\n');
  const configChanged = await contentSnapshot(root, initial);
  assert.equal(authorFingerprint(configChanged, 'season/round-1'), baseline);
  assert.deepEqual(changedAuthorDirectories(changedSources(initial, configChanged)), []);
  await writeFile(path.join(entry, 'Media', 'lap.jpg'), 'changed media');
  const mediaChanged = await contentSnapshot(root, configChanged);
  const changes = changedSources(configChanged, mediaChanged);
  assert.notEqual(authorFingerprint(mediaChanged, 'season/round-1'), baseline);
  assert.deepEqual(changedAuthorDirectories(changes), ['season/round-1']);
  assert.match(contentChangeLog(changes), /Media: Content\/season\/round-1\/Media\/lap\.jpg/);
});
