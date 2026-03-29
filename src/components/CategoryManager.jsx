import { useState } from 'react'
import styles from './CategoryManager.module.css'

export default function CategoryManager({ categories, onAdd, onDelete }) {
  const [newCategory, setNewCategory] = useState('')
  const [error, setError] = useState('')

  function handleAdd(e) {
    e.preventDefault()
    const trimmed = newCategory.trim()
    if (!trimmed) return
    if (categories.map(c => c.toLowerCase()).includes(trimmed.toLowerCase())) {
      setError('Category already exists')
      return
    }
    onAdd(trimmed)
    setNewCategory('')
    setError('')
  }

  return (
    <div className={styles.manager}>
      <h3 className={styles.title}>Categories</h3>
      <div className={styles.list}>
        {categories.map(cat => (
          <div key={cat} className={styles.chip}>
            <span>{cat}</span>
            <button
              className={styles.deleteBtn}
              onClick={() => onDelete(cat)}
              title={`Remove ${cat}`}
            >
              ×
            </button>
          </div>
        ))}
        {categories.length === 0 && (
          <span className={styles.empty}>No categories yet</span>
        )}
      </div>
      <form className={styles.addForm} onSubmit={handleAdd}>
        <input
          className={styles.input}
          type="text"
          placeholder="New category..."
          value={newCategory}
          onChange={e => {
            setNewCategory(e.target.value)
            setError('')
          }}
          maxLength={30}
        />
        <button className={styles.addBtn} type="submit">Add</button>
      </form>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  )
}
