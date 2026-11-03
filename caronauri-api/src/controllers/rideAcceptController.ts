import { db } from '../db/client.js'
import type { Context } from 'hono'

export const createRideAccept = async (c: Context) => {
  try {
    const body = await c.req.json()

    const user = c.get('user') as { user_id: number }

    const user_id = user.user_id

    const { id_ride_posts, status } = body

    const result = await db.query(
      `
      INSERT INTO ride_accept
      (id_ride_posts, user_id, status)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [id_ride_posts, user_id, status]
    )

    return c.json(201)

  } catch (error) {
    console.error(error)

    return c.json({
      error: 'Erro ao criar ride_accept'
    }, 500)
  }
}

export const getRideAccepts = async (c: Context) => {
  try {

    const result = await db.query(`
      SELECT *
      FROM ride_accept
      ORDER BY id DESC
    `)

    return c.json(result.rows)

  } catch (error) {
    console.error(error)

    return c.json({
      error: 'Erro ao buscar ride_accept'
    }, 500)
  }
}