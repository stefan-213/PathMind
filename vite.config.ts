import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    proxy: {
      '/api': {
        // target: 'http://82.157.183.97:8091',
        // target: 'http://cn-hk-bgp-4.ofalias.net:58171',
        target: 'http://127.0.0.1:8091',
        changeOrigin: true,
      }
    }
  }
})
