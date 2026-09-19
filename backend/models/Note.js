const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  fileUrl: { type: String, required: true },
   summary: {
    type: String,
    default: ''
  },
    extractedText: {
    type: String,
    default: ''
  },

    quiz: {
    type: [String],
    default: []
  },
    embedding: {
    type: [Number],
    default: []
  },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Note', noteSchema);