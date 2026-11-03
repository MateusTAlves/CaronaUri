import type { Context, Next } from 'hono'
import jwt from 'jsonwebtoken'

export const authMiddleware = async (
  c: Context,
  next: Next
) => {

  const authHeader = c.req.header('Authorization')

  if (!authHeader) {
    return c.json({ error: 'Token missing' }, 401)
  }

  const token = authHeader.replace('Bearer ', '')

  try {

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    )

    c.set('user', decoded)

    await next()

  } catch {

    return c.json({
      error: 'Invalid token'
    }, 401)

  }
}