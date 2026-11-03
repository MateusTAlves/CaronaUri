import { Hono } from 'hono'
import {
  createRideAccept,
  getRideAccepts
} from '../controllers/rideAcceptController.js'

import { authMiddleware } from '../middlewares/authMiddleware.js'

const rideAccept = new Hono()

rideAccept.post('/', authMiddleware, createRideAccept)
rideAccept.get('/', authMiddleware, getRideAccepts)

export default rideAccept