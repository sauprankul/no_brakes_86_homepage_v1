import { createHash } from 'node:crypto';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const toPosix = (value) => value.split(path.sep).join('/');
const digest = (value) => createHash('sha256').update(value).digest('hex');

export function watchedSourceKind(relativePath) {
  const parts = toPosix(relativePath).split('/').filter(Boolean);
  const lower = parts.map((part) => part.toLowerCase());
  if (lower.includes('sizedmedia')) return null;
  if (lower.at(-1) === 'article.md') return 'article';
  if (lower.at(-1) === 'config.yaml') return 'config';
  if (lower.includes('media')) return 'media';
  if (lower.includes('downloads')) return 'download';
  return null;
}

async function filesIn(directory, root, output) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }
  await Promise.all(entries.map(async (entry) => {
    const file = path.join(directory, entry.name);
    const relative = toPosix(path.relative(root, file));
    if (entry.isDirectory()) {
      if (entry.name.toLowerCase() !== 'sizedmedia') await filesIn(file, root, output);
      return;
    }
    const kind = watchedSourceKind(relative);
    if (kind) output.push({ file, relative, kind });
  }));
}

export async function contentSnapshot(root, previous = new Map()) {
  const files = [];
  await filesIn(root, root, files);
  const snapshot = new Map();
  await Promise.all(files.map(async ({ file, relative, kind }) => {
    const metadata = await stat(file);
    const prior = previous.get(relative);
    const unchangedMetadata = prior && prior.size === metadata.size && prior.mtimeMs === metadata.mtimeMs;
    const signature = unchangedMetadata ? prior.signature : digest(await readFile(file));
    snapshot.set(relative, { kind, signature, size: metadata.size, mtimeMs: metadata.mtimeMs });
  }));
  return snapshot;
}

export function changedSources(previous, next) {
  const paths = [...new Set([...previous.keys(), ...next.keys()])].sort();
  return paths.flatMap((sourcePath) => {
    const before = previous.get(sourcePath);
    const after = next.get(sourcePath);
    if (before?.signature === after?.signature && before?.kind === after?.kind) return [];
    return [{ path: sourcePath, kind: after?.kind ?? before?.kind, removed: !after }];
  });
}

function entryDirectory(change) {
  const parts = change.path.split('/');
  if (change.kind === 'article') return parts.slice(0, -1).join('/');
  if (change.kind === 'media') return parts.slice(0, parts.findIndex((part) => part.toLowerCase() === 'media')).join('/');
  return null;
}

export function changedAuthorDirectories(changes) {
  return [...new Set(changes.filter((change) => change.kind === 'article' || change.kind === 'media').map(entryDirectory).filter((value) => value != null))];
}

export function authorFingerprint(snapshot, directory) {
  const article = directory ? `${directory}/article.md` : 'article.md';
  const mediaPrefix = directory ? `${directory}/Media/` : 'Media/';
  const sources = [...snapshot.entries()]
    .filter(([sourcePath, record]) => (record.kind === 'article' && sourcePath === article) || (record.kind === 'media' && sourcePath.toLowerCase().startsWith(mediaPrefix.toLowerCase())))
    .sort(([left], [right]) => left.localeCompare(right));
  return digest(sources.map(([sourcePath, record]) => `${sourcePath}\0${record.signature}`).join('\n'));
}

export function authorFingerprints(snapshot) {
  const directories = [...snapshot.entries()]
    .filter(([, record]) => record.kind === 'config')
    .map(([sourcePath]) => path.posix.dirname(sourcePath) === '.' ? '' : path.posix.dirname(sourcePath));
  return new Map(directories.map((directory) => [directory, authorFingerprint(snapshot, directory)]));
}

export function contentChangeLog(changes) {
  const labels = { article: 'article.md', config: 'config.yaml', media: 'Media', download: 'Downloads' };
  return changes.map((change) => `  - ${labels[change.kind] ?? change.kind}: Content/${change.path}${change.removed ? ' (removed)' : ''}`).join('\n');
}
