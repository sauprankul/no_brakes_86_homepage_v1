import path from 'node:path';
import { validateSizedMedia } from './media-pipeline.mjs';

try {
  await validateSizedMedia(path.join(process.cwd(), 'Content'));
  console.log('Sized media validation passed.');
} catch (error) {
  console.error(`Sized media validation failed: ${error.message}`);
  process.exitCode = 1;
}
