const express = require('express');
const router = express.Router();
const notesCtrl = require('../controllers/notes');

// Public demo — no auth
router.get('/', notesCtrl.index);
router.get('/:id', notesCtrl.show);
router.post('/', notesCtrl.create);
router.put('/:id', notesCtrl.update);
router.delete('/:id', notesCtrl.delete);

module.exports = router;