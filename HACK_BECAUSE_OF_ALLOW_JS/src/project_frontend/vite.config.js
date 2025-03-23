/// <reference types="vitest" />
import { fileURLToPath, URL } from 'url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import environment from 'vite-plugin-environment';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: '../../.env' });
export default defineConfig({
    base: './', // ✅ Ensures proper deployment path
    build: {
        outDir: 'dist',
        emptyOutDir: true,
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
    plugins: [
        react(),
        environment(["CANISTER_ID_project_backend", "DFX_NETWORK"]), // ✅ Only include necessary env vars
    ],
    test: {
        environment: 'jsdom',
        setupFiles: 'src/setupTests.js',
    },
    resolve: {
        alias: {
            '@declarations': path.resolve(__dirname, '../../declarations') // ✅ Corrected path
        },
        dedupe: ['@dfinity/agent'],
    },
});
