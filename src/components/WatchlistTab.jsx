import { useState } from 'react'
import CategoryManager from './CategoryManager'
import WatchlistForm from './WatchlistForm'
import WatchlistItem from './WatchlistItem'
import MediaForm from './MediaForm'
import styles from './WatchlistTab.module.css'

export default function WatchlistTab({
  mode,
  items,
  setItems,
  categories,
  setCategories,
  onMoveToWatching,
  onMoveToWatched,
  movieCategories,
  showCategories,
}) {
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [filterCat, setFilterCat] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [search, setSearch] = useState('')
  const [markingWatched, setMarkingWatched] = useState(null)

  const isPlan = mode === 'plan'

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

  function handleWatchedRated(ratedItem) {
    onMoveToWatched(markingWatched, ratedItem)
    setMarkingWatched(null)
  }

  // Filter & sort
  let displayed = [...items]

  if (search.trim()) {
    const q = search.toLowerCase()
    displayed = displayed.filter(i =>
      i.title.toLowerCase().includes(q) || i.notes?.toLowerCase().includes(q)
    )
  }

  if (filterType !== 'all') {
    displayed = displayed.filter(i => i.mediaType === filterType)
  }

  if (filterCat !== 'all') {
    displayed = displayed.filter(i => i.categories.includes(filterCat))
  }

  displayed.sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title)
    if (sortBy === 'year') return (b.year || 0) - (a.year || 0)
    return new Date(b.dateAdded) - new Date(a.dateAdded)
  })

  const movieCount = items.filter(i => i.mediaType === 'movie').length
  const showCount = items.filter(i => i.mediaType === 'show').length

  return (
    <div className={styles.tab}>
      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{items.length}</span>
          <span className={styles.statLabel}>Total</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{movieCount}</span>
          <span className={styles.statLabel}>Movies</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{showCount}</span>
          <span className={styles.statLabel}>Shows</span>
        </div>
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
          onAdd={cat => setCategories(prev => [...prev, cat])}
          onDelete={cat => setCategories(prev => prev.filter(c => c !== cat))}
        />
      )}

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <input
          className={styles.search}
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className={styles.select}
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="movie">Movies</option>
          <option value="show">Shows</option>
        </select>
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
          <option value="title">Sort: Title</option>
          <option value="year">Sort: Year</option>
        </select>
        <button className={styles.addBtn} onClick={() => setShowForm(true)}>
          + Add
        </button>
      </div>

      {/* List */}
      {displayed.length > 0 ? (
        <div className={styles.list}>
          {displayed.map(item => (
            <WatchlistItem
              key={item.id}
              item={item}
              onDelete={handleDelete}
              onEdit={setEditingItem}
              onMoveToWatching={isPlan ? onMoveToWatching : undefined}
              onMarkAsWatched={!isPlan ? setMarkingWatched : undefined}
            />
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          {items.length === 0 ? (
            <>
              <div className={styles.emptyIcon}>{isPlan ? '📋' : '▶️'}</div>
              <p className={styles.emptyTitle}>
                {isPlan ? 'Nothing Planned Yet' : 'Not Watching Anything'}
              </p>
              <p className={styles.emptyText}>
                {isPlan
                  ? 'Add movies and shows you want to watch.'
                  : 'Move something from your watchlist or add directly.'}
              </p>
              <button className={styles.addBtn} onClick={() => setShowForm(true)}>
                + Add
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
        <WatchlistForm
          mode={mode}
          categories={categories}
          existing={editingItem}
          onSubmit={editingItem ? handleEdit : handleAdd}
          onClose={() => { setShowForm(false); setEditingItem(null) }}
        />
      )}

      {markingWatched && (
        <MediaForm
          type={markingWatched.mediaType}
          categories={markingWatched.mediaType === 'movie' ? movieCategories : showCategories}
          existing={{
            title: markingWatched.title,
            year: markingWatched.year,
            categories: markingWatched.categories,
            notes: markingWatched.notes,
          }}
          onSubmit={handleWatchedRated}
          onClose={() => setMarkingWatched(null)}
        />
      )}
    </div>
  )
}
