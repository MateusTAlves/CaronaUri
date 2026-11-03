import { Hono } from 'hono'
import { getProfile, updateProfile } from '../controllers/ProfileController.js'

const profile = new Hono()

profile.get('/profile', getProfile)
profile.patch('/profile', updateProfile)

export default profile