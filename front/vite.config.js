import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: './',
  server: {
    port: 3000,
    open: false,
    fs: {
      allow: ['..']
    }
  }
});
