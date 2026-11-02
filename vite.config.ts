import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api/nms': {
          target: 'https://wimp3.nms.gov.bz',
          changeOrigin: true,
          secure: false,
          rewrite: (p) => p.replace(/^\/api\/nms/, '/api'),
          headers: {
            Authorization: 'Token f8f457d58fb40ade260d483361b88f8f9b39ad85',
            Accept: 'application/json',
          },
        },
      },
    },
  };
});
