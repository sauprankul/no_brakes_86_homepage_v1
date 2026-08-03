import { validateSizedMedia } from './media-pipeline.mjs';
import { contentRoot } from './project-paths.mjs';

try {
  await validateSizedMedia(contentRoot);
  console.log('Sized media validation passed.');
} catch (error) {
  console.error(`Sized media validation failed: ${error.message}`);
  process.exitCode = 1;
}
