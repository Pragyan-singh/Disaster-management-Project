/// <reference types="vitest" />
import { fileURLToPath, URL } from 'url';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Load root-level .env written by `dfx deploy` (output_env_file in dfx.json)
  const rootDir = path.resolve(__dirname, '../..');
  const env = loadEnv(mode, rootDir, '');
  const DFX_NETWORK = env.DFX_NETWORK || process.env.DFX_NETWORK || 'local';
  const canisterIdMap = {
    project_backend: env.CANISTER_ID_PROJECT_BACKEND || process.env.CANISTER_ID_PROJECT_BACKEND || '',
    project_frontend: env.CANISTER_ID_PROJECT_FRONTEND || process.env.CANISTER_ID_PROJECT_FRONTEND || '',
    internet_identity: env.CANISTER_ID_INTERNET_IDENTITY || process.env.CANISTER_ID_INTERNET_IDENTITY || '',
  };

  return {
  base: './',
  build: {
    outDir: path.resolve(__dirname, '../../dist/project_frontend'),
    emptyOutDir: true,
    target: 'es2020'
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4943",
        changeOrigin: true,
      },
    },
  },
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: 'src/setupTests.js',
  },
  resolve: {
    alias: {
      '@declarations': path.resolve(__dirname, '../../declarations')
    },
    dedupe: ['@dfinity/agent'],
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    'process.env.DFX_NETWORK': JSON.stringify(DFX_NETWORK),
    'process.env.CANISTER_ID_PROJECT_BACKEND': JSON.stringify(canisterIdMap.project_backend),
    'process.env.CANISTER_ID_PROJECT_FRONTEND': JSON.stringify(canisterIdMap.project_frontend),
    'process.env.CANISTER_ID_INTERNET_IDENTITY': JSON.stringify(canisterIdMap.internet_identity)
  }
  };
});
