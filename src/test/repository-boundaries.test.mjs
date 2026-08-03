import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const repositoryRoot = path.resolve(import.meta.dirname, '..', '..');
const appRoot = path.join(repositoryRoot, 'src');
const exists = (file) => access(file).then(() => true).catch(() => false);

test('the author-facing repository root contains no visible application tooling', async () => {
  const visible = (await readdir(repositoryRoot))
    .filter((name) => !name.startsWith('.'))
    .sort();

  assert.deepEqual(visible, [
    'Content',
    'Documentation',
    'LICENSE',
    'README.md',
    'Requirements',
    'agent.md',
    'src',
  ]);
});

test('the MVP contains no analytics runtime, collector, middleware, or deployment path', async () => {
  const inspectedFiles = [
    path.join(appRoot, 'app.js'),
    path.join(appRoot, 'index.html'),
    path.join(appRoot, 'package.json'),
    path.join(appRoot, 'public', '_headers'),
    path.join(repositoryRoot, '.github', 'workflows', 'quality-and-deploy.yml'),
  ];
  const forbidden = /VITE_ANALYTICS|ANALYTICS_WORKER|analytics-engine|analytics\.example|createAnalyticsTracker|deploy-analytics|\/collect\b/i;

  for (const file of inspectedFiles) {
    assert.doesNotMatch(await readFile(file, 'utf8'), forbidden, path.relative(repositoryRoot, file));
  }
  assert.equal(await exists(path.join(repositoryRoot, 'analytics-worker')), false);
  assert.equal(await exists(path.join(repositoryRoot, 'functions')), false);
});
