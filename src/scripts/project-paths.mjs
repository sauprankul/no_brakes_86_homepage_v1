import path from 'node:path';

export const appRoot = path.resolve(import.meta.dirname, '..');
export const repositoryRoot = path.resolve(appRoot, '..');
export const contentRoot = path.join(repositoryRoot, 'Content');
export const publicRoot = path.join(appRoot, 'public');
export const testRoot = path.join(appRoot, 'test');

export const repositoryRelative = (file) => path.relative(repositoryRoot, file);
