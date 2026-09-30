const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const noteRoutes = require('./routes/noteRoutes');
app.use('/api/notes', noteRoutes);

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected!'))
  .catch((err) => console.log('MongoDB connection error:', err));

app.get('/', (req, res) => {
  res.send('StudyMate AI backend chal raha hai!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server ${PORT} pe chal raha hai`));