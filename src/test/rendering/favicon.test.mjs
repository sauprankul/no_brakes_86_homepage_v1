import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import test from 'node:test';

test('provides one stable square favicon for browsers, Apple devices, and the web manifest', async () => {
  const shell = await readFile(path.join(process.cwd(), 'index.html'), 'utf8');
  const manifest = JSON.parse(await readFile(path.join(process.cwd(), 'public', 'site.webmanifest'), 'utf8'));
  const metadata = await sharp(path.join(process.cwd(), 'public', 'favicon.png')).metadata();

  assert.match(shell, /<link rel="icon" type="image\/png" sizes="512x512" href="\/favicon\.png" \/>/);
  assert.match(shell, /<link rel="apple-touch-icon" href="\/favicon\.png" \/>/);
  assert.deepEqual(manifest.icons, [{ src: '/favicon.png', sizes: '512x512', type: 'image/png', purpose: 'any' }]);
  assert.equal(metadata.format, 'png');
  assert.equal(metadata.width, 512);
  assert.equal(metadata.height, 512);
});
