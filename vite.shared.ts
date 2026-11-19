import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

const root = dirname(fileURLToPath(import.meta.url));

/**
 * The Vite setup every app shares. The Syn design system is a git submodule in vendor/ and @sam/shared a workspace
 * package; both are imported as source, so neither needs a build step. `--mode single` inlines the app into one
 * HTML file (used for review).
 */
export function samApp({ port }: { port: number }) {
  return defineConfig(({ mode }) => ({
    base: './',
    plugins: [react(), ...(mode === 'single' ? [viteSingleFile()] : [])],
    resolve: {
      alias: {
        '@syn/design-system': resolve(root, 'vendor/syn-design-system/src/index.ts'),
        '@sam/shared/setup': resolve(root, 'packages/shared/src/setup.ts'),
        '@sam/shared': resolve(root, 'packages/shared/src/index.ts'),
      },
      dedupe: ['react', 'react-dom'],
    },
    server: { port, strictPort: true },
    preview: { port },
    build: { outDir: mode === 'single' ? 'dist-single' : 'dist' },
  }));
}
