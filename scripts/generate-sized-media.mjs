import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { generateSizedMedia, validateSizedMedia } from './media-pipeline.mjs';

const execFileAsync = promisify(execFile);
const root = process.cwd();
const contentRoot = path.join(root, 'Content');
const shouldStage = process.argv.includes('--stage');

try {
  const changed = await generateSizedMedia(contentRoot);
  await validateSizedMedia(contentRoot);
  if (shouldStage && changed.length) await execFileAsync('git', ['add', '--', ...changed], { cwd: root, windowsHide: true });
  console.log(changed.length ? `Sized media prepared: ${changed.length} file(s) generated, removed, or updated.` : 'Sized media is current.');
} catch (error) {
  console.error(`Sized media preparation failed: ${error.message}`);
  process.exitCode = 1;
}
