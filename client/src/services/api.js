import axios from 'axios'

// Use environment variable in production, local proxy in development
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const getListings = async () => {
  const response = await api.get('/listings')
  return response.data
}

export const getListing = async (id) => {
  const response = await api.get(`/listings/${id}`)
  return response.data
}

export const getReviews = async (listingId) => {
  const response = await api.get(`/reviews/listing/${listingId}`)
  return response.data
}

export const submitReview = async (formData) => {
  const response = await api.post('/reviews', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response.data
}

export const deleteReview = async (reviewId) => {
  const response = await api.delete(`/reviews/${reviewId}`)
  return response.data
}

export default api

