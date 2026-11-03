import type { Context } from 'hono'
import jwt from 'jsonwebtoken'
import { db } from '../db/client.js'

export const getProfile = async (c: Context) => {
  try {
    const authHeader = c.req.header('Authorization')

    if (!authHeader) {
      return c.json({
        error: 'Token não informado'
      }, 401)
    }

    const token = authHeader.split(' ')[1]

    if (!token) {
      return c.json({
        error: 'Token inválido'
      }, 401)
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as { user_id: number }

    const result = await db.query(
      `
      SELECT 
        id,
        name,
        email,
        whatsapp
      FROM users
      WHERE id = $1
      `,
      [decoded.user_id]
    )

    if (result.rows.length === 0) {
      return c.json({
        error: 'Usuário não encontrado'
      }, 404)
    }

    return c.json({
      user: result.rows[0]
    })

  } catch (error) {

    console.error(error)

    return c.json({
      error: 'Token inválido'
    }, 401)

  }
}

export const updateProfile = async (c: Context) => {
  try {
    const authHeader = c.req.header('Authorization')

    if (!authHeader) {
      return c.json({
        error: 'Token não informado'
      }, 401)
    }

    const token = authHeader.split(' ')[1]

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as { user_id: number }

    const body = await c.req.json()

    const { name, whatsapp } = body

    if (!name?.trim()) {
      return c.json({
        error: 'Nome é obrigatório'
      }, 400)
    }

    const result = await db.query(
      `
      UPDATE users
      SET
        name = $1,
        whatsapp = $2
      WHERE id = $3
      RETURNING id, name, email, whatsapp
      `,
      [
        name.trim(),
        whatsapp?.trim() || null,
        decoded.user_id
      ]
    )

    return c.json({
      message: 'Perfil atualizado com sucesso',
      user: result.rows[0]
    })

  } catch (error) {

    console.error(error)

    return c.json({
      error: 'Erro interno no servidor'
    }, 500)

  }
}