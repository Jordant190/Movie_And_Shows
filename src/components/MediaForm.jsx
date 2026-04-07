import { useState } from 'react'
import styles from './MediaForm.module.css'

const CURRENT_YEAR = new Date().getFullYear()

export default function MediaForm({ type, categories, onSubmit, onClose, existing }) {
  const [title, setTitle] = useState(existing?.title || '')
  const [year, setYear] = useState(existing?.year || '')
  const [selectedCats, setSelectedCats] = useState(existing?.categories || [])
  const [rating, setRating] = useState(existing?.rating || 7)
  const [notes, setNotes] = useState(existing?.notes || '')
  const [errors, setErrors] = useState({})

  const label = type === 'movie' ? 'Movie' : 'Show'

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
      categories: selectedCats,
      rating: Number(rating),
      notes: notes.trim(),
      dateAdded: existing?.dateAdded || new Date().toISOString(),
    })
    onClose()
  }

  function getRatingColor(r) {
    if (r >= 8) return 'var(--rating-high)'
    if (r >= 5) return 'var(--rating-mid)'
    return 'var(--rating-low)'
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>{existing ? `Edit ${label}` : `Add ${label}`}</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>Title *</label>
            <input
              className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
              type="text"
              placeholder={`${label} title`}
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

          <div className={styles.field}>
            <label className={styles.label}>
              Rating: <span style={{ color: getRatingColor(rating), fontWeight: 700, fontSize: '1.1rem' }}>{rating}</span>
              <span className={styles.ratingLabel}>/10</span>
            </label>
            <div className={styles.ratingRow}>
              <span className={styles.ratingMin}>1</span>
              <input
                className={styles.slider}
                type="range"
                min={1}
                max={10}
                step={1}
                value={rating}
                onChange={e => setRating(e.target.value)}
                style={{ '--rating-color': getRatingColor(rating) }}
              />
              <span className={styles.ratingMax}>10</span>
            </div>
          </div>

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
              {existing ? 'Save Changes' : `Add ${label}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
