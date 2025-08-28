const path = require('path');
const express = require('express');
const logger = require('morgan');
const app = express();

require('dotenv').config();
require('./db');

app.use(logger('dev'));
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/notes', require('./routes/notes'));

app.get('/*splat', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`The express app is listening on ${port}`);
});