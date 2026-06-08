import api from './api'

export const saveGame = (data) => api.post('/games', data)
export const getGames = (params) => api.get('/games', { params })
export const getStats = () => api.get('/games/stats')
export const getGame = (id) => api.get(`/games/${id}`)
export const deleteGame = (id) => api.delete(`/games/${id}`)

export const updateGame = (id, data) => api.patch(`/games/${id}`, data)
