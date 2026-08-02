import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const required = ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_R2_ACCESS_KEY_ID', 'CLOUDFLARE_R2_BUCKET', 'CLOUDFLARE_R2_SECRET_ACCESS_KEY'];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) throw new Error(`Missing required R2 configuration: ${missing.join(', ')}`);

const root = path.join(process.cwd(), 'Content');
const mediaDirectories = new Set(['data', 'media', 'Downloads']);
const client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID, secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY },
});

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return filesIn(fullPath);
    return [fullPath];
  }));
  return nested.flat().filter((file) => file.split(path.sep).some((part) => mediaDirectories.has(part)));
}

const files = await filesIn(root);
for (const file of files) {
  const key = path.relative(root, file).replaceAll(path.sep, '/');
  await client.send(new PutObjectCommand({
    Bucket: process.env.CLOUDFLARE_R2_BUCKET,
    Key: key,
    Body: await readFile(file),
    CacheControl: 'public, max-age=31536000, immutable',
  }));
  console.log(`Uploaded ${key}`);
}
console.log(`R2 media sync complete: ${files.length} file(s).`);
