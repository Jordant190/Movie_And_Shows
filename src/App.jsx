import { useState } from 'react'
import MediaTab from './components/MediaTab'
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
          </div>
        </div>
      </header>

      <nav className={styles.tabs}>
        {[
          { id: 'movies', label: 'Movies', count: movies.length },
          { id: 'shows', label: 'Shows', count: shows.length },
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
        {activeTab === 'recommendations' && (
          <Recommendations movies={movies} shows={shows} />
        )}
      </main>
    </div>
  )
}
