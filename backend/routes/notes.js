const express = require('express');
const router = express.Router();
const notesCtrl = require('../controllers/notes');

router.get('/', notesCtrl.index);
router.post('/reorder-pair', notesCtrl.reorderPair);
router.patch('/reorder', notesCtrl.reorder);
router.get('/:id', notesCtrl.show);
router.post('/', notesCtrl.create);
router.put('/:id', notesCtrl.update);
router.patch('/:id/pin', notesCtrl.pin);
router.delete('/:id', notesCtrl.delete);

module.exports = router;