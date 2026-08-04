import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { buildPagefindIndex } from './pagefind-index.mjs';
import { appRoot, publicRoot } from './project-paths.mjs';

const contentIndex = path.join(process.env.NO_BRAKES_PUBLIC_DIR ? path.resolve(process.env.NO_BRAKES_PUBLIC_DIR) : publicRoot, 'content-index.json');
const outputPath = path.join(appRoot, 'dist', 'pagefind');
const content = JSON.parse(await readFile(contentIndex, 'utf8'));
const count = await buildPagefindIndex(content.articles ?? [], outputPath);
console.log(`Pagefind index built: ${count} article(s).`);
