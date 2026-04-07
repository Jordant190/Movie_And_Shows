import { usePoster } from '../hooks/usePoster'
import styles from './MediaItem.module.css'

function RatingBadge({ rating }) {
  let cls = styles.ratingLow
  if (rating >= 8) cls = styles.ratingHigh
  else if (rating >= 5) cls = styles.ratingMid
  return <span className={`${styles.rating} ${cls}`}>{rating}<span className={styles.ratingDenom}>/10</span></span>
}

function PosterThumb({ title, year, mediaType }) {
  const poster = usePoster(title, year, mediaType)
  if (!poster) return null
  return (
    <img
      className={styles.poster}
      src={poster}
      alt={`${title} poster`}
      loading="lazy"
    />
  )
}

export default function MediaItem({ item, type, onDelete, onEdit }) {
  return (
    <div className={styles.item}>
      <PosterThumb title={item.title} year={item.year} mediaType={type} />
      <div className={styles.left}>
        <div className={styles.titleRow}>
          <span className={styles.title}>{item.title}</span>
          {item.year && <span className={styles.year}>{item.year}</span>}
        </div>
        {item.categories.length > 0 && (
          <div className={styles.cats}>
            {item.categories.map(cat => (
              <span key={cat} className={styles.cat}>{cat}</span>
            ))}
          </div>
        )}
        {item.notes && <p className={styles.notes}>{item.notes}</p>}
        <span className={styles.date}>
          Added {new Date(item.dateAdded).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </div>
      <div className={styles.right}>
        <RatingBadge rating={item.rating} />
        <div className={styles.actions}>
          <button className={styles.editBtn} onClick={() => onEdit(item)} title="Edit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button className={styles.deleteBtn} onClick={() => onDelete(item.id)} title="Delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
