import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig(({ mode }) => ({
  base: mode === 'development' ? '/' : '/assets/react-builder/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: true,
    // נתיב עזר לפריוויו בפיתוח: /preview-dev
    proxy: {},
  },
  build: {
    outDir: 'dist',
    assetsDir: '.',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        builder: path.resolve(__dirname, 'src/builder/main.tsx'),
        preview: path.resolve(__dirname, 'src/preview/main.tsx'),
      },
      output: {
        // שמירה על שמות קבועים לקבצי כניסה לשילוב ב-PHP
        entryFileNames: '[name].js',
        // חזרה למבנה הישן: ללא תקיות נוספות
        chunkFileNames: '[name].js',
        assetFileNames: '[name][extname]',
      },
    },
  },
}))

