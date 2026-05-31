import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Configuration Vite : elle active React et redirige /api vers le backend PHP en local.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendTarget = env.VITE_BACKEND_TARGET || 'http://localhost'
  const backendPrefix = env.VITE_BACKEND_PREFIX || '/Mercato-Nova/backend/api'

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, backendPrefix),
        }
      }
    }
  }
})
