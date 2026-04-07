import { useState, useEffect } from 'react'
import { fetchPoster } from '../services/tmdb'

// Returns: undefined = loading, null = not found, string = poster URL
export function usePoster(title, year, mediaType = 'movie') {
  const [posterUrl, setPosterUrl] = useState(undefined)

  useEffect(() => {
    let cancelled = false
    setPosterUrl(undefined)
    fetchPoster(title, year, mediaType).then(url => {
      if (!cancelled) setPosterUrl(url)
    })
    return () => { cancelled = true }
  }, [title, year, mediaType])

  return posterUrl
}
