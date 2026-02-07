import { createMiddleware } from 'hono/factory'
import { auth } from './auth'

export type AuthUser = {
  id: string
  name: string
  email: string
  image: string | null
}

export type AuthEnv = {
  Variables: {
    user: AuthUser
    sessionId: string
  }
}

/**
 * Auth middleware: extracts the current user from the session cookie.
 * Responds 401 if no valid session is found.
 */
export const requireAuth = createMiddleware<AuthEnv>(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })

  if (!session?.user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  c.set('user', {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image ?? null,
  })
  c.set('sessionId', session.session.id)

  await next()
})
