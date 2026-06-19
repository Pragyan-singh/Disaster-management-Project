import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');
  return {
    plugins: [react()],
    build: {
      outDir: 'dist/project_frontend',
      emptyOutDir: true,
      target: 'es2020',
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'src/project_frontend/src/index.html')
        }
      }
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:4943',
          changeOrigin: true
        }
      },
      headers: {
        "Content-Security-Policy": "default-src 'self'; img-src 'self' data: https://tile.openstreetmap.org https://{s}.tile.openstreetmap.org{s};"
      }
    },
    define: {
      global: 'window',
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      'process.env.CANISTER_ID_PROJECT_BACKEND': JSON.stringify(
        env.CANISTER_ID_PROJECT_BACKEND || env.VITE_CANISTER_ID_PROJECT_BACKEND || process.env.CANISTER_ID_PROJECT_BACKEND || ''
      ),
      'process.env.CANISTER_ID_PROJECT_FRONTEND': JSON.stringify(
        env.CANISTER_ID_PROJECT_FRONTEND || env.VITE_CANISTER_ID_PROJECT_FRONTEND || process.env.CANISTER_ID_PROJECT_FRONTEND || ''
      ),
      'process.env.CANISTER_ID_INTERNET_IDENTITY': JSON.stringify(
        env.CANISTER_ID_INTERNET_IDENTITY || env.VITE_CANISTER_ID_INTERNET_IDENTITY || process.env.CANISTER_ID_INTERNET_IDENTITY || ''
      )
    }
  };
});
