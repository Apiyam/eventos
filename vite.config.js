import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const REAL_API = 'https://vexom.com.mx/back_tec_nfc/public/api/v1'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const configured = String(env.VITE_API_URL || REAL_API).replace(/\/$/, '')
  const apiUrl = /localhost|127\.0\.0\.1/i.test(configured) ? REAL_API : configured
  const target = new URL(apiUrl)

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: target.origin,
          changeOrigin: true,
          cookieDomainRewrite: 'localhost',
          rewrite: (path) => `${target.pathname}${path.replace(/^\/api/, '')}`,
          configure(proxy) {
            proxy.on('proxyRes', (proxyRes) => {
              const cookies = proxyRes.headers['set-cookie']
              if (!cookies) return
              proxyRes.headers['set-cookie'] = cookies.map((cookie) =>
                `${cookie
                  .replace(/;\s*Secure/gi, '')
                  .replace(/;\s*Domain=[^;]*/gi, '')
                  .replace(/;\s*Path=[^;]*/gi, '')}; Path=/`,
              )
            })
          },
        },
      },
    },
    preview: {
      proxy: {
        '/api': {
          target: target.origin,
          changeOrigin: true,
          cookieDomainRewrite: 'localhost',
          rewrite: (path) => `${target.pathname}${path.replace(/^\/api/, '')}`,
          configure(proxy) {
            proxy.on('proxyRes', (proxyRes) => {
              const cookies = proxyRes.headers['set-cookie']
              if (!cookies) return
              proxyRes.headers['set-cookie'] = cookies.map((cookie) =>
                `${cookie
                  .replace(/;\s*Secure/gi, '')
                  .replace(/;\s*Domain=[^;]*/gi, '')
                  .replace(/;\s*Path=[^;]*/gi, '')}; Path=/`,
              )
            })
          },
        },
      },
    },
  }
})
