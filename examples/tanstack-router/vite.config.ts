/* eslint-env node */

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { nitroV2Plugin } from '@tanstack/nitro-v2-vite-plugin';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import tailwindcss from '@tailwindcss/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
const projectRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    nitroV2Plugin(),
    TanStackRouterVite({ autoCodeSplitting: true }),
    viteReact(),
    tailwindcss(),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@': resolve(projectRoot, './src'),
    },
  },
});
