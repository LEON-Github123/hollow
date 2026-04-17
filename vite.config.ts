import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 2000, // 修改打包体积警告阈值
  },
  server: {
    proxy: {
      '/api-proxy': {
        target: 'https://api.minimax.chat',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-proxy/, ''),
        headers: {
          'Origin': 'https://api.minimax.chat',
          'Referer': 'https://api.minimax.chat/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      }
    }
  }
})
