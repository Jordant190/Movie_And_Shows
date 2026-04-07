import { useMemo, useState } from 'react'
import { getRecommendations } from '../data/mediaDatabase'
import { usePoster } from '../hooks/usePoster'
import MediaForm from './MediaForm'
import styles from './Recommendations.module.css'

function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function ScoreBar({ score }) {
  const pct = ((score - 1) / 9) * 100
  let color = 'var(--rating-low)'
  if (score >= 8) color = 'var(--rating-high)'
  else if (score >= 5) color = 'var(--rating-mid)'

  return (
    <div className={styles.scoreBar}>
      <div className={styles.scoreBarFill} style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

function AddedBadge({ label }) {
  return <span className={styles.addedBadge}>{label}</span>
}

function RecCard({ item, mediaType, addedStatus, onAddToPlan, onAddToWatching, onAddAsWatched }) {
  const poster = usePoster(item.title, item.year, mediaType)
  const [open, setOpen] = useState(false)

  return (
    <div className={styles.card}>
      {poster && (
        <img
          className={styles.cardPoster}
          src={poster}
          alt={`${item.title} poster`}
          loading="lazy"
        />
      )}
      <div className={styles.cardTop}>
        <div>
          <div className={styles.cardTitle}>{item.title}</div>
          {item.year && <div className={styles.cardYear}>{item.year}</div>}
        </div>
        <div className={styles.scoreDisplay}>
          <span className={styles.scoreValue}
            style={{ color: item.score >= 8 ? 'var(--rating-high)' : item.score >= 5 ? 'var(--rating-mid)' : 'var(--rating-low)' }}>
            {item.score}
          </span>
          <span className={styles.scoreDenom}>/10</span>
        </div>
      </div>
      <ScoreBar score={item.score} />
      <div className={styles.cardMeta}>
        <div className={styles.genres}>
          {item.genres.map(g => (
            <span key={g} className={`${styles.genre} ${item.matchReasons.includes(g) ? styles.genreMatch : ''}`}>
              {g}
            </span>
          ))}
        </div>
        {item.matchReasons.length > 0 && (
          <div className={styles.reason}>
            Because you liked: <strong>{item.matchReasons.join(', ')}</strong>
          </div>
        )}
      </div>

      <div className={styles.cardActions}>
        {addedStatus ? (
          <AddedBadge label={addedStatus} />
        ) : (
          <div className={styles.addDropdown}>
            <button
              className={styles.addBtn}
              onClick={() => setOpen(o => !o)}
            >
              + Add to List
            </button>
            {open && (
              <div className={styles.dropdownMenu}>
                <button className={styles.dropdownItem} onClick={() => { onAddToPlan(); setOpen(false) }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                  </svg>
                  Plan to Watch
                </button>
                <button className={styles.dropdownItem} onClick={() => { onAddToWatching(); setOpen(false) }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  Currently Watching
                </button>
                <button className={styles.dropdownItem} onClick={() => { onAddAsWatched(); setOpen(false) }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Mark as Watched
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function PreferenceProfile({ items, label }) {
  if (items.length === 0) return null

  const catRatings = {}
  items.forEach(item => {
    ;(item.categories || []).forEach(cat => {
      if (!catRatings[cat]) catRatings[cat] = []
      catRatings[cat].push(item.rating)
    })
  })

  const profile = Object.entries(catRatings)
    .map(([cat, ratings]) => ({
      cat,
      avg: ratings.reduce((a, b) => a + b, 0) / ratings.length,
      count: ratings.length,
    }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 6)

  if (profile.length === 0) return null

  return (
    <div className={styles.profile}>
      <h4 className={styles.profileTitle}>Your {label} Preferences</h4>
      <div className={styles.profileList}>
        {profile.map(({ cat, avg, count }) => (
          <div key={cat} className={styles.profileRow}>
            <div className={styles.profileLeft}>
              <span className={styles.profileCat}>{cat}</span>
              <span className={styles.profileCount}>{count} {count === 1 ? 'title' : 'titles'}</span>
            </div>
            <div className={styles.profileRight}>
              <div className={styles.profileBarWrap}>
                <div
                  className={styles.profileBarFill}
                  style={{
                    width: `${(avg / 10) * 100}%`,
                    background: avg >= 8 ? 'var(--rating-high)' : avg >= 5 ? 'var(--rating-mid)' : 'var(--rating-low)'
                  }}
                />
              </div>
              <span className={styles.profileAvg}>{avg.toFixed(1)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Recommendations({
  movies, shows,
  watchlist, watching,
  onAddToPlan, onAddToWatching, onAddAsWatched,
  movieCategories, showCategories,
}) {
  const [activeSection, setActiveSection] = useState('movies')
  const [pendingWatched, setPendingWatched] = useState(null)
  const [refreshNonce, setRefreshNonce] = useState(0)
  const [selectedGenre, setSelectedGenre] = useState(null)

  const allRecs = useMemo(() => getRecommendations(movies, shows), [movies, shows])

  // Shuffle the full scored list each time source data changes or user refreshes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const displayed = useMemo(() => ({
    movies: shuffleArray(allRecs.movies).slice(0, 15),
    shows: shuffleArray(allRecs.shows).slice(0, 15),
  }), [allRecs, refreshNonce])

  const total = movies.length + shows.length
  const mediaType = activeSection === 'movies' ? 'movie' : 'show'

  const availableGenres = useMemo(() => {
    const source = activeSection === 'movies' ? displayed.movies : displayed.shows
    const genreSet = new Set()
    source.forEach(item => item.genres.forEach(g => genreSet.add(g)))
    return [...genreSet].sort()
  }, [displayed, activeSection])

  const currentItems = activeSection === 'movies' ? displayed.movies : displayed.shows
  const filteredItems = selectedGenre
    ? currentItems.filter(item => item.genres.includes(selectedGenre))
    : currentItems

  function handleSectionChange(section) {
    setActiveSection(section)
    setSelectedGenre(null)
  }

  function handleRefresh() {
    setRefreshNonce(n => n + 1)
    setSelectedGenre(null)
  }

  function getAddedStatus(title, type) {
    const t = title.toLowerCase()
    if (type === 'movie' && movies.some(i => i.title.toLowerCase() === t)) return 'Watched'
    if (type === 'show' && shows.some(i => i.title.toLowerCase() === t)) return 'Watched'
    if (watchlist.some(i => i.title.toLowerCase() === t && i.mediaType === type)) return 'Plan to Watch'
    if (watching.some(i => i.title.toLowerCase() === t && i.mediaType === type)) return 'Watching'
    return null
  }

  if (total === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>✨</div>
        <p className={styles.emptyTitle}>No Recommendations Yet</p>
        <p className={styles.emptyText}>
          Add some movies and shows with ratings to get personalized recommendations based on what you love.
        </p>
      </div>
    )
  }

  const noPrefs = allRecs.movies.length === 0 && allRecs.shows.length === 0

  return (
    <div className={styles.container}>
      <div className={styles.heading}>
        <h2 className={styles.headingTitle}>Personalized Recommendations</h2>
        <p className={styles.headingSubtitle}>
          Based on your {total} watched title{total !== 1 ? 's' : ''} and ratings
        </p>
      </div>

      <div className={styles.profiles}>
        <PreferenceProfile items={movies} label="Movie" />
        <PreferenceProfile items={shows} label="Show" />
      </div>

      {noPrefs ? (
        <div className={styles.noPrefs}>
          <p>Add categories to your watched movies and shows to get tailored recommendations.</p>
        </div>
      ) : (
        <>
          <div className={styles.tabsRow}>
            <div className={styles.sectionTabs}>
              <button
                className={`${styles.sectionTab} ${activeSection === 'movies' ? styles.sectionTabActive : ''}`}
                onClick={() => handleSectionChange('movies')}
              >
                Movies
                {displayed.movies.length > 0 && <span className={styles.badge}>{displayed.movies.length}</span>}
              </button>
              <button
                className={`${styles.sectionTab} ${activeSection === 'shows' ? styles.sectionTabActive : ''}`}
                onClick={() => handleSectionChange('shows')}
              >
                Shows
                {displayed.shows.length > 0 && <span className={styles.badge}>{displayed.shows.length}</span>}
              </button>
            </div>
            <button className={styles.refreshBtn} onClick={handleRefresh} title="Shuffle recommendations">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"/>
                <polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              Refresh
            </button>
          </div>

          {availableGenres.length > 0 && (
            <div className={styles.genreFilters}>
              <button
                className={`${styles.genreChip} ${selectedGenre === null ? styles.genreChipActive : ''}`}
                onClick={() => setSelectedGenre(null)}
              >
                All
              </button>
              {availableGenres.map(genre => (
                <button
                  key={genre}
                  className={`${styles.genreChip} ${selectedGenre === genre ? styles.genreChipActive : ''}`}
                  onClick={() => setSelectedGenre(g => g === genre ? null : genre)}
                >
                  {genre}
                </button>
              ))}
            </div>
          )}

          {filteredItems.length > 0 ? (
            <div className={styles.grid}>
              {filteredItems.map(item => (
                <RecCard
                  key={item.title}
                  item={item}
                  mediaType={mediaType}
                  addedStatus={getAddedStatus(item.title, mediaType)}
                  onAddToPlan={() => onAddToPlan(item, mediaType)}
                  onAddToWatching={() => onAddToWatching(item, mediaType)}
                  onAddAsWatched={() => setPendingWatched({ rec: item, mediaType })}
                />
              ))}
            </div>
          ) : (
            <div className={styles.noRecs}>
              {selectedGenre ? (
                <p>No {activeSection} recommendations for <strong>{selectedGenre}</strong>. Try a different category or <button className={styles.clearFilter} onClick={() => setSelectedGenre(null)}>clear the filter</button>.</p>
              ) : (
                <p>No {activeSection} recommendations available. Try adding categories to your watched {activeSection}.</p>
              )}
            </div>
          )}
        </>
      )}

      {pendingWatched && (
        <MediaForm
          type={pendingWatched.mediaType}
          categories={pendingWatched.mediaType === 'movie' ? movieCategories : showCategories}
          existing={{
            title: pendingWatched.rec.title,
            year: pendingWatched.rec.year,
            categories: pendingWatched.rec.genres,
            notes: '',
          }}
          onSubmit={ratedItem => {
            onAddAsWatched(ratedItem, pendingWatched.mediaType)
            setPendingWatched(null)
          }}
          onClose={() => setPendingWatched(null)}
        />
      )}
    </div>
  )
}
