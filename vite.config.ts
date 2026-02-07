import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import Components from 'unplugin-vue-components/vite'
import { PrimeVueResolver } from '@primevue/auto-import-resolver'
import ssl from '@vitejs/plugin-basic-ssl'
import packageJson from './package.json'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
    ssl(),
    Components({
      resolvers: [PrimeVueResolver()]
    })
  ],
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(packageJson.version)
  },
  resolve: {
    alias: [{ find: '@', replacement: resolve(__dirname, 'src') }]
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:17000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
