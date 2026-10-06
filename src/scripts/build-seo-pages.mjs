import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { appRoot, publicRoot } from './project-paths.mjs';
import { writeSeoPages } from './seo-pages.mjs';

const sourcePublicRoot = process.env.NO_BRAKES_PUBLIC_DIR ? path.resolve(process.env.NO_BRAKES_PUBLIC_DIR) : publicRoot;
const outputRoot = path.join(appRoot, 'dist');
const index = JSON.parse(await readFile(path.join(sourcePublicRoot, 'content-index.json'), 'utf8'));
const template = await readFile(path.join(outputRoot, 'index.html'), 'utf8');
const count = await writeSeoPages(index, template, outputRoot);
console.log(`Crawler-ready pages built: ${count} route(s).`);
