import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

const root = dirname(fileURLToPath(import.meta.url));

// The Syn design system is a git submodule in vendor/; the app imports its source directly.
// `--mode single` inlines everything into one HTML file (used for the review artifact).
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react(), ...(mode === 'single' ? [viteSingleFile()] : [])],
  resolve: {
    alias: { '@syn/design-system': resolve(root, 'vendor/syn-design-system/src/index.ts') },
    dedupe: ['react', 'react-dom'],
  },
  build: { outDir: mode === 'single' ? 'dist-single' : 'dist' },
}));
