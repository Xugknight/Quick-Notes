const Note = require('../models/note');

module.exports = {
    index,
    show,
    create,
    update,
    delete: deleteNote
};

async function index(req, res) {
    const notes = await Note.find({}).sort({ createdAt: -1 });
    res.json(notes);
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
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      { title: req.body.title, body: req.body.body },
      { new: true, runValidators: true }
    );
    if (!note) return res.status(404).json({ message: 'Not Found' });
    res.json(note);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

async function deleteNote(req, res) {
  try {
    const note = await Note.findByIdAndDelete(req.params.id);
    if (!note) return res.status(404).json({ message: 'Not Found' });
    res.json({ ok: true });
  } catch {
    res.status(400).json({ message: 'Invalid ID' });
  }
}