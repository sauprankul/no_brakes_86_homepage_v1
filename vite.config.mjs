import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
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
