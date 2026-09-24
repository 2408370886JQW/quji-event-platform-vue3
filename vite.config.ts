import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      vue(),
      ...(mode === 'test'
        ? []
        : [
            Components({
              resolvers: [ElementPlusResolver()],
            }),
          ]),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      host: '0.0.0.0',
      allowedHosts: true,
      port: Number(env.VITE_PORT || 5173),
      proxy: env.VITE_API_PROXY_TARGET
        ? {
            '/api': {
              target: env.VITE_API_PROXY_TARGET,
              changeOrigin: true,
            },
          }
        : undefined,
    },
  }
})
