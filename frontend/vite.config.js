import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: {
      '/pacientes': 'http://127.0.0.1:8000',
      '/cif': 'http://127.0.0.1:8000',
      '/auth': 'http://127.0.0.1:8000',
      '/admin/usuarios': 'http://127.0.0.1:8000',
      '/pesquisa/pacientes': 'http://127.0.0.1:8000',
    },
  },
})
