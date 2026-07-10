import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Yeh do blocks sabse important hain is error ke liye:
  server: {
    allowedHosts: ['crm.netbots.io', 'localhost']
  },
  preview: {
    allowedHosts: ['crm.netbots.io', 'localhost']
  }
})
