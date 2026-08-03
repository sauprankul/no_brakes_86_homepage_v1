import { spawnSync } from 'node:child_process';
import { publishedMarkdownFiles } from './published-markdown-files.mjs';
import { contentRoot } from './project-paths.mjs';

const files = await publishedMarkdownFiles(contentRoot);
if (!files.length) {
  console.log('No published article Markdown files; skipping Markdown lint.');
  process.exit(0);
}

const command = process.platform === 'win32' ? 'markdownlint-cli2.cmd' : 'markdownlint-cli2';
const result = spawnSync(command, files, { stdio: 'inherit', shell: false });
process.exitCode = result.status ?? 1;
