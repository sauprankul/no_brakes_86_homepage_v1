import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { publishedMarkdownFiles } from './published-markdown-files.mjs';
import { appRoot, contentRoot } from './project-paths.mjs';

const files = await publishedMarkdownFiles(contentRoot);
if (!files.length) {
  console.log('No published article Markdown files; skipping Markdown lint.');
  process.exit(0);
}

const cli = path.join(appRoot, 'node_modules', 'markdownlint-cli2', 'markdownlint-cli2-bin.mjs');
const result = spawnSync(process.execPath, [cli, '--no-globs', ...files], { stdio: 'inherit', shell: false });
if (result.error) console.error(`Could not launch Markdown lint: ${result.error.message}`);
process.exitCode = result.status ?? 1;
