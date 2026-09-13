const express = require('express');
const multer = require('multer');
const axios = require('axios');
const Note = require('../models/Note');
const { PDFParse } = require('pdf-parse');
const fs = require('fs');

const router = express.Router();

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

    let extractedText = '';

    if (req.file.mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(req.file.path);
      const parser = new PDFParse({ data: dataBuffer });
      const result = await parser.getText();
      extractedText = result.text;
    }

    const newNote = new Note({
      title,
      subject,
      fileUrl: req.file.filename,
      uploadedBy: userId,
      extractedText: extractedText
    });

    await newNote.save();
    res.status(201).json({ message: 'Note uploaded successfully', note: newNote });
  } catch (error) {
    console.log('UPLOAD ERROR DETAILS:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET ALL NOTES
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

    if (!note.extractedText) {
      return res.status(400).json({ message: 'No text found in this note to summarize' });
    }

    const response = await axios.post(
      'https://router.huggingface.co/hf-inference/models/facebook/bart-large-cnn',
      { inputs: note.extractedText.substring(0, 1000) },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`
        }
      }
    );

    const summary = response.data[0].summary_text;

    note.summary = summary;
    await note.save();

    res.status(200).json({ message: 'Summary generated', summary });
  } catch (error) {
    console.log('ERROR DETAILS:', error.response ? error.response.data : error.message);
    res.status(500).json({ message: 'Summarization failed', error: error.message });
  }
});

// GENERATE QUIZ
router.post('/generate-quiz/:noteId', async (req, res) => {
  try {
    const note = await Note.findById(req.params.noteId);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (!note.extractedText) {
      return res.status(400).json({ message: 'No text found in this note to generate quiz' });
    }

    const response = await axios.post(
      'https://router.huggingface.co/v1/chat/completions',
      {
        model: 'meta-llama/Llama-3.1-8B-Instruct:fastest',
        messages: [
          {
            role: 'user',
            content: `Generate 5 short quiz questions (without answers) based on this text. Return only the questions, one per line, numbered 1 to 5:\n\n${note.extractedText.substring(0, 1000)}`
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`
        }
      }
    );

    const rawText = response.data.choices[0].message.content;
    const questions = rawText
      .split('\n')
      .map(q => q.trim())
      .filter(q => q.length > 0);

    note.quiz = questions;
    await note.save();

    res.status(200).json({ message: 'Quiz generated', quiz: questions });
  } catch (error) {
    console.log('QUIZ ERROR DETAILS:', error.response ? error.response.data : error.message);
    res.status(500).json({ message: 'Quiz generation failed', error: error.message });
  }
});

module.exports = router;