const express = require('express');
const multer = require('multer');
const Note = require('../models/Note');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { title, subject, userId } = req.body;
    const newNote = new Note({ title, subject, fileUrl: req.file.filename, uploadedBy: userId });
    await newNote.save();
    res.status(201).json({ message: 'Note uploaded successfully', note: newNote });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/my-notes/:userId', async (req, res) => {
  try {
    const notes = await Note.find({ uploadedBy: req.params.userId });
    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;