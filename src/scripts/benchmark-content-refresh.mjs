import { readFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import path from 'node:path';
import { renderArticleMarkdown } from './content-compiler.mjs';
import { testRoot } from './project-paths.mjs';

const article = (await readFile(path.join(testRoot, 'testdata', 'long-article.md'), 'utf8')).repeat(12);
const samples = Array.from({ length: 30 }, () => {
  const start = performance.now();
  renderArticleMarkdown(article, 'synthetic');
  return performance.now() - start;
}).sort((a, b) => a - b);
const percentile95 = samples[Math.ceil(samples.length * 0.95) - 1];
console.log(`Synthetic article: ${Buffer.byteLength(article)} bytes; renderer p95: ${percentile95.toFixed(2)} ms.`);
