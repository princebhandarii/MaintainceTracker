// notes.js
const express = require('express');
const router = express.Router();
const { addNote, getNotesByFlat, deleteNote } = require('../controllers/noteController');
const { protect } = require('../middleware/auth');
router.use(protect);
router.get('/', getNotesByFlat);
router.post('/', addNote);
router.delete('/:id', deleteNote);
module.exports = router;
