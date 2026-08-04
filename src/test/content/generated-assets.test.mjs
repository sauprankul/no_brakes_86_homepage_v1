import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';

const execFileAsync = promisify(execFile);

test('content build emits thumbnails and downloads without flattening the entry hierarchy', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'no-brakes-assets-'));
  const content = path.join(root, 'Content');
  const output = path.join(root, 'public');
  const article = path.join(content, 'race', 'season', 'round');
  await mkdir(path.join(article, 'SizedMedia'), { recursive: true });
  await mkdir(path.join(article, 'Downloads'), { recursive: true });
  await writeFile(path.join(content, 'race', 'config.yaml'), 'id: race\ntitle: 86 Challenge\npublished: false\n');
  const seasonConfig = path.join(content, 'race', 'season', 'config.yaml');
  await writeFile(seasonConfig, 'id: season\nparent: race\ntitle: 2026 Season\npublished: false\npublished_at: 2026-08-02\n');
  await writeFile(path.join(article, 'config.yaml'), 'id: round-1\nparent: season\ntitle: Round 1\nsubtitle: Thunderhill\npublished: true\npublished_at: 2026-08-03\nupdated_at: 2026-08-03T03:00:00.000Z\ntags: []\n');
  await writeFile(path.join(article, 'article.md'), '## Data\n\n[Telemetry](<./Downloads/lap data.csv>)');
  await writeFile(path.join(article, 'SizedMedia', 'thumbnail.jpg'), 'synthetic thumbnail');
  await writeFile(path.join(article, 'Downloads', 'lap data.csv'), 'time,speed\n0,0\n');
  await execFileAsync(process.execPath, ['scripts/build-content-index.mjs', '--include-drafts'], { cwd: process.cwd(), env: { ...process.env, NO_BRAKES_CONTENT_DIR: content, NO_BRAKES_PUBLIC_DIR: output } });
  const index = JSON.parse(await readFile(path.join(output, 'content-index.json'), 'utf8'));
  const built = index.articles.find((entry) => entry.id === 'round-1');
  assert.match(await readFile(seasonConfig, 'utf8'), /published_at: 2026-08-02T00:00:00.000Z/);
  assert.equal(built.published, true);
  assert.equal(built.date, '2026-08-03T00:00:00.000Z');
  assert.equal(built.thumbnail, '/media/round-1/thumbnail.jpg');
  assert.match(built.html, /href="\/86-challenge\/2026-season\/round-1\/downloads\/lap%20data\.csv"/);
  assert.equal(await readFile(path.join(output, 'media', 'round-1', 'thumbnail.jpg'), 'utf8'), 'synthetic thumbnail');
  assert.match(await readFile(path.join(output, '86-challenge', '2026-season', 'round-1', 'downloads', 'lap data.csv'), 'utf8'), /time,speed/);
});
