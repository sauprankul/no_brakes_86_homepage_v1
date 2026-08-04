import { spawn } from 'node:child_process';

const children = [
  spawn(process.execPath, ['scripts/build-content-index.mjs', '--watch', '--include-drafts', '--touch-updates'], { stdio: 'inherit' }),
  // Launch the local Vite binary through the active Node executable. Spawning
  // npx.cmd directly can raise EINVAL in Windows/VS Code task environments.
  spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1'], { stdio: 'inherit' }),
];

function stop(signal) {
  for (const child of children) child.kill(signal);
  process.exit();
}

process.on('SIGINT', () => stop('SIGINT'));
process.on('SIGTERM', () => stop('SIGTERM'));
