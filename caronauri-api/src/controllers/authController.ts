import { db } from '../db/client.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import type { Context } from 'hono'

export const register = async (c: Context) => {
  try {
    const body = await c.req.json()

    const { name, email, password, whatsapp } = body

    if (!name || !email || !password) {
      return c.json({
        error: 'Campos obrigatórios faltando'
      }, 400)
    }

    // Verifica se email já existe
    const userExists = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    )

    if (userExists.rows.length > 0) {
      return c.json({
        error: 'Email já cadastrado'
      }, 400)
    }

    // Criptografar password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Inserir usuário
    const result = await db.query(
      `INSERT INTO users 
        (name, email, password, whatsapp)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email`,
      [name, email, hashedPassword, whatsapp]
    )

    const user = result.rows[0]

    // gerar token JWT
    const token = jwt.sign(
      { user_id: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    return c.json({
      message: 'Usuário criado com sucesso',
      user,
      token
    })

  } catch (error) {

    console.error(error)

    return c.json({
      error: 'Erro interno no servidor'
    }, 500)

  }
}

export const login = async (c: Context) => {
  try {

    const body = await c.req.json()

    const { email, password } = body

    if (!email || !password) {
      return c.json({
        error: 'Email and password are required'
      }, 400)
    }

    // buscar usuário
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    )

    if (result.rows.length === 0) {
      return c.json({
        error: 'Invalid credentials'
      }, 401)
    }

    const user = result.rows[0]

    // comparar senha
    const isValidPassword = await bcrypt.compare(
      password,
      user.password
    )

    if (!isValidPassword) {
      return c.json({
        error: 'Invalid credentials'
      }, 401)
    }

    // gerar token JWT
    const token = jwt.sign(
      { user_id: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    return c.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    })

  } catch (error) {

    console.error(error)

    return c.json({
      error: 'Internal server error'
    }, 500)

  }
}