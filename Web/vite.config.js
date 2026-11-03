import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const cleanPrefix = (prefix = '') => prefix ? `/${prefix.replace(/^\/+|\/+$/g, '')}` : '';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const target = env.VITE_BACKEND_TARGET || 'http://localhost:3004';
  const apiPrefix = cleanPrefix(env.VITE_BACKEND_API_PREFIX ?? '/api');
  const proxy = {
        '/backend': {
          target,
          changeOrigin: true,
          cookiePathRewrite: { '/api': '/backend' },
          rewrite: path => `${apiPrefix}${path.replace(/^\/backend/, '')}`,
        },
        '/assets-api': {
          target,
          changeOrigin: true,
          rewrite: path => path.replace(/^\/assets-api/, ''),
        },
  };
  return {
    plugins: [react()],
    server: { port: 5173, strictPort: true, proxy },
    preview: { port: 4173, proxy },
  };
});
