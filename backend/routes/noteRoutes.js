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

// Embedding banane ka function
async function getEmbedding(text) {
  const response = await axios.post(
    'https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction',
    { inputs: text.substring(0, 500) },
    {
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`
      }
    }
  );
  return response.data;
}

// Cosine Similarity Nikalne Ka Function
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0 || vecA.length !== vecB.length) {
    return 0;
  }
  const dotProduct = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }
  return dotProduct / (magnitudeA * magnitudeB);
}

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

    let embedding = [];
    if (extractedText) {
      try {
        embedding = await getEmbedding(extractedText);
      } catch (embErr) {
        console.log('Embedding generation failed:', embErr.message);
      }
    }

    const newNote = new Note({
      title,
      subject,
      fileUrl: req.file.filename,
      uploadedBy: userId,
      extractedText: extractedText,
      embedding: embedding
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

// SEMANTIC SEARCH
router.post('/search/:userId', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const queryEmbedding = await getEmbedding(query);

    const notes = await Note.find({
      uploadedBy: req.params.userId,
      embedding: { $ne: [] }
    });

    console.log('Notes with embeddings:', notes.map(n => ({ title: n.title, embeddingLength: n.embedding.length })));

    const results = notes
      .map(note => ({
        note: note,
        similarity: cosineSimilarity(queryEmbedding, note.embedding)
      }))
      .filter(r => !isNaN(r.similarity));

    results.sort((a, b) => b.similarity - a.similarity);

    const topResults = results.slice(0, 5).map(r => ({
      _id: r.note._id,
      title: r.note.title,
      subject: r.note.subject,
      fileUrl: r.note.fileUrl,
      similarity: r.similarity.toFixed(2)
    }));

    res.status(200).json({ results: topResults });
  } catch (error) {
    console.log('SEARCH ERROR DETAILS:', error.response ? error.response.data : error.message);
    res.status(500).json({ message: 'Search failed', error: error.message });
  }
});

// RAG - ASK QUESTION FROM NOTES
router.post('/ask/:userId', async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ message: 'Question is required' });
    }

    const questionEmbedding = await getEmbedding(question);

    const notes = await Note.find({
      uploadedBy: req.params.userId,
      embedding: { $ne: [] }
    });

    if (notes.length === 0) {
      return res.status(400).json({ message: 'No notes with content found' });
    }

    const scored = notes
      .map(note => ({
        note: note,
        similarity: cosineSimilarity(questionEmbedding, note.embedding)
      }))
      .filter(r => !isNaN(r.similarity))
      .sort((a, b) => b.similarity - a.similarity);

    if (scored.length === 0) {
      return res.status(400).json({ message: 'No relevant notes found' });
    }

    const bestMatch = scored[0].note;

    const response = await axios.post(
      'https://router.huggingface.co/v1/chat/completions',
      {
        model: 'meta-llama/Llama-3.1-8B-Instruct:fastest',
        messages: [
          {
            role: 'user',
            content: `Based on the following notes, answer the question concisely. If the answer is not in the notes, say so.\n\nNotes:\n${bestMatch.extractedText.substring(0, 1500)}\n\nQuestion: ${question}`
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`
        }
      }
    );

    const answer = response.data.choices[0].message.content;

    res.status(200).json({
      answer: answer,
      source: bestMatch.title
    });
  } catch (error) {
    console.log('RAG ERROR DETAILS:', error.response ? error.response.data : error.message);
    res.status(500).json({ message: 'Question answering failed', error: error.message });
  }
});

module.exports = router;