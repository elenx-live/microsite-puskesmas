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
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          admin: path.resolve(__dirname, 'admin.html'),
        },
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // 1. Charting & Visualization libraries (Admin Only)
              if (
                id.includes('recharts') ||
                id.includes('d3-') ||
                id.includes('victory') ||
                id.includes('react-smooth') ||
                id.includes('clsx') === false && id.includes('internmap') ||
                id.includes('d3-scale') ||
                id.includes('d3-shape') ||
                id.includes('d3-path') ||
                id.includes('d3-array') ||
                id.includes('d3-time') ||
                id.includes('d3-interpolate') ||
                id.includes('d3-color') ||
                id.includes('d3-format') ||
                id.includes('d3-ease') ||
                id.includes('d3-timer')
              ) {
                return 'vendor-charts';
              }

              // 2. Firebase SDK
              if (id.includes('@firebase') || id.includes('firebase')) {
                return 'vendor-firebase';
              }

              // 3. Motion animation engine
              if (id.includes('motion')) {
                return 'vendor-motion';
              }

              // 4. Lucide React Icon library
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }

              // 5. Core React & Router Runtime
              if (
                id.includes('react/') ||
                id.includes('react-dom/') ||
                id.includes('react-router') ||
                id.includes('scheduler')
              ) {
                return 'vendor-react';
              }
            }
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
