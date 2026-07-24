import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

const clientRoot = fileURLToPath(new URL('.', import.meta.url))

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[char])
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, clientRoot, '')
  // Dev proxy target — override with VITE_API_TARGET to point at the server's
  // https port (e.g. https://localhost:3443). secure:false accepts a self-signed
  // dev cert. The /socket.io ws target follows the same host.
  const apiTarget = env.VITE_API_TARGET || 'http://localhost:3000'
  const appName = env.VITE_APP_NAME?.trim() || 'SaaS'

  return {
    plugins: [
      vue(),
      {
        name: 'brand-title',
        transformIndexHtml(html) {
          return html.replace('%APP_NAME%', escapeHtml(appName))
        },
      },
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@shared': fileURLToPath(new URL('../shared', import.meta.url)),
        'vue': 'vue/dist/vue.esm-bundler.js',
      },
    },
    build: {
      target: 'esnext',
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
        '/socket.io': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      },
    },
  }
})
