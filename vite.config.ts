import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) return 'vendor-react'
            if (id.includes('three') || id.includes('@react-three')) return 'vendor-three'
            if (id.includes('lucide-react') || id.includes('clsx') || id.includes('tailwind-merge')) return 'vendor-ui'
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
})