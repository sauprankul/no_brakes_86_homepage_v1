import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { togglePublishedEntry } from './scripts/dev-publish.mjs';

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

export default defineConfig({
  publicDir: process.env.NO_BRAKES_PUBLIC_DIR ?? resolve(import.meta.dirname, 'public'),
  plugins: [{
    name: 'content-index-refresh',
    configureServer(server) {
      const contentIndex = resolve(import.meta.dirname, 'public', 'content-index.json');
      const notify = (file) => {
        if (resolve(file) === contentIndex) server.ws.send({ type: 'custom', event: 'content-index-updated' });
      };
      server.watcher.add(contentIndex);
      server.watcher.on('add', notify);
      server.watcher.on('change', notify);
      server.middlewares.use('/__dev/client-log', async (request, response, next) => {
        if (request.method !== 'POST') return next();
        try {
          const record = await readJson(request);
          const level = ['debug', 'info', 'log', 'warn', 'error'].includes(record.level) ? record.level : 'log';
          console[level](`[browser:${level}] ${String(record.message ?? '')}`);
          response.statusCode = 204;
          response.end();
        } catch (error) {
          console.error(`[browser:error] Could not read browser log: ${error.message}`);
          response.statusCode = 400;
          response.end();
        }
      });
      server.middlewares.use('/__dev/publish', async (request, response, next) => {
        if (request.method !== 'POST') return next();
        try {
          const { id } = await readJson(request);
          if (typeof id !== 'string' || !id) throw new Error('A valid entry id is required.');
          const entry = await togglePublishedEntry(id);
          response.setHeader('Content-Type', 'application/json');
          response.end(JSON.stringify({ entry }));
        } catch (error) {
          response.statusCode = 400;
          response.setHeader('Content-Type', 'application/json');
          response.end(JSON.stringify({ error: error.message }));
        }
      });
    },
  }],
  build: {
    rollupOptions: {
      input: {
        site: resolve(import.meta.dirname, 'index.html'),
      },
    },
  },
});
