const Note = require('../models/note');

module.exports = {
  index,
  show,
  create,
  update,
  delete: deleteNote,
  pin,
  reorder,
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
    response.json({ ok: true });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Reorder Failed' });
  }
}