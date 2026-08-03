import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { generateSizedMedia, validateSizedMedia } from './media-pipeline.mjs';
import { contentRoot, repositoryRoot } from './project-paths.mjs';

const execFileAsync = promisify(execFile);
const shouldStage = process.argv.includes('--stage');

try {
  const changed = await generateSizedMedia(contentRoot);
  await validateSizedMedia(contentRoot);
  if (shouldStage && changed.length) await execFileAsync('git', ['add', '--', ...changed], { cwd: repositoryRoot, windowsHide: true });
  console.log(changed.length ? `Sized media prepared: ${changed.length} file(s) generated, removed, or updated.` : 'Sized media is current.');
} catch (error) {
  console.error(`Sized media preparation failed: ${error.message}`);
  process.exitCode = 1;
}
