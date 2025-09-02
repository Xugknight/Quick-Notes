import { useEffect, useMemo, useState } from 'react';
import * as noteService from '../../services/noteService';

export default function NotesPage() {
    // list + loading
    const [notesOnPage, setNotesOnPage] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // create form
    const [newNoteTitle, setNewNoteTitle] = useState('');
    const [newNoteBody, setNewNoteBody] = useState('');

    // editing
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [editingTitle, setEditingTitle] = useState('');
    const [editingBody, setEditingBody] = useState('');

    // search + pagination
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [itemsPerPage] = useState(6);

    // DnD
    const [draggedNoteId, setDraggedNoteId] = useState(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const pageFromUrl = parseInt(params.get('page') || '1', 10);
        const qFromUrl = params.get('q') || '';
        if (Number.isFinite(pageFromUrl) && pageFromUrl > 1) setCurrentPage(pageFromUrl);
        if (qFromUrl.trim()) setSearchQuery(qFromUrl);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const params = new URLSearchParams();
        if (currentPage > 1) params.set('page', String(currentPage));
        if (searchQuery.trim()) params.set('q', searchQuery.trim());
        const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
        window.history.replaceState(null, '', newUrl);
    }, [currentPage, searchQuery]);

    async function loadNotes() {
        setIsLoading(true);
        setErrorMessage('');
        try {
            const responseData = await noteService.index({
                currentPage,
                itemsPerPage,
                searchQuery,
            });
            setNotesOnPage(responseData.data);
            setTotalPages(responseData.pages);
            setTotalCount(responseData.total);
        } catch (error) {
            setErrorMessage(error.message);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        loadNotes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, searchQuery]);

    async function handleCreateSubmit(event) {
        event.preventDefault();
        if (!newNoteTitle.trim()) return;
        try {
            await noteService.create({ title: newNoteTitle.trim(), body: newNoteBody.trim() });
            setNewNoteTitle('');
            setNewNoteBody('');
            setCurrentPage(1);
            await loadNotes();
        } catch (error) {
            setErrorMessage(error.message);
        }
    }

    async function handleDelete(noteId) {
        const confirmed = window.confirm('Delete this note?');
        if (!confirmed) return;
        try {
            await noteService.remove(noteId);
            await loadNotes();
        } catch (error) {
            setErrorMessage(error.message);
        }
    }

    function beginEditing(note) {
        setEditingNoteId(note._id);
        setEditingTitle(note.title);
        setEditingBody(note.body || '');
    }
    function cancelEditing() {
        setEditingNoteId(null);
        setEditingTitle('');
        setEditingBody('');
    }
    async function saveEditing(noteId) {
        if (!editingTitle.trim()) return;
        try {
            await noteService.update(noteId, {
                title: editingTitle.trim(),
                body: editingBody.trim(),
            });
            await loadNotes();
            cancelEditing();
        } catch (error) {
            setErrorMessage(error.message);
        }
    }

    async function togglePinned(note) {
        try {
            await noteService.pin(note._id, !note.pinned);
            await loadNotes();
        } catch (error) {
            setErrorMessage(error.message);
        }
    }

    function handleDragStart(event, noteId) {
        setDraggedNoteId(noteId);
        event.dataTransfer.effectAllowed = 'move';
    }
    function handleDragOver(event) {
        event.preventDefault();
        event.currentTarget.classList.add('drag-over');
    }
    function handleDragLeave(event) {
        event.currentTarget.classList.remove('drag-over');
    }
    async function handleDrop(event, overNoteId) {
        event.preventDefault();
        event.currentTarget.classList.remove('drag-over');
        if (!draggedNoteId || draggedNoteId === overNoteId) return;

        const workingList = [...notesOnPage];
        const fromIndex = workingList.findIndex((note) => note._id === draggedNoteId);
        const toIndex = workingList.findIndex((note) => note._id === overNoteId);
        if (fromIndex === -1 || toIndex === -1) return;

        if (workingList[fromIndex].pinned !== workingList[toIndex].pinned) return;

        const [movedNote] = workingList.splice(fromIndex, 1);
        workingList.splice(toIndex, 0, movedNote);
        setNotesOnPage(workingList);
        setDraggedNoteId(null);

        try {
            await noteService.reorderPair(draggedNoteId, overNoteId);
        } catch {
            await loadNotes();
        }
    }

    const visibleNotes = useMemo(() => notesOnPage, [notesOnPage]);

    function renderList(noteList) {
        return (
            <ul className="stack" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {noteList.map((note) => (
                    <li
                        key={note._id}
                        className={`card draggable ${draggedNoteId === note._id ? 'dragging' : ''}`}
                        draggable
                        onDragStart={(event) => handleDragStart(event, note._id)}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={(event) => handleDrop(event, note._id)}
                    >
                        {editingNoteId === note._id ? (
                            <div className="stack">
                                <input
                                    value={editingTitle}
                                    onChange={(event) => setEditingTitle(event.target.value)}
                                    maxLength={80}
                                    required
                                />
                                <textarea
                                    rows={4}
                                    value={editingBody}
                                    onChange={(event) => setEditingBody(event.target.value)}
                                    maxLength={2000}
                                />
                                <div style={{ display: 'flex', gap: '.5rem' }}>
                                    <button className="primary" onClick={() => saveEditing(note._id)} type="button">Save</button>
                                    <button onClick={cancelEditing} type="button">Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <div className="note">
                                <div className="note__main">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                                        <h3 className="note__title" style={{ marginRight: 'auto' }}>{note.title}</h3>
                                        {note.pinned && <span className="chip">Pinned</span>}
                                    </div>
                                    <div className="muted small" style={{ marginTop: '.15rem' }}>
                                        <time dateTime={note.createdAt}>{new Date(note.createdAt).toLocaleString()}</time>
                                    </div>
                                    {note.body && <p className="note__body">{note.body}</p>}
                                </div>
                                <div className="note__actions" style={{ display: 'grid', gap: '.4rem' }}>
                                    <button onClick={() => beginEditing(note)} type="button">Edit</button>
                                    <button onClick={() => togglePinned(note)} type="button" className={note.pinned ? 'pin active' : 'pin'}>
                                        {note.pinned ? 'Unpin' : 'Pin'}
                                    </button>
                                    <button className="danger" onClick={() => handleDelete(note._id)} type="button">Delete</button>
                                </div>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        );
    }

    return (
        <section className="stack" style={{ padding: '1rem 0 2rem' }}>
            <div className="card">
                <h2>Add Note</h2>
                <form className="stack" onSubmit={handleCreateSubmit}>
                    <input
                        placeholder="Title"
                        value={newNoteTitle}
                        onChange={(event) => setNewNoteTitle(event.target.value)}
                        required
                        maxLength={80}
                    />
                    <textarea
                        placeholder="Body (optional)"
                        rows={4}
                        value={newNoteBody}
                        onChange={(event) => setNewNoteBody(event.target.value)}
                        maxLength={2000}
                    />
                    <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                        <button className="primary" type="submit">Save</button>
                        <input
                            className="search"
                            type="search"
                            placeholder="Search…"
                            value={searchQuery}
                            onChange={(event) => { setCurrentPage(1); setSearchQuery(event.target.value); }}
                            style={{ marginLeft: 'auto' }}
                        />
                    </div>
                    {errorMessage && <p className="muted" style={{ color: '#b91c1c' }}>{errorMessage}</p>}
                </form>
            </div>

            <div className="stack">
                <div className="toolbar">
                    <h2 style={{ margin: 0 }}>Notes</h2>
                    <div className="muted small">{totalCount} total</div>
                </div>

                {isLoading && <div className="card">Loading…</div>}
                {!isLoading && visibleNotes.length === 0 && <div className="card">No notes</div>}

                {(() => {
                    const pinnedNotes = visibleNotes.filter((note) => note.pinned);
                    const otherNotes = visibleNotes.filter((note) => !note.pinned);

                    return (
                        <>
                            {pinnedNotes.length > 0 && <h3 className="group-title">Pinned</h3>}
                            {pinnedNotes.length > 0 && renderList(pinnedNotes)}

                            {otherNotes.length > 0 && <h3 className="group-title">Others</h3>}
                            {otherNotes.length > 0 && renderList(otherNotes)}
                        </>
                    );
                })()}

                <div className="pagination">
                    <button
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    >
                        Prev
                    </button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    >
                        Next
                    </button>
                </div>
            </div>
        </section>
    );
}