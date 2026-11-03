import { Hono } from 'hono'

import {
  createReview,
  updateReview,
  getReviews,
  getReviewById
} from '../controllers/reviewController.js'

import { authMiddleware } from '../middlewares/authMiddleware.js'

const reviews = new Hono()

reviews.post('/', authMiddleware, createReview)
reviews.put('/:id', authMiddleware, updateReview)

reviews.get('/', authMiddleware, getReviews)
reviews.get('/:id', authMiddleware, getReviewById)

export default reviews