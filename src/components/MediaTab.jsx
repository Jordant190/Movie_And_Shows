import { useState } from 'react'
import CategoryManager from './CategoryManager'
import MediaForm from './MediaForm'
import MediaItem from './MediaItem'
import styles from './MediaTab.module.css'

const DEFAULT_CATEGORIES = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Thriller', 'Romance', 'Animation', 'Crime', 'Mystery', 'Fantasy', 'Documentary']

export default function MediaTab({ type, items, setItems, categories, setCategories }) {
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [filterCat, setFilterCat] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [search, setSearch] = useState('')

  const label = type === 'movie' ? 'Movie' : 'Show'
  const labelPlural = type === 'movie' ? 'Movies' : 'Shows'

  function handleAdd(item) {
    setItems(prev => [item, ...prev])
  }

  function handleEdit(item) {
    setItems(prev => prev.map(i => i.id === item.id ? item : i))
    setEditingItem(null)
  }

  function handleDelete(id) {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function addCategory(cat) {
    setCategories(prev => [...prev, cat])
  }

  function deleteCategory(cat) {
    setCategories(prev => prev.filter(c => c !== cat))
  }

  function openEdit(item) {
    setEditingItem(item)
  }

  // Filter & sort
  let displayed = [...items]

  if (search.trim()) {
    const q = search.toLowerCase()
    displayed = displayed.filter(i => i.title.toLowerCase().includes(q) || i.notes?.toLowerCase().includes(q))
  }

  if (filterCat !== 'all') {
    displayed = displayed.filter(i => i.categories.includes(filterCat))
  }

  displayed.sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating
    if (sortBy === 'title') return a.title.localeCompare(b.title)
    if (sortBy === 'year') return (b.year || 0) - (a.year || 0)
    // date (default)
    return new Date(b.dateAdded) - new Date(a.dateAdded)
  })

  const avgRating = items.length
    ? (items.reduce((s, i) => s + i.rating, 0) / items.length).toFixed(1)
    : null

  return (
    <div className={styles.tab}>
      {/* Stats bar */}
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{items.length}</span>
          <span className={styles.statLabel}>{labelPlural} Watched</span>
        </div>
        {avgRating && (
          <div className={styles.stat}>
            <span className={styles.statValue} style={{ color: avgRating >= 7 ? 'var(--rating-high)' : avgRating >= 5 ? 'var(--rating-mid)' : 'var(--rating-low)' }}>
              {avgRating}
            </span>
            <span className={styles.statLabel}>Avg Rating</span>
          </div>
        )}
        {items.length > 0 && (
          <div className={styles.stat}>
            <span className={styles.statValue}>{items.filter(i => i.rating >= 8).length}</span>
            <span className={styles.statLabel}>Highly Rated (8+)</span>
          </div>
        )}
      </div>

      {/* Category manager toggle */}
      <button
        className={styles.catToggle}
        onClick={() => setShowCategoryManager(p => !p)}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
        {showCategoryManager ? 'Hide' : 'Manage'} Categories
      </button>

      {showCategoryManager && (
        <CategoryManager
          categories={categories}
          onAdd={addCategory}
          onDelete={deleteCategory}
        />
      )}

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <input
          className={styles.search}
          type="text"
          placeholder={`Search ${labelPlural.toLowerCase()}...`}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className={styles.select}
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select
          className={styles.select}
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
        >
          <option value="date">Sort: Recent</option>
          <option value="rating">Sort: Rating</option>
          <option value="title">Sort: Title</option>
          <option value="year">Sort: Year</option>
        </select>
        <button className={styles.addBtn} onClick={() => setShowForm(true)}>
          + Add {label}
        </button>
      </div>

      {/* List */}
      {displayed.length > 0 ? (
        <div className={styles.list}>
          {displayed.map(item => (
            <MediaItem
              key={item.id}
              item={item}
              onDelete={handleDelete}
              onEdit={openEdit}
            />
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          {items.length === 0 ? (
            <>
              <div className={styles.emptyIcon}>{type === 'movie' ? '🎬' : '📺'}</div>
              <p className={styles.emptyTitle}>No {labelPlural} Yet</p>
              <p className={styles.emptyText}>Start tracking by adding your first {label.toLowerCase()}.</p>
              <button className={styles.addBtn} onClick={() => setShowForm(true)}>
                + Add {label}
              </button>
            </>
          ) : (
            <>
              <p className={styles.emptyTitle}>No Results</p>
              <p className={styles.emptyText}>Try adjusting your filters.</p>
            </>
          )}
        </div>
      )}

      {(showForm || editingItem) && (
        <MediaForm
          type={type}
          categories={categories}
          existing={editingItem}
          onSubmit={editingItem ? handleEdit : handleAdd}
          onClose={() => { setShowForm(false); setEditingItem(null) }}
        />
      )}
    </div>
  )
}
