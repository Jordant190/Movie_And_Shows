import { useMemo, useState } from 'react'
import { getRecommendations } from '../data/mediaDatabase'
import { usePoster } from '../hooks/usePoster'
import styles from './Recommendations.module.css'

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

function RecCard({ item, mediaType }) {
  const poster = usePoster(item.title, item.year, mediaType)

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

export default function Recommendations({ movies, shows }) {
  const [activeSection, setActiveSection] = useState('movies')
  const recs = useMemo(() => getRecommendations(movies, shows), [movies, shows])
  const total = movies.length + shows.length

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

  const noPrefs = recs.movies.length === 0 && recs.shows.length === 0

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
          <div className={styles.sectionTabs}>
            <button
              className={`${styles.sectionTab} ${activeSection === 'movies' ? styles.sectionTabActive : ''}`}
              onClick={() => setActiveSection('movies')}
            >
              Movies
              {recs.movies.length > 0 && <span className={styles.badge}>{recs.movies.length}</span>}
            </button>
            <button
              className={`${styles.sectionTab} ${activeSection === 'shows' ? styles.sectionTabActive : ''}`}
              onClick={() => setActiveSection('shows')}
            >
              Shows
              {recs.shows.length > 0 && <span className={styles.badge}>{recs.shows.length}</span>}
            </button>
          </div>

          {activeSection === 'movies' && (
            recs.movies.length > 0 ? (
              <div className={styles.grid}>
                {recs.movies.map(item => <RecCard key={item.title} item={item} mediaType="movie" />)}
              </div>
            ) : (
              <div className={styles.noRecs}>
                <p>No movie recommendations available. Try adding categories to your watched movies.</p>
              </div>
            )
          )}

          {activeSection === 'shows' && (
            recs.shows.length > 0 ? (
              <div className={styles.grid}>
                {recs.shows.map(item => <RecCard key={item.title} item={item} mediaType="show" />)}
              </div>
            ) : (
              <div className={styles.noRecs}>
                <p>No show recommendations available. Try adding categories to your watched shows.</p>
              </div>
            )
          )}
        </>
      )}
    </div>
  )
}
