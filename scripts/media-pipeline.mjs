import { access, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { spawn } from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import sharp from 'sharp';

export const IMAGE_EXTENSIONS = new Set(['.heic', '.heif', '.jpeg', '.jpg', '.png']);
export const VIDEO_EXTENSIONS = new Set(['.m4v', '.mov', '.mp4', '.webm']);
export const IMAGE_MIN_DIMENSION_MAX = 1080;
export const VIDEO_MIN_DIMENSION_MAX = 480;
export const VIDEO_DURATION_MAX_SECONDS = 30;
export const CLOUDFLARE_ASSET_MAX_BYTES = 25 * 1024 * 1024;
const manifestName = '.media-manifest.json';

const exists = (file) => access(file).then(() => true).catch(() => false);
const toPosix = (value) => value.split(path.sep).join('/');
const hashFile = async (file) => createHash('sha256').update(await readFile(file)).digest('hex');

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(file) : [file];
  }));
  return nested.flat();
}

async function directoriesNamed(directory, name) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.filter((entry) => entry.isDirectory()).map(async (entry) => {
    const child = path.join(directory, entry.name);
    return [entry.name === name ? child : null, ...(await directoriesNamed(child, name))].filter(Boolean);
  }));
  return nested.flat();
}

export function mediaTypeFor(file) {
  const extension = path.extname(file).toLowerCase();
  if (IMAGE_EXTENSIONS.has(extension)) return 'image';
  if (VIDEO_EXTENSIONS.has(extension)) return 'video';
  throw new Error(`${toPosix(file)}: unsupported Media extension "${extension || '(none)'}". Supported images: ${[...IMAGE_EXTENSIONS].join(', ')}; videos: ${[...VIDEO_EXTENSIONS].join(', ')}.`);
}

export function sizedMediaRelativePath(sourceRelative, type) {
  const extension = path.extname(sourceRelative);
  return `${sourceRelative.slice(0, -extension.length)}.${type === 'image' ? 'jpg' : 'mp4'}`;
}

function boundedDimensions(width, height, minDimensionMax) {
  const smallest = Math.min(width, height);
  if (!smallest || smallest <= minDimensionMax) return { width, height };
  const scale = minDimensionMax / smallest;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true });
    let stderr = '';
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code) => code === 0 ? resolve() : reject(new Error(`${path.basename(command)} exited with ${code}: ${stderr.trim()}`)));
  });
}

async function probeVideo(file) {
  const output = [];
  await new Promise((resolve, reject) => {
    const child = spawn(ffprobeStatic.path, ['-v', 'error', '-show_entries', 'format=duration:stream=codec_type,width,height,r_frame_rate', '-of', 'json', file], { windowsHide: true });
    let stderr = '';
    child.stdout.on('data', (chunk) => output.push(chunk));
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code) => code === 0 ? resolve() : reject(new Error(`ffprobe exited with ${code}: ${stderr.trim()}`)));
  });
  const data = JSON.parse(Buffer.concat(output).toString('utf8'));
  const stream = data.streams?.find((candidate) => candidate.codec_type === 'video');
  const duration = Number(data.format?.duration);
  if (!stream?.width || !stream?.height || !Number.isFinite(duration)) throw new Error(`${toPosix(file)}: could not read video dimensions or duration.`);
  const [numerator, denominator] = String(stream.r_frame_rate ?? '0/1').split('/').map(Number);
  return { width: stream.width, height: stream.height, duration, frameRate: denominator ? numerator / denominator : 0 };
}

async function convertImage(source, destination) {
  const input = sharp(source, { limitInputPixels: 100_000_000 }).rotate();
  const metadata = await input.metadata();
  if (!metadata.width || !metadata.height) throw new Error(`${toPosix(source)}: could not read image dimensions.`);
  const dimensions = boundedDimensions(metadata.width, metadata.height, IMAGE_MIN_DIMENSION_MAX);
  await input
    .resize({ ...dimensions, fit: 'inside', withoutEnlargement: true })
    .flatten({ background: '#101010' })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(destination);
}

async function convertVideo(source, destination) {
  const input = await probeVideo(source);
  if (input.duration > VIDEO_DURATION_MAX_SECONDS) throw new Error(`${toPosix(source)}: video is ${input.duration.toFixed(1)}s; static MVP clips must be ${VIDEO_DURATION_MAX_SECONDS}s or shorter.`);
  const filter = "scale=w='if(gte(iw,ih),-2,min(480,iw))':h='if(gte(iw,ih),min(480,ih),-2)',fps=30";
  await run(ffmpegPath, ['-y', '-i', source, '-map', '0:v:0', '-map', '0:a?', '-vf', filter, '-c:v', 'libx264', '-profile:v', 'baseline', '-level:v', '3.0', '-pix_fmt', 'yuv420p', '-crf', '28', '-preset', 'slow', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', destination]);
}

export async function validateSizedFile(file) {
  const size = (await stat(file)).size;
  if (size > CLOUDFLARE_ASSET_MAX_BYTES) throw new Error(`${toPosix(file)}: ${size} bytes exceeds Cloudflare Pages' 25 MiB static-asset limit.`);
  const extension = path.extname(file).toLowerCase();
  if (extension === '.jpg') {
    const metadata = await sharp(file).metadata();
    if (!metadata.width || !metadata.height || Math.min(metadata.width, metadata.height) > IMAGE_MIN_DIMENSION_MAX) throw new Error(`${toPosix(file)}: JPEG must have a smallest dimension no larger than ${IMAGE_MIN_DIMENSION_MAX}px.`);
    return;
  }
  if (extension === '.mp4') {
    const metadata = await probeVideo(file);
    if (metadata.duration > VIDEO_DURATION_MAX_SECONDS) throw new Error(`${toPosix(file)}: MP4 must be ${VIDEO_DURATION_MAX_SECONDS}s or shorter.`);
    if (Math.min(metadata.width, metadata.height) > VIDEO_MIN_DIMENSION_MAX) throw new Error(`${toPosix(file)}: MP4 must have a smallest dimension no larger than ${VIDEO_MIN_DIMENSION_MAX}px.`);
    if (metadata.frameRate > 30.01) throw new Error(`${toPosix(file)}: MP4 must be 30fps or lower.`);
    return;
  }
  throw new Error(`${toPosix(file)}: SizedMedia may contain only generated .jpg and .mp4 files.`);
}

async function readManifest(file) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return { version: 1, files: [] };
  }
}

async function nodeMediaDirectories(contentRoot) {
  return directoriesNamed(contentRoot, 'Media');
}

export async function generateSizedMedia(contentRoot) {
  const changed = [];
  for (const mediaDirectory of await nodeMediaDirectories(contentRoot)) {
    const nodeDirectory = path.dirname(mediaDirectory);
    const sizedDirectory = path.join(nodeDirectory, 'SizedMedia');
    const manifestFile = path.join(sizedDirectory, manifestName);
    const sources = await filesIn(mediaDirectory);
    const outputs = new Map();
    for (const source of sources) {
      const relative = toPosix(path.relative(mediaDirectory, source));
      const type = mediaTypeFor(source);
      const output = sizedMediaRelativePath(relative, type);
      if (outputs.has(output)) throw new Error(`${toPosix(source)}: generated path collides with ${toPosix(outputs.get(output))}. Rename one source file.`);
      outputs.set(output, source);
    }
    const previous = await readManifest(manifestFile);
    const previousBySource = new Map((previous.files ?? []).map((entry) => [entry.source, entry]));
    const nextFiles = [];
    await mkdir(sizedDirectory, { recursive: true });
    for (const [outputRelative, source] of outputs) {
      const sourceRelative = toPosix(path.relative(mediaDirectory, source));
      const sourceHash = await hashFile(source);
      const destination = path.join(sizedDirectory, outputRelative);
      const prior = previousBySource.get(sourceRelative);
      if (!prior || prior.source_hash !== sourceHash || !await exists(destination)) {
        await mkdir(path.dirname(destination), { recursive: true });
        if (mediaTypeFor(source) === 'image') await convertImage(source, destination);
        else await convertVideo(source, destination);
        changed.push(destination);
      }
      await validateSizedFile(destination);
      nextFiles.push({ source: sourceRelative, source_hash: sourceHash, output: toPosix(outputRelative), type: mediaTypeFor(source) });
    }
    for (const prior of previous.files ?? []) {
      if (nextFiles.some((entry) => entry.source === prior.source)) continue;
      const obsolete = path.resolve(sizedDirectory, prior.output);
      if (obsolete.startsWith(`${path.resolve(sizedDirectory)}${path.sep}`) && await exists(obsolete)) {
        await rm(obsolete);
        changed.push(obsolete);
      }
    }
    const manifest = { version: 1, files: nextFiles.sort((left, right) => left.source.localeCompare(right.source)) };
    const nextManifest = `${JSON.stringify(manifest, null, 2)}\n`;
    if (!await exists(manifestFile) || await readFile(manifestFile, 'utf8') !== nextManifest) {
      await writeFile(manifestFile, nextManifest, 'utf8');
      changed.push(manifestFile);
    }
  }
  return changed;
}

export async function validateSizedMedia(contentRoot) {
  const sizedDirectories = await directoriesNamed(contentRoot, 'SizedMedia');
  for (const directory of sizedDirectories) {
    const manifestFile = path.join(directory, manifestName);
    if (!await exists(manifestFile)) throw new Error(`${toPosix(directory)}: SizedMedia needs ${manifestName}. Run npm run media:prepare locally.`);
    const manifest = await readManifest(manifestFile);
    const expected = new Set((manifest.files ?? []).map((entry) => entry.output));
    for (const file of await filesIn(directory)) {
      if (path.basename(file) === manifestName) continue;
      const relative = toPosix(path.relative(directory, file));
      if (!expected.has(relative)) throw new Error(`${toPosix(file)}: not recorded in ${manifestName}. Run npm run media:prepare locally.`);
      await validateSizedFile(file);
    }
    for (const output of expected) {
      if (!await exists(path.join(directory, output))) throw new Error(`${toPosix(directory)}: ${output} is listed in ${manifestName} but missing.`);
    }
  }
}

export function publicMediaPath(nodeId, sourcePath) {
  const normalized = sourcePath.replaceAll('\\', '/').replace(/^\.\/Media\//i, '');
  const type = mediaTypeFor(normalized);
  return `/media/${encodeURIComponent(nodeId)}/${sizedMediaRelativePath(normalized, type).split('/').map(encodeURIComponent).join('/')}`;
}
