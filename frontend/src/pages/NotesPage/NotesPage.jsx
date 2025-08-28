import { useEffect, useMemo, useState } from 'react';
import * as noteService from '../../services/noteService';

export default function NotesPage() {
    const [notes, setNotes] = useState([]);
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // editing state
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editBody, setEditBody] = useState('');

    // search
    const [query, setQuery] = useState('');

    async function load() {
        setLoading(true); setError('');
        try {
            const data = await noteService.index();
            setNotes(data);
        } catch (e) {
            setError(e.message);
        } finally { setLoading(false); }
    }

    useEffect(() => { load(); }, []);

    async function handleCreate(e) {
        e.preventDefault();
        if (!title.trim()) return;
        try {
            const created = await noteService.create({ title: title.trim(), body: body.trim() });
            setNotes(prev => [created, ...prev]);
            setTitle(''); setBody('');
        } catch (e) { setError(e.message); }
    }

    async function handleDelete(id) {
        const ok = window.confirm('Delete this note?');
        if (!ok) return;
        try {
            await noteService.remove(id);
            setNotes(prev => prev.filter(n => n._id !== id));
            if (editingId === id) cancelEdit();
        } catch (e) { setError(e.message); }
    }

    function startEdit(n) {
        setEditingId(n._id);
        setEditTitle(n.title);
        setEditBody(n.body || '');
    }

    function cancelEdit() {
        setEditingId(null);
        setEditTitle('');
        setEditBody('');
    }

    async function saveEdit(id) {
        if (!editTitle.trim()) return;
        try {
            const updated = await noteService.update(id, {
                title: editTitle.trim(),
                body: editBody.trim(),
            });
            setNotes(prev => prev.map(n => (n._id === id ? updated : n)));
            cancelEdit();
        } catch (e) { setError(e.message); }
    }

    const visibleNotes = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return notes;
        return notes.filter(n =>
            n.title.toLowerCase().includes(q) || (n.body || '').toLowerCase().includes(q)
        );
    }, [notes, query]);

    return (
        <section className="stack" style={{ padding: '1rem 0 2rem' }}>
            <div className="card">
                <h2>Add Note</h2>
                <form className="stack" onSubmit={handleCreate}>
                    <input
                        placeholder="Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        maxLength={80}
                    />
                    <textarea
                        placeholder="Body (optional)"
                        rows={4}
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        maxLength={2000}
                    />
                    <div>
                        <button className="primary" type="submit">Save</button>
                    </div>
                    {error && <p className="muted" style={{ color: '#b91c1c' }}>{error}</p>}
                </form>
            </div>

            <div className="stack">
                <div className="toolbar">
                    <h2 style={{ margin: 0 }}>Notes</h2>
                    <input
                        className="search"
                        type="search"
                        placeholder="Search notes…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>

                {loading && <div className="card">Loading…</div>}
                {!loading && visibleNotes.length === 0 && <div className="card">No notes yet</div>}

                <ul className="stack" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {visibleNotes.map((n) => (
                        <li key={n._id} className="card">
                            {editingId === n._id ? (
                                <div className="stack">
                                    <input
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        maxLength={80}
                                        required
                                    />
                                    <textarea
                                        rows={4}
                                        value={editBody}
                                        onChange={(e) => setEditBody(e.target.value)}
                                        maxLength={2000}
                                    />
                                    <div style={{ display: 'flex', gap: '.5rem' }}>
                                        <button className="primary" onClick={() => saveEdit(n._id)} type="button">
                                            Save
                                        </button>
                                        <button onClick={cancelEdit} type="button">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="note">
                                    <div className="note__main">
                                        <h3 className="note__title">{n.title}</h3>
                                        <div className="muted small" style={{ marginTop: '.15rem' }}>
                                            <time dateTime={n.createdAt}>
                                                {new Date(n.createdAt).toLocaleString()}
                                            </time>
                                        </div>
                                        {n.body && <p className="note__body">{n.body}</p>}
                                    </div>
                                    <div className="note__actions" style={{ display: 'grid', gap: '.4rem' }}>
                                        <button onClick={() => startEdit(n)} type="button">Edit</button>
                                        <button className="danger" onClick={() => handleDelete(n._id)} type="button">
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
