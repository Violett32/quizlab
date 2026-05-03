import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    // В dev-режиме всё, что начинается на /api, проксируем на бэк (localhost:3000).
    // Так фронт и бэк для браузера на одном origin — никаких CORS-проблем.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
