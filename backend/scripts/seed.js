require('dotenv').config();
const mongoose = require('mongoose');
const Note = require('../models/note');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing notes so the demo is deterministic
    await Note.deleteMany({});
    console.log('Cleared existing notes');

    const now = Date.now();

    const seedNotes = [
      // — Pinned group
      {
        title: 'Pinned: Start here',
        body: 'Pinned notes stay at the top. Click “Unpin” to move it down.',
        pinned: true,
        order: now - 0,
      },
      {
        title: 'Pinned: Drag me up/down',
        body: 'Drag within the pinned group to reorder. The order persists.',
        pinned: true,
        order: now - 1,
      },

      // — Unpinned group
      {
        title: 'Edit demo',
        body: 'Click Edit, change title/body, then Save.',
        order: now - 100,
      },
      {
        title: 'Delete demo',
        body: 'Click Delete → confirm. The list updates immediately.',
        order: now - 101,
      },
      {
        title: 'Search: groceries',
        body: 'Try typing “groceries” in the search box.',
        order: now - 102,
      },
      {
        title: 'Search: project plan',
        body: 'Try searching for “project”.',
        order: now - 103,
      },
      {
        title: 'Pagination 1',
        body: 'There are enough notes to require multiple pages.',
        order: now - 104,
      },
      {
        title: 'Pagination 2',
        body: 'Use Prev/Next to navigate pages.',
        order: now - 105,
      },
      {
        title: 'Reorder me A',
        body: 'Drag me above/below neighbors (not across pin groups).',
        order: now - 106,
      },
      {
        title: 'Reorder me B',
        body: 'Reordering saves on the server — refresh to verify.',
        order: now - 107,
      },
      {
        title: 'Friendly timestamps',
        body: 'Each note shows a readable created time.',
        order: now - 108,
      },
      {
        title: 'Pin later?',
        body: 'Click Pin to keep important notes up top.',
        order: now - 109,
      },
    ];

    await Note.insertMany(seedNotes);
    const count = await Note.countDocuments();

    console.log(`Seeded ${count} notes ✅`);
    console.log(`
Demo tips:
• Pinned notes stay at the top (try Pin/Unpin).
• Drag notes within a group to reorder; order persists after refresh.
• Use the Search box (e.g., "project", "groceries").
• Use Prev/Next for pagination.
• Click Edit to modify; Delete asks for confirmation.
`);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();