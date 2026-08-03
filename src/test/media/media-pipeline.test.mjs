import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import ffmpegPath from 'ffmpeg-static';
import sharp from 'sharp';
import { generateSizedMedia, mediaTypeFor, publicMediaPath, sizedMediaRelativePath, validateSizedMedia } from '../../scripts/media-pipeline.mjs';

test('generates a committed-sized JPEG and manifest from an ignored source image', async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'no-brakes-media-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  const media = path.join(root, 'Content', 'entry', 'Media');
  await mkdir(media, { recursive: true });
  await sharp({ create: { width: 2400, height: 1350, channels: 3, background: '#f0c500' } }).png().toFile(path.join(media, 'thumbnail.png'));

  const changed = await generateSizedMedia(path.join(root, 'Content'));
  const output = path.join(root, 'Content', 'entry', 'SizedMedia', 'thumbnail.jpg');
  const metadata = await sharp(output).metadata();
  const manifest = JSON.parse(await readFile(path.join(root, 'Content', 'entry', 'SizedMedia', '.media-manifest.json'), 'utf8'));

  assert.ok(changed.includes(output));
  assert.deepEqual({ width: metadata.width, height: metadata.height }, { width: 1920, height: 1080 });
  assert.deepEqual(manifest.files.map((file) => file.output), ['thumbnail.jpg']);
  assert.equal(publicMediaPath('entry-id', './Media/thumbnail.png'), '/media/entry-id/thumbnail.jpg');
  assert.equal(sizedMediaRelativePath('nested/thumbnail.heic', mediaTypeFor('nested/thumbnail.heic')), 'nested/thumbnail.jpg');
  await validateSizedMedia(path.join(root, 'Content'));

  await rm(path.join(media, 'thumbnail.png'));
  await generateSizedMedia(path.join(root, 'Content'));
  await assert.rejects(() => readFile(output));
});

test('converts a high-frame-rate source clip to the static MP4 profile', async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'no-brakes-video-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  const media = path.join(root, 'Content', 'entry', 'Media');
  await mkdir(media, { recursive: true });
  const source = path.join(media, 'lap.mov');
  await promisify(execFile)(ffmpegPath, ['-y', '-f', 'lavfi', '-i', 'testsrc=size=1280x720:rate=60', '-t', '1', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', source], { windowsHide: true });

  await generateSizedMedia(path.join(root, 'Content'));
  await validateSizedMedia(path.join(root, 'Content'));
  await readFile(path.join(root, 'Content', 'entry', 'SizedMedia', 'lap.mp4'));
});
