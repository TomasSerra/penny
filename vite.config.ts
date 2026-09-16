import { existsSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const root = fileURLToPath(new URL('.', import.meta.url))

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  const raw = Buffer.concat(chunks).toString()
  if (!raw) return undefined
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

/** Serves the Vercel functions in `api/` during `vite dev`, so the Vercel CLI isn't needed locally. */
function devApi(): Plugin {
  return {
    name: 'penny:dev-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        if (!req.url?.startsWith('/api/')) return next()
        const url = new URL(req.url, 'http://localhost')
        const route = url.pathname.slice('/api/'.length).replace(/\/$/, '')
        const file = `${root}api/${route}.ts`
        if (!route || route.split('/').some((part) => part.startsWith('_')) || !existsSync(file)) {
          res.statusCode = 404
          res.end()
          return
        }

        const request = Object.assign(req, { query: Object.fromEntries(url.searchParams), body: await readBody(req) })
        const response = Object.assign(res, {
          status(code: number) {
            res.statusCode = code
            return response
          },
          json(data: unknown) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify(data))
            return response
          },
          send(data: string) {
            res.end(data)
            return response
          },
        })

        try {
          const module = await server.ssrLoadModule(file)
          await module.default(request, response)
        } catch (error) {
          server.config.logger.error(`[api] /${route}: ${(error as Error).stack ?? error}`)
          if (!res.headersSent) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: false, error: 'Error interno' }))
          }
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Server-only variables (emulator hosts, service account) for the dev API.
  const env = loadEnv(mode, root, '')
  for (const [key, value] of Object.entries(env)) {
    if (!key.startsWith('VITE_') && process.env[key] === undefined) process.env[key] = value
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      devApi(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
        manifest: {
          id: '/',
          name: 'Penny',
          short_name: 'Penny',
          description: 'Tus finanzas personales, simples y claras.',
          lang: 'es-AR',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#f6e9d2',
          theme_color: '#241a12',
          categories: ['finance'],
          icons: [
            { src: 'favicon.ico', sizes: '16x16 32x32', type: 'image/x-icon' },
            { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'icon-192-maskable.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
            { src: 'icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
          shortcuts: [
            {
              name: 'Nuevo gasto',
              short_name: 'Nuevo gasto',
              url: '/?nuevo=1',
              icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' }],
            },
          ],
        },
        workbox: {
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//, /^\/__\//],
          globPatterns: ['**/*.{js,css,html,svg,png,webp,ico,woff2}'],
          cleanupOutdatedCaches: true,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
      },
    },
  }
})
