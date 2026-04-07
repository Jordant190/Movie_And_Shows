import { useState } from 'react'
import MediaTab from './components/MediaTab'
import WatchlistTab from './components/WatchlistTab'
import Recommendations from './components/Recommendations'
import { useLocalStorage } from './hooks/useLocalStorage'
import styles from './App.module.css'

const DEFAULT_CATEGORIES = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Thriller', 'Romance', 'Animation', 'Crime', 'Mystery', 'Fantasy', 'Documentary']

export default function App() {
  const [activeTab, setActiveTab] = useState('movies')

  const [movies, setMovies] = useLocalStorage('mediaTracker_movies', [])
  const [shows, setShows] = useLocalStorage('mediaTracker_shows', [])
  const [movieCategories, setMovieCategories] = useLocalStorage('mediaTracker_movieCategories', [...DEFAULT_CATEGORIES])
  const [showCategories, setShowCategories] = useLocalStorage('mediaTracker_showCategories', [...DEFAULT_CATEGORIES])

  const [watchlist, setWatchlist] = useLocalStorage('mediaTracker_watchlist', [])
  const [watching, setWatching] = useLocalStorage('mediaTracker_watching', [])
  const [watchlistCategories, setWatchlistCategories] = useLocalStorage('mediaTracker_watchlistCategories', [...DEFAULT_CATEGORIES])

  function moveToWatching(item) {
    setWatchlist(prev => prev.filter(i => i.id !== item.id))
    setWatching(prev => [item, ...prev])
  }

  function moveToWatched(watchingItem, ratedItem) {
    setWatching(prev => prev.filter(i => i.id !== watchingItem.id))
    if (watchingItem.mediaType === 'movie') {
      setMovies(prev => [ratedItem, ...prev])
    } else {
      setShows(prev => [ratedItem, ...prev])
    }
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>🎬</span>
            <div>
              <h1 className={styles.appName}>Media Tracker</h1>
              <p className={styles.appTagline}>Track, rate & discover</p>
            </div>
          </div>
          <div className={styles.headerStats}>
            <span className={styles.headerStat}>{movies.length} movies</span>
            <span className={styles.headerStatDot}>·</span>
            <span className={styles.headerStat}>{shows.length} shows</span>
            {watchlist.length > 0 && (
              <>
                <span className={styles.headerStatDot}>·</span>
                <span className={styles.headerStat}>{watchlist.length} planned</span>
              </>
            )}
            {watching.length > 0 && (
              <>
                <span className={styles.headerStatDot}>·</span>
                <span className={styles.headerStat}>{watching.length} watching</span>
              </>
            )}
          </div>
        </div>
      </header>

      <nav className={styles.tabs}>
        {[
          { id: 'movies', label: 'Movies', count: movies.length },
          { id: 'shows', label: 'Shows', count: shows.length },
          { id: 'watchlist', label: 'Plan to Watch', count: watchlist.length },
          { id: 'watching', label: 'Watching', count: watching.length },
          { id: 'recommendations', label: 'Recommendations', count: null },
        ].map(tab => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.count !== null && tab.count > 0 && (
              <span className={styles.tabCount}>{tab.count}</span>
            )}
          </button>
        ))}
      </nav>

      <main className={styles.main}>
        {activeTab === 'movies' && (
          <MediaTab
            type="movie"
            items={movies}
            setItems={setMovies}
            categories={movieCategories}
            setCategories={setMovieCategories}
          />
        )}
        {activeTab === 'shows' && (
          <MediaTab
            type="show"
            items={shows}
            setItems={setShows}
            categories={showCategories}
            setCategories={setShowCategories}
          />
        )}
        {activeTab === 'watchlist' && (
          <WatchlistTab
            mode="plan"
            items={watchlist}
            setItems={setWatchlist}
            categories={watchlistCategories}
            setCategories={setWatchlistCategories}
            onMoveToWatching={moveToWatching}
            movieCategories={movieCategories}
            showCategories={showCategories}
          />
        )}
        {activeTab === 'watching' && (
          <WatchlistTab
            mode="watching"
            items={watching}
            setItems={setWatching}
            categories={watchlistCategories}
            setCategories={setWatchlistCategories}
            onMoveToWatched={moveToWatched}
            movieCategories={movieCategories}
            showCategories={showCategories}
          />
        )}
        {activeTab === 'recommendations' && (
          <Recommendations movies={movies} shows={shows} />
        )}
      </main>
    </div>
  )
}
