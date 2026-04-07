import { useState } from 'react'
import styles from './WatchlistForm.module.css'

const CURRENT_YEAR = new Date().getFullYear()

export default function WatchlistForm({ mode, categories, onSubmit, onClose, existing }) {
  const [title, setTitle] = useState(existing?.title || '')
  const [year, setYear] = useState(existing?.year || '')
  const [mediaType, setMediaType] = useState(existing?.mediaType || 'movie')
  const [selectedCats, setSelectedCats] = useState(existing?.categories || [])
  const [notes, setNotes] = useState(existing?.notes || '')
  const [progress, setProgress] = useState(existing?.progress || '')
  const [errors, setErrors] = useState({})

  const isWatching = mode === 'watching'

  function toggleCategory(cat) {
    setSelectedCats(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  function validate() {
    const errs = {}
    if (!title.trim()) errs.title = 'Title is required'
    if (year && (isNaN(year) || year < 1900 || year > CURRENT_YEAR + 2)) {
      errs.year = `Enter a valid year (1900–${CURRENT_YEAR + 2})`
    }
    return errs
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    onSubmit({
      id: existing?.id || crypto.randomUUID(),
      title: title.trim(),
      year: year ? Number(year) : null,
      mediaType,
      categories: selectedCats,
      notes: notes.trim(),
      progress: progress.trim(),
      dateAdded: existing?.dateAdded || new Date().toISOString(),
    })
    onClose()
  }

  const typeLabel = mediaType === 'movie' ? 'Movie' : 'Show'
  const actionLabel = isWatching ? 'Currently Watching' : 'Plan to Watch'

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>{existing ? 'Edit Entry' : `Add to ${actionLabel}`}</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>Type</label>
            <div className={styles.typeToggle}>
              <button
                type="button"
                className={`${styles.typeBtn} ${mediaType === 'movie' ? styles.typeActive : ''}`}
                onClick={() => setMediaType('movie')}
              >
                🎬 Movie
              </button>
              <button
                type="button"
                className={`${styles.typeBtn} ${mediaType === 'show' ? styles.typeActive : ''}`}
                onClick={() => setMediaType('show')}
              >
                📺 Show
              </button>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Title *</label>
            <input
              className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
              type="text"
              placeholder={`${typeLabel} title`}
              value={title}
              onChange={e => { setTitle(e.target.value); setErrors(p => ({ ...p, title: '' })) }}
              autoFocus
            />
            {errors.title && <span className={styles.error}>{errors.title}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Year</label>
            <input
              className={`${styles.input} ${styles.inputSmall} ${errors.year ? styles.inputError : ''}`}
              type="number"
              placeholder={`e.g. ${CURRENT_YEAR}`}
              value={year}
              onChange={e => { setYear(e.target.value); setErrors(p => ({ ...p, year: '' })) }}
              min={1900}
              max={CURRENT_YEAR + 2}
            />
            {errors.year && <span className={styles.error}>{errors.year}</span>}
          </div>

          {isWatching && (
            <div className={styles.field}>
              <label className={styles.label}>Progress</label>
              <input
                className={styles.input}
                type="text"
                placeholder={mediaType === 'show' ? 'e.g. Season 2 Episode 5' : 'e.g. 45 min in'}
                value={progress}
                onChange={e => setProgress(e.target.value)}
              />
            </div>
          )}

          {categories.length > 0 && (
            <div className={styles.field}>
              <label className={styles.label}>Categories</label>
              <div className={styles.catGrid}>
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    className={`${styles.catChip} ${selectedCats.includes(cat) ? styles.catSelected : ''}`}
                    onClick={() => toggleCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label}>Notes</label>
            <textarea
              className={styles.textarea}
              placeholder="Optional thoughts..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.submitBtn}>
              {existing ? 'Save Changes' : `Add ${typeLabel}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
