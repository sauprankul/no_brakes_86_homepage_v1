import { spawn } from 'node:child_process';
import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { appRoot, publicRoot } from './project-paths.mjs';

const productionPublicRoot = path.join(appRoot, '.production-public');
const generatedPublicEntries = new Set(['content-index.json', 'downloads', 'media']);

function run(command, args, env = process.env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', env });
    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${path.basename(command)} ${args.join(' ')} exited with ${signal ?? code}.`));
    });
  });
}

async function prepareProductionPublic() {
  await rm(productionPublicRoot, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  await mkdir(productionPublicRoot, { recursive: true });
  const entries = await readdir(publicRoot, { withFileTypes: true });
  await Promise.all(entries.filter((entry) => !generatedPublicEntries.has(entry.name)).map((entry) => {
    return cp(path.join(publicRoot, entry.name), path.join(productionPublicRoot, entry.name), { recursive: entry.isDirectory() });
  }));
}

await prepareProductionPublic();
const productionEnvironment = { ...process.env, NO_BRAKES_PUBLIC_DIR: productionPublicRoot };
try {
  await run(process.execPath, ['scripts/require-node-version.mjs']);
  await run(process.execPath, ['scripts/validate-sized-media.mjs']);
  await run(process.execPath, ['scripts/build-content-index.mjs'], productionEnvironment);
  await run(process.execPath, ['node_modules/vite/bin/vite.js', 'build'], productionEnvironment);
  await run(process.execPath, ['scripts/build-pagefind.mjs'], productionEnvironment);
} finally {
  await rm(productionPublicRoot, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
}
