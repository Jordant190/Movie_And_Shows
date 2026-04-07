const API_KEY = import.meta.env.VITE_TMDB_API_KEY
const BASE_URL = 'https://api.themoviedb.org/3'
export const IMAGE_BASE = 'https://image.tmdb.org/t/p'

// In-memory cache to avoid duplicate requests
const cache = new Map()

export async function fetchPoster(title, year, mediaType = 'movie') {
  if (!API_KEY) return null

  const tmdbType = mediaType === 'show' ? 'tv' : 'movie'
  const cacheKey = `${tmdbType}:${title}:${year}`

  if (cache.has(cacheKey)) return cache.get(cacheKey)

  // Set a pending promise so concurrent requests for the same item share the result
  const pending = (async () => {
    try {
      const yearParam = year
        ? tmdbType === 'movie' ? `&year=${year}` : `&first_air_date_year=${year}`
        : ''
      const url = `${BASE_URL}/search/${tmdbType}?api_key=${API_KEY}&query=${encodeURIComponent(title)}${yearParam}`
      const res = await fetch(url)
      if (!res.ok) return null
      const data = await res.json()
      const posterPath = data.results?.[0]?.poster_path ?? null
      return posterPath ? `${IMAGE_BASE}/w185${posterPath}` : null
    } catch {
      return null
    }
  })()

  cache.set(cacheKey, pending)
  const result = await pending
  cache.set(cacheKey, result)
  return result
}
