const express = require('express');
const multer = require('multer');
const axios = require('axios');
const Note = require('../models/Note');

const router = express.Router();

// Multer setup - batata hai file kahan save karni hai
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// UPLOAD NOTE
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { title, subject, userId } = req.body;

    const newNote = new Note({
      title,
      subject,
      fileUrl: req.file.filename,
      uploadedBy: userId
    });

    await newNote.save();
    res.status(201).json({ message: 'Note uploaded successfully', note: newNote });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET ALL NOTES (kisi user ke)
router.get('/my-notes/:userId', async (req, res) => {
  try {
    const notes = await Note.find({ uploadedBy: req.params.userId });
    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// SUMMARIZE NOTE
router.post('/summarize/:noteId', async (req, res) => {
  try {
    const note = await Note.findById(req.params.noteId);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const { text } = req.body;

    const response = await axios.post(
      'https://router.huggingface.co/hf-inference/models/facebook/bart-large-cnn',
      { inputs: text },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`
        }
      }
    );

     console.log('Hugging Face Response:', response.data);

    const summary = response.data[0].summary_text;

    note.summary = summary;
    await note.save();

    res.status(200).json({ message: 'Summary generated', summary });
  } catch (error) {
    console.log('ERROR DETAILS:', error.response ? error.response.data : error.message); 
    res.status(500).json({ message: 'Summarization failed', error: error.message });
  }
});

module.exports = router;