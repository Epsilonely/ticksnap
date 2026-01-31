import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './', // Electron에서 상대 경로로 빌드
  server: {
    proxy: {
      '/api/upbit': {
        target: 'https://api.upbit.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/upbit/, ''),
      },
      '/api/binance': {
        target: 'https://api.binance.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/binance/, ''),
      },
      '/bapi': {
        target: 'https://www.binance.com',
        changeOrigin: true,
        secure: false,
      },
      '/fapi': {
        target: 'https://fapi.binance.com',
        changeOrigin: true,
        secure: false,
      },
    },
    port: 3000,
  },
  root: './src', // 소스 폴더를 src로 설정 (필요 시 조정)
  build: {
    outDir: '../dist', // 빌드 결과물 폴더 (public과 맞추기 위해)
    emptyOutDir: true,
  },
});
