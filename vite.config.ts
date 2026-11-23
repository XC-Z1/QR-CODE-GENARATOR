import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      // Copies src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." (e.g. generate_image output) still resolve
      // in production builds. Do not remove.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const srcAssets = path.resolve(__dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }
        },
      },
      {
        name: 'resolve-og-image-origin',
        transformIndexHtml(html: string): string {
          const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL;
          const vercelUrl = process.env.VERCEL_URL;
          const appUrl = process.env.APP_URL;
          const rawOrigin = vercelProd
            ? `https://${vercelProd}`
            : vercelUrl
            ? `https://${vercelUrl}`
            : appUrl && appUrl !== 'MY_APP_URL'
            ? appUrl.replace(/\/+$/, '')
            : '';
          if (!rawOrigin) {
            return html;
          }
          return html.replace(
            /https:\/\/qr-code-generator-inky\.vercel\.app/g,
            rawOrigin,
          );
        },
      },
    ],
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
    },
  };
});
