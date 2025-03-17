import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './', // Electron에서 상대 경로로 빌드
  server:{
    port: 3000,
  },
  root: './src', // 소스 폴더를 src로 설정 (필요 시 조정)
  build: {
    outDir: '../dist', // 빌드 결과물 폴더 (public과 맞추기 위해)
    emptyOutDir: true,
  },
});