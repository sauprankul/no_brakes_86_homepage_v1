import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import test from 'node:test';
import YAML from 'yaml';

function waitFor(output, predicate, timeout = 5_000) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const poll = () => {
      if (predicate(output.value)) return resolve();
      if (Date.now() - started >= timeout) return reject(new Error(`Timed out waiting for watcher output:\n${output.value}`));
      setTimeout(poll, 25);
    };
    poll();
  });
}

test('the live watcher ignores identical rewrites and logs exact paths for real author edits', { timeout: 15_000 }, async () => {
  const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), 'no-brakes-watch-'));
  const contentRoot = path.join(fixtureRoot, 'Content');
  const outputRoot = path.join(fixtureRoot, 'public');
  const entryRoot = path.join(contentRoot, 'sample');
  const articleFile = path.join(entryRoot, 'article.md');
  const configFile = path.join(entryRoot, 'config.yaml');
  const originalArticle = 'Original author text.\n';
  await mkdir(entryRoot, { recursive: true });
  await writeFile(configFile, YAML.stringify({ id: 'sample', title: 'Sample', subtitle: 'Fixture', published: false }), 'utf8');
  await writeFile(articleFile, originalArticle, 'utf8');

  const output = { value: '' };
  const child = spawn(process.execPath, ['scripts/build-content-index.mjs', '--watch', '--include-drafts', '--touch-updates'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NO_BRAKES_CONTENT_DIR: contentRoot,
      NO_BRAKES_PUBLIC_DIR: outputRoot,
      NO_BRAKES_UPDATE_INTERVAL_MS: '250',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', (chunk) => { output.value += chunk; });
  child.stderr.on('data', (chunk) => { output.value += chunk; });

  try {
    await waitFor(output, (value) => value.includes('Watching Content for authoring updates...'));
    assert.equal((output.value.match(/Content index built:/g) ?? []).length, 1);

    await writeFile(articleFile, originalArticle, 'utf8');
    await new Promise((resolve) => setTimeout(resolve, 500));
    assert.equal((output.value.match(/Content index built:/g) ?? []).length, 1);
    assert.doesNotMatch(output.value, /Content changes detected/);

    await writeFile(articleFile, `${originalArticle}Meaningful edit.\n`, 'utf8');
    await waitFor(output, (value) => value.includes('article.md: Content/sample/article.md'));
    await waitFor(output, (value) => (value.match(/Content index built:/g) ?? []).length >= 2);
    await waitFor(output, (value) => value.includes('Content/sample/config.yaml'));

    const config = YAML.parse(await readFile(configFile, 'utf8'));
    assert.match(config.updated_at, /^\d{4}-\d{2}-\d{2}T/);
    assert.equal((output.value.match(/Content changes detected/g) ?? []).length, 1);
  } finally {
    child.kill('SIGKILL');
    await rm(fixtureRoot, { recursive: true, force: true });
  }
});
