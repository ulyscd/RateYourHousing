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

export const getAllReviews = async () => {
  const response = await api.get('/reviews')
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

export const voteOnReview = async (reviewId, voteType, userIdentifier) => {
  const response = await api.post(`/reviews/${reviewId}/vote`, {
    vote_type: voteType,
    user_identifier: userIdentifier
  })
  return response.data
}

export const removeVoteFromReview = async (reviewId, userIdentifier) => {
  const response = await api.delete(`/reviews/${reviewId}/vote`, {
    data: { user_identifier: userIdentifier }
  })
  return response.data
}

export const generateAISummary = async (listingId) => {
  const response = await api.post(`/listings/${listingId}/generate-summary`)
  return response.data
}

export const getAISummary = async (listingId) => {
  const response = await api.get(`/listings/${listingId}/summary`)
  return response.data
}

export default api

