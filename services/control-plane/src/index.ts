import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { authRoutes } from './routes/auth.ts'
import { workflowRoutes } from './routes/workflows.ts'
import { connectorRoutes } from './routes/connectors.ts'
import { runRoutes } from './routes/runs.ts'
import { secretRoutes } from './routes/secrets.ts'

const app = new Hono()

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173').split(',')

app.use('*', logger())
app.use('*', cors({
  origin: allowedOrigins,
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}))

app.get('/health', (c) => c.json({ ok: true }))

app.route('/auth', authRoutes)
app.route('/workflows', workflowRoutes)
app.route('/connectors', connectorRoutes)
app.route('/runs', runRoutes)
app.route('/secrets', secretRoutes)

app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Internal server error' }, 500)
})

const port = parseInt(process.env.CONTROL_PLANE_PORT ?? '3001', 10)
console.log(`Control plane listening on port ${port}`)

export { app }
export default { port, fetch: app.fetch }
