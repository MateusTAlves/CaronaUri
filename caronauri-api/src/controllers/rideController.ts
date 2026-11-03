import { db } from '../db/client.js'
import type { Context } from 'hono'

export const createRide = async (c: Context) => {
  try {

    const body = await c.req.json()

    // pega do token
    const user = c.get('user') as { user_id: number }

    const user_id = user.user_id

    const {
      destination_campus,
      origin_lat,
      origin_lng,
      departure_time,
      observations,
      is_offer
    } = body

    // validação básica
    if (
      !destination_campus ||
      !origin_lat ||
      !origin_lng ||
      !departure_time ||
      is_offer === undefined
    ) {
      return c.json({
        error: 'Missing required fields'
      }, 400)
    }

    const result = await db.query(
      `INSERT INTO ride_posts (
        user_id,
        destination_campus,
        origin_lat,
        origin_lng,
        departure_time,
        observations,
        is_offer
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *`,
      [
        user_id,
        destination_campus,
        origin_lat,
        origin_lng,
        departure_time,
        observations,
        is_offer
      ]
    )

    return c.json({
      message: 'Ride created successfully',
      ride: result.rows[0]
    })

  } catch (error) {

    console.error(error)

    return c.json({
      error: 'Internal server error'
    }, 500)

  }
}

export const getRides = async (c: Context) => {
  try {

    // pega do token
    const user = c.get('user') as { user_id: number }

    const user_id = user.user_id

    const result = await db.query(`
      SELECT
          rp.id,
          rp.destination_campus,
          rp.origin_lat,
          rp.origin_lng,
          rp.departure_time,
          rp.observations,
          rp.is_offer,
          rp.created_at,

          u.name,
          u.email,

          ra.status as accept_status

      FROM ride_posts rp

      JOIN users u 
          ON u.id = rp.user_id

      LEFT JOIN ride_accept ra
          ON ra.id_ride_posts = rp.id
          AND ra.user_id = $1
          AND ra.status = 'accepted'
        
      WHERE rp.status != 'COMPLETE'

      ORDER BY
          CASE
              WHEN ra.status = 'accepted' THEN 0
              ELSE 1
          END,
          rp.created_at DESC

    `, [user_id]);

    return c.json({
      rides: result.rows
    })

  } catch (error) {

    console.error(error)

    return c.json({
      error: 'Internal server error'
    }, 500)

  }
}

export const getRideById = async (c: Context) => {
  try {

    const id = c.req.param('id')

    const result = await db.query(`
      SELECT
        rp.id,
        rp.destination_campus,
        rp.origin_lat,
        rp.origin_lng,
        rp.departure_time,
        rp.observations,
        rp.is_offer,
        rp.created_at,

        u.name,
        u.email,
        u.whatsapp

      FROM ride_posts rp
      JOIN users u ON u.id = rp.user_id
      WHERE rp.id = $1
    `, [id])

    if (result.rows.length === 0) {
        return c.json({
          error: 'Ride not found'
        }, 404)
      }

    return c.json({
      ride: result.rows[0]
    })

  } catch (error) {

    console.error(error)

    return c.json({
      error: 'Internal server error'
    }, 500)

  }
}

export const completeRide = async (c: Context) => {
  const client = await db.connect()

  try {
    const rideId = Number(c.req.param('id'))

    if (!rideId) {
      return c.json(
        {
          error: 'Invalid ride id'
        },
        400
      )
    }

    // usuário logado
    const user = c.get('user') as { user_id: number }

    if (!user?.user_id) {
      return c.json(
        {
          error: 'Unauthorized'
        },
        401
      )
    }

    const user_id = Number(user.user_id)

    await client.query('BEGIN')

    // Atualiza aceite do usuário logado
    const acceptResult = await client.query(
      `
      UPDATE ride_accept
      SET status = 'complete'
      WHERE id_ride_posts = $1
      AND user_id = $2
      RETURNING *
      `,
      [rideId, user_id]
    )

    if (acceptResult.rows.length === 0) {
      await client.query('ROLLBACK')

      return c.json(
        {
          error: 'Ride not found or user did not accept this ride'
        },
        404
      )
    }

    // Busca corrida
    const rideResult = await client.query(
      `
      SELECT *
      FROM ride_posts
      WHERE id = $1
      LIMIT 1
      `,
      [rideId]
    )

    if (rideResult.rows.length === 0) {
      await client.query('ROLLBACK')

      return c.json(
        {
          error: 'Ride not found'
        },
        404
      )
    }

    const ride = rideResult.rows[0]

    // Atualiza status da corrida
    const updatedRideResult = await client.query(
      `
      UPDATE ride_posts
      SET status = 'COMPLETE'
      WHERE id = $1
      RETURNING *
      `,
      [rideId]
    )

    let evaluated_id: number | null = null

    // Se for dono do post -> avalia passageiro
    if (Number(ride.user_id) === user_id) {
      const passengerResult = await client.query(
        `
        SELECT user_id
        FROM ride_accept
        WHERE id_ride_posts = $1
        AND status IN ('accepted', 'complete')
        LIMIT 1
        `,
        [rideId]
      )

      evaluated_id =
        passengerResult.rows.length > 0
          ? Number(passengerResult.rows[0].user_id)
          : null
    } else {
      // Passageiro avalia dono do post
      evaluated_id = Number(ride.user_id)
    }

    console.log('Review data:', {
      rideId,
      user_id,
      rideOwner: ride.user_id,
      evaluated_id
    })

    // Cria review apenas se encontrou alguém para avaliar
    if (evaluated_id) {
      // evita duplicar review
      const existingReview = await client.query(
        `
        SELECT id
        FROM reviews
        WHERE appraiser_id = $1
        AND evalueted_id = $2
        AND ride_posts_id = $3
        LIMIT 1
        `,
        [user_id, evaluated_id, rideId]
      )

      if (existingReview.rows.length === 0) {
        await client.query(
          `
          INSERT INTO reviews (
            appraiser_id,
            evalueted_id,
            ride_posts_id
          )
          VALUES ($1, $2, $3)
          `,
          [user_id, evaluated_id, rideId]
        )
      }
    }

    await client.query('COMMIT')

    return c.json({
      message: 'Ride marked as complete',
      ride: updatedRideResult.rows[0],
      acceptance: acceptResult.rows[0],
      evaluated_id
    })
  } catch (error: any) {
    await client.query('ROLLBACK')

    console.error('completeRide error:', error)

    return c.json(
      {
        error: 'Internal server error',
        details: error.message
      },
      500
    )
  } finally {
    client.release()
  }
}