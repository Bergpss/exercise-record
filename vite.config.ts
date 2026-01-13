import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { vitePluginApi } from './vite-plugin-api'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), vitePluginApi()],
})
