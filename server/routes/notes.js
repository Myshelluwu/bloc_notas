const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteControllers');

// CRUD de notas
router.get('/', noteController.getAllNotes);
router.get('/stats', noteController.getNotesStats);
router.get('/:id', noteController.getNoteById);
router.post('/', noteController.createNote);
router.put('/:id', noteController.updateNote);
router.delete('/:id', noteController.deleteNote);

module.exports = router;