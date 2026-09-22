import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { createClerkMiddleware } from './server/clerkMiddleware.js'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl = (env.VITE_API_URL || 'https://vexom.com.mx/back_tec_nfc/public/api/v1/').replace(/\/$/, '')
  const target = new URL(apiUrl)
  const clerkBridge = {
    name: 'clerk-bridge',
    configureServer(server) {
      server.middlewares.use(createClerkMiddleware(env.CLERK_SECRET_KEY, env.VITE_N8N_CLERK_URL))
    },
    configurePreviewServer(server) {
      server.middlewares.use(createClerkMiddleware(env.CLERK_SECRET_KEY, env.VITE_N8N_CLERK_URL))
    },
  }

  return {
    plugins: [react(), clerkBridge],
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
                cookie.replace(/;\s*Secure/gi, '').replace(/;\s*Domain=[^;]*/gi, ''),
              )
            })
          },
        },
      },
    },
  }
})
