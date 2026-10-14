import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: {
    rollupOptions: {
      output: {
        // Split vendor code so pages load faster (Performance NFR)
        manualChunks: { vendor: ['react', 'react-dom', 'react-router-dom', 'axios'] },
      },
    },
  },
});
