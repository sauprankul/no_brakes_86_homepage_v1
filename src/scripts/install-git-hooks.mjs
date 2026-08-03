import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { repositoryRoot } from './project-paths.mjs';

if (!process.env.CI) {
  try {
    await promisify(execFile)('git', ['config', '--local', 'core.hooksPath', '.githooks'], { cwd: repositoryRoot, windowsHide: true });
    console.log('Installed repository Git hooks.');
  } catch {
    console.warn('Git hooks were not installed because this directory is not an available Git worktree.');
  }
}
