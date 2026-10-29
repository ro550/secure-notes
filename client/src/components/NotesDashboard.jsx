
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { notesAPI, getErrorMessage } from '../services/api';

const DEFAULT_CATEGORIES = ['General', 'Work', 'Personal', 'Ideas', 'School'];
const EMPTY_FORM = { title: '', content: '', category: 'General' };

// Delay search updates until the user stops typing 
function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function NotesDashboard() {
  const { user, logout } = useAuth();
  const [notes, setNotes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery);
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  // Trigger a fresh fetch after notes are created, updated, deleted, or pinned.
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey((k) => k + 1);

  // Load notes using the active search and category filters
  useEffect(() => {
    let ignore = false;

    (async () => {
      try {
        const params = {};
        if (selectedCategory) params.category = selectedCategory;
        if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
        const res = await notesAPI.getAll(params);
        if (!ignore) {
          setNotes(res.data.notes);
          setCategories(res.data.categories);
        }
      } catch (err) {
        if (!ignore) setError(getErrorMessage(err, 'Failed to load notes'));
      }
    })();

    return () => { ignore = true; };
  }, [selectedCategory, debouncedSearch, refreshKey]);

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setEditingNote(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingNote) {
        await notesAPI.update(editingNote.id, formData);
      } else {
        await notesAPI.create(formData);
      }
      resetForm();
      refresh();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save note'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      await notesAPI.delete(id);
      refresh();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete note'));
    }
  };

  // Toggle a note's pinned status and refresh the displayed notes.
  const handleTogglePin = async (id) => {
    try {
      await notesAPI.togglePin(id);
      refresh();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to toggle pin'));
    }
  };

  // Populate the form with the selected note's data for editing.
  const handleEdit = (note) => {
    setFormData({ title: note.title, content: note.content, category: note.category });
    setEditingNote(note);
    setShowForm(true);
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>My Notes</h1>
        <div className="user-info">
          <span>Welcome, {user.name}</span>
          <button onClick={logout}>Log Out</button>
        </div>
      </header>

      {error && <div className="error-message">{error}</div>}

      {/* Search and category controls filter the notes displayed below. */}
      <div className="toolbar">
        <input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          maxLength={100}
        />
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <button onClick={() => setShowForm(true)}>+ New Note</button>
      </div>

      {/* Reuse the same form for creating and editing notes. */}
      {showForm && (
        <form onSubmit={handleSubmit} className="note-form">
          <h2>{editingNote ? 'Edit Note' : 'New Note'}</h2>
          <input
            type="text"
            placeholder="Title"
            value={formData.title}
            maxLength={200}
            required
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          <textarea
            placeholder="Write your note here..."
            value={formData.content}
            rows={6}
            maxLength={10000}
            required
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          />
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            {DEFAULT_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="form-actions">
            <button type="submit">{editingNote ? 'Update' : 'Create'}</button>
            <button type="button" onClick={resetForm}>Cancel</button>
          </div>
        </form>
      )}

      {/* Display matching notes or an appropriate empty-state message. */}
      <div className="notes-grid">
        {notes.length === 0 ? (
          <p className="empty-state">
            {debouncedSearch || selectedCategory
              ? 'No notes match your search.'
              : 'No notes yet. Create your first note!'}
          </p>
        ) : (
          notes.map((note) => (
            <div key={note.id} className={`note-card ${note.isPinned ? 'pinned' : ''}`}>
              <div className="note-header">
                {/* Render note content as text so React escapes HTML instead of executing it. */}
                <h3>{note.title}</h3>
                <button
                  onClick={() => handleTogglePin(note.id)}
                  title={note.isPinned ? 'Unpin' : 'Pin'}
                >
                  {note.isPinned ? 'Unpin' : 'Pin'}
                </button>
              </div>
              <p className="note-content">{note.content}</p>
              <div className="note-footer">
                <span className="note-category">{note.category}</span>
                <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
              </div>
              <div className="note-actions">
                <button onClick={() => handleEdit(note)}>Edit</button>
                <button onClick={() => handleDelete(note.id)} className="delete-button">
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
