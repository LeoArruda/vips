// Sets env vars before any module loads — src/lib/supabase.ts throws without these
process.env.SUPABASE_URL = 'http://127.0.0.1:54321'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key-that-is-at-least-32-chars'
process.env.SUPABASE_JWT_SECRET = 'test-jwt-secret-at-least-32-chars-long'
process.env.WORKER_KEY = 'test-worker-key-for-unit-tests'
process.env.SECRETS_ENCRYPTION_KEY = '0'.repeat(64)
process.env.CONTROL_PLANE_PORT = '3001'
process.env.ALLOWED_ORIGINS = 'http://localhost:5173'
