import { spawn } from 'node:child_process';

const children = [
  spawn(process.execPath, ['scripts/build-content-index.mjs', '--watch'], { stdio: 'inherit' }),
  spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['vite', '--host', '127.0.0.1'], { stdio: 'inherit' }),
];

function stop(signal) {
  for (const child of children) child.kill(signal);
  process.exit();
}

process.on('SIGINT', () => stop('SIGINT'));
process.on('SIGTERM', () => stop('SIGTERM'));
