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
        target: 'http://localhost:8091',
        changeOrigin: true,
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // 将大依赖拆分成独立 chunk，按需加载
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor-react'
            if (id.includes('react-router')) return 'vendor-router'
            if (id.includes('d3')) return 'vendor-d3'
            if (id.includes('mxgraph') || id.includes('react-drawio')) return 'vendor-graph'
            return 'vendor-misc'
          }
        }
      }
    }
  }
})
