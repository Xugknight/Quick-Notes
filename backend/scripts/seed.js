require('dotenv').config();
const mongoose = require('mongoose');
const Note = require('../models/note');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    await Note.deleteMany({});
    await Note.insertMany([
      { title: 'Welcome!', body: 'This app shows basic MERN-stack CRUD functionality.' },
      { title: 'Try editing', body: 'Click Edit, change text, then Save.' },
      { title: 'Delete one', body: 'The list updates immediately.' }
    ]);
    console.log('Seeded notes ✅');
  } catch (e) {
    console.error('Seed error:', e.message);
  } finally {
    await mongoose.disconnect();
  }
}

run();