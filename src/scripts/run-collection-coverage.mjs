import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const c8 = path.join(sourceRoot, 'node_modules', 'c8', 'bin', 'c8.js');
const coverageDirectory = await mkdtemp(path.join(tmpdir(), 'no-brakes-c8-'));

const arguments_ = [
  c8,
  '--all',
  '--check-coverage',
  '--lines',
  '100',
  '--functions',
  '100',
  '--branches',
  '100',
  '--clean=false',
  `--temp-directory=${coverageDirectory}`,
  '--include=scripts/collection-filter.mjs',
  'node',
  '--test',
  'test/content/filtering/collection-filter.test.mjs',
];

try {
  const exitCode = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, arguments_, {
      cwd: sourceRoot,
      stdio: 'inherit',
    });
    child.once('error', reject);
    child.once('close', (code) => resolve(code ?? 1));
  });
  process.exitCode = exitCode;
} finally {
  await rm(coverageDirectory, { force: true, recursive: true });
}
