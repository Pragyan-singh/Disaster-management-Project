/// <reference types="vitest" />
import { fileURLToPath, URL } from 'url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'path';

// Load environment variables
const DFX_NETWORK = process.env.DFX_NETWORK || 'local';
const canisterIdMap = {
  project_backend: process.env.CANISTER_ID_PROJECT_BACKEND || 'bd3sg-teaaa-aaaaa-qaaba-cai',
  project_frontend: process.env.CANISTER_ID_PROJECT_FRONTEND || 'be2us-64aaa-aaaaa-qaabq-cai',
  internet_identity: process.env.CANISTER_ID_INTERNET_IDENTITY || 'bkyz2-fmaaa-aaaaa-qaaaq-cai'
};

export default defineConfig({
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
});
