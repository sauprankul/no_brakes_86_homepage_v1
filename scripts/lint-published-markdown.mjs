import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { publishedMarkdownFiles } from './published-markdown-files.mjs';

const files = await publishedMarkdownFiles(path.join(process.cwd(), 'Content'));
if (!files.length) {
  console.log('No published article Markdown files; skipping Markdown lint.');
  process.exit(0);
}

const command = process.platform === 'win32' ? 'markdownlint-cli2.cmd' : 'markdownlint-cli2';
const result = spawnSync(command, files, { stdio: 'inherit', shell: false });
process.exitCode = result.status ?? 1;
