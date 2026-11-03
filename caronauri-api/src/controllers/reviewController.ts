import type { Context } from 'hono'
import { db } from '../db/client.js'

export const createReview = async (c: Context) => {
  try {
    const body = await c.req.json()

    const {
      appraiser_id,
      evaluated_id,
      ride_posts_id
    } = body

    if (!appraiser_id || !evaluated_id || !ride_posts_id) {
      return c.json(
        { error: 'Campos obrigatórios não informados!' },
        400
      )
    }

    const result = await db.query(
      `
      INSERT INTO reviews (
        appraiser_id,
        evaluated_id,
        ride_posts_id
      )
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [
        appraiser_id,
        evaluated_id,
        ride_posts_id
      ]
    )

    return c.json(result.rows[0], 201)
  } catch (error) {
    console.error(error)

    return c.json(
      { error: 'Erro ao cadastrar review' },
      500
    )
  }
}

export const updateReview = async (c: Context) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()

    const { score, comment } = body

    const result = await db.query(
      `
      UPDATE reviews
      SET
        score = $1,
        comment = $2
      WHERE id = $3
      RETURNING *
      `,
      [score, comment, id]
    )

    if (result.rows.length === 0) {
      return c.json(
        { error: 'Review não encontrada' },
        404
      )
    }

    return c.json(result.rows[0])
  } catch (error) {
    console.error(error)

    return c.json(
      { error: 'Erro ao atualizar review' },
      500
    )
  }
}

export const getReviews = async (c: Context) => {
  try {
    const result = await db.query(`
      SELECT
        r.id,
        r.score,
        r.comment,

        appraiser.id AS appraiser_id,
        appraiser.name AS appraiser_name,
        appraiser.email AS appraiser_email,

        evaluated.id AS evaluated_id,
        evaluated.name AS evaluated_name,
        evaluated.email AS evaluated_email,

        rp.id AS ride_post_id

      FROM reviews r

      INNER JOIN users appraiser
        ON appraiser.id = r.appraiser_id

      INNER JOIN users evaluated
        ON evaluated.id = r.evalueted_id

      INNER JOIN ride_posts rp
        ON rp.id = r.ride_posts_id

      ORDER BY r.id DESC
    `)

    return c.json(result.rows)
  } catch (error) {
    console.error(error)

    return c.json(
      { error: 'Erro ao buscar reviews' },
      500
    )
  }
}

export const getReviewById = async (c: Context) => {
  try {
    const id = c.req.param('id')

    const result = await db.query(
      `
      SELECT
        r.id,
        r.score,
        r.comment,
        r.created_at,

        appraiser.id AS appraiser_id,
        appraiser.name AS appraiser_name,
        appraiser.email AS appraiser_email,

        evaluated.id AS evaluated_id,
        evaluated.name AS evaluated_name,
        evaluated.email AS evaluated_email,

        rp.id AS ride_post_id,
        rp.origin,
        rp.destination,
        rp.datetime

      FROM reviews r

      INNER JOIN users appraiser
        ON appraiser.id = r.appraiser_id

      INNER JOIN users evaluated
        ON evaluated.id = r.evaluated_id

      INNER JOIN ride_posts rp
        ON rp.id = r.ride_posts_id

      WHERE r.id = $1
      `,
      [id]
    )

    if (result.rows.length === 0) {
      return c.json(
        { error: 'Review não encontrada' },
        404
      )
    }

    return c.json(result.rows[0])
  } catch (error) {
    console.error(error)

    return c.json(
      { error: 'Erro ao buscar review' },
      500
    )
  }
}