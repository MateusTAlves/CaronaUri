import { Hono } from 'hono'
import { createRide, getRides, getRideById, completeRide } from '../controllers/rideController.js'
import { authMiddleware } from '../middlewares/authMiddleware.js'

const rides = new Hono()

rides.post('/', authMiddleware, createRide)
rides.get('/', authMiddleware, getRides)
rides.get('/:id', authMiddleware, getRideById)

rides.post('/:id/complete', authMiddleware, completeRide)

export default rides