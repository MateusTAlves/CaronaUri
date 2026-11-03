import { Hono } from 'hono'
import { register } from '../controllers/authController.js'
import { login } from '../controllers/authController.js'

const auth = new Hono()

auth.post('/register', register)
auth.post('/login', login)

export default auth