import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'

import auth from './routes/auth.js'
import profile from './routes/profile.js'
import rides from './routes/rides.js'
import rideAccept from './routes/rideAccept.js'
import reviews from './routes/reviews.js'

const app = new Hono()

app.use('*', cors())

app.route('/auth', auth)
app.route('/rides', rides)
app.route('/ride-accept', rideAccept)
app.route('/reviews', reviews)
app.route('/', auth)
app.route('/', profile)

// iniciar servidor
serve({
  fetch: app.fetch,
  port: 3000
})

console.log('Server running on http://localhost:3000')