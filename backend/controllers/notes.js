const Note = require('../models/note');

module.exports = {
  index,
  show,
  create,
  update,
  delete: deleteNote,
  pin,
  reorder,
  reorderPair,
  resetDemo,
};

async function index(req, res) {
  const currentPage = Math.max(1, parseInt(req.query.page) || 1);
  const itemsPerPage = Math.min(25, Math.max(1, parseInt(req.query.limit) || 10));
  const searchQuery = (req.query.q || '').trim();

  const mongoFilter = searchQuery ? {
    $or: [
      { title: { $regex: searchQuery, $options: 'i' } },
      { body: { $regex: searchQuery, $options: 'i' } },
    ],
  } : {};

  const totalCount = await Note.countDocuments(mongoFilter);
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
  const skipCount = (currentPage - 1) * itemsPerPage;

  const notesPage = await Note.find(mongoFilter)
    .sort({ pinned: -1, order: -1, createdAt: -1 })
    .skip(skipCount)
    .limit(itemsPerPage);

  res.json({ data: notesPage, total: totalCount, page: currentPage, pages: totalPages });
}

async function show(req, res) {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Not Found' });
    res.json(note);
  } catch {
    res.status(400).json({ message: 'Invalid ID' });
  }
}

async function create(req, res) {
  try {
    const note = await Note.create({ title: req.body.title, body: req.body.body });
    res.status(201).json(note);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

async function update(req, res) {
  try {
    const updatedNote = await Note.findByIdAndUpdate(
      req.params.id,
      { title: req.body.title, body: req.body.body },
      { new: true, runValidators: true }
    );
    if (!updatedNote) return res.status(404).json({ message: 'Not Found' });
    res.json(updatedNote);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

async function deleteNote(req, res) {
  try {
    const removedNote = await Note.findByIdAndDelete(req.params.id);
    if (!removedNote) return res.status(404).json({ message: 'Not Found' });
    res.json({ ok: true });
  } catch {
    res.status(400).json({ message: 'Invalid ID' });
  }
}

async function pin(req, res) {
  const { pinned } = req.body || {};
  if (typeof pinned !== 'boolean') return res.status(400).json({ message: 'pinned must be boolean' });
  try {
    const updatedNote = await Note.findByIdAndUpdate(req.params.id, { pinned }, { new: true });
    if (!updatedNote) return res.status(404).json({ message: 'Not Found' });
    res.json(updatedNote);
  } catch (error) {
    res.status(400).json({ message: 'Invalid ID' });
  }
}

async function reorder(req, res) {
  const noteIds = Array.isArray(req.body?.noteIds) && req.body.noteIds.length ? req.body.noteIds : req.body?.ids;

  if (!Array.isArray(noteIds) || noteIds.length === 0) {
    return res.status(400).json({ message: 'noteIds must be a non-empty array' });
  }

  const baseTimestamp = Date.now();

  try {
    await Note.bulkWrite(
      noteIds.map((noteId, index) => ({
        updateOne: {
          filter: { _id: noteId },
          update: { $set: { order: baseTimestamp - index } },
        },
      }))
    );
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Reorder Failed' });
  }
}

async function reorderPair(req, res) {
  const { draggedId, overId } = req.body || {};
  if (!draggedId || !overId) {
    return res.status(400).json({ message: 'draggedId and overId are required' });
  }

  const draggedNote = await Note.findById(draggedId).select('_id pinned');
  const overNote = await Note.findById(overId).select('_id pinned');

  if (!draggedNote || !overNote) {
    return res.status(404).json({ message: 'Note not found' });
  }
  if (draggedNote.pinned !== overNote.pinned) {
    return res.status(400).json({ message: 'Cannot reorder across pinned groups' });
  }

  const groupDocs = await Note.find({ pinned: draggedNote.pinned }).sort({ order: -1, createdAt: -1 }).select('_id');
  const idList = groupDocs.map(n => n._id.toString());
  const fromIndex = idList.indexOf(String(draggedId));
  const toIndex = idList.indexOf(String(overId));

  if (fromIndex === -1 || toIndex === -1) {
    return res.status(400).json({ message: 'IDs not in the same group' });
  }

  idList.splice(fromIndex, 1);
  idList.splice(toIndex, 0, String(draggedId));

  const baseTimestamp = Date.now();
  await Note.bulkWrite(
    idList.map((noteId, index) => ({
      updateOne: {
        filter: { _id: noteId },
        update: { $set: { order: baseTimestamp - index } },
      },
    }))
  );

  return res.json({ ok: true });
}

async function resetDemo(req, res) {
  if (process.env.ALLOW_DEMO_RESET !== 'true') {
    return res.status(403).json({ message: 'Demo Reset Disabled' });
  }

  const now = Date.now();
  const showcaseNotes = [
    { title: 'Pinned: Start here', body: 'Pinned notes stay at the top. Unpin to move down.', pinned: true, order: now - 0 },
    { title: 'Pinned: Drag me up/down', body: 'Drag within pinned to reorder. Persists on refresh.', pinned: true, order: now - 1 },
    { title: 'Edit demo', body: 'Click Edit, change text, Save.', order: now - 100 },
    { title: 'Delete demo', body: 'Click Delete → confirm. List updates immediately.', order: now - 101 },
    { title: 'Search: groceries', body: 'Try the search box with “groceries”.', order: now - 102 },
    { title: 'Search: project plan', body: 'Try searching for “project”.', order: now - 103 },
    { title: 'Pagination 1', body: 'There are enough notes for multiple pages.', order: now - 104 },
    { title: 'Pagination 2', body: 'Use Prev/Next to navigate.', order: now - 105 },
    { title: 'Reorder me A', body: 'Drag me above/below neighbors (same group).', order: now - 106 },
    { title: 'Reorder me B', body: 'Reordering saves on the server—refresh to verify.', order: now - 107 },
    { title: 'Friendly timestamps', body: 'Each note shows a readable created time.', order: now - 108 },
    { title: 'Pin later?', body: 'Click Pin to keep important notes up top.', order: now - 109 },
  ];

  try {
    await Note.deleteMany({});
    await Note.insertMany(showcaseNotes);
    const total = await Note.countDocuments();
    return res.json({ ok: true, total });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Reset failed' });
  }
}