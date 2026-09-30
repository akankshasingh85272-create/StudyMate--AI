# StudyMate AI 📚🤖

**An AI-powered study assistant that helps students organize, understand, and revise their study material more efficiently.**

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://study-mate-ai-psi-swart.vercel.app)

🔗 **Live Demo:** [study-mate-ai-psi-swart.vercel.app](https://study-mate-ai-psi-swart.vercel.app)


## 📖 Overview

Students today accumulate large volumes of scattered study material — PDFs, notes, and reference documents — but often lack an efficient way to organize, revise, and extract meaningful insights from them under time constraints. **StudyMate AI** solves this by combining a clean note-management system with multiple AI-driven features that automatically summarize content, generate self-assessment quizzes, enable meaning-based search, and allow direct, grounded question-answering from a student's own notes.

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Secure Authentication** | JWT-based signup/login with encrypted (bcrypt) password storage |
| 📤 **Smart Note Upload** | Upload PDFs with automatic text extraction, organized by subject |
| ✨ **AI Auto-Summarization** | Generates concise summaries of uploaded notes using a pre-trained NLP model |
| 📝 **AI-Generated Quizzes** | Automatically creates practice questions from note content for self-testing |
| 🔍 **Semantic Search** | Meaning-based search using text embeddings and cosine similarity — goes beyond keyword matching |
| 🤖 **RAG-Based Q&A** | Ask direct questions and get answers grounded in your own notes, with the source cited |
| 🎥 **Related YouTube Videos** | Surfaces relevant video content based on each note's topic |
| 🎨 **Modern UI** | Clean, responsive interface built with Tailwind CSS |

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB (MongoDB Atlas) |
| Authentication | JWT, bcrypt |
| AI / NLP | Hugging Face — summarization model, instruction-following LLM, sentence embeddings |
| File Handling | Multer, pdf-parse |
| External API | YouTube Data API v3 |
| Deployment | Vercel (frontend), Render (backend) |
| Version Control | Git, GitHub |

## ⚙️ How It Works

1. A user signs up and logs in securely.
2. They upload a PDF, and the system automatically extracts its text content.
3. With a single click, they can generate a concise **summary**, a set of **practice quiz questions**, or find **related YouTube videos**.
4. **Smart Search** lets them search across all notes by meaning rather than exact keywords.
5. **Ask Your Notes (RAG)** lets them ask a direct question and get an answer generated from the relevant note's content — with the source cited.

## 🎯 Why This Project Stands Out

Rather than relying on a single AI feature, StudyMate AI integrates **four distinct AI techniques** — summarization, generative quiz creation, embedding-based semantic search, and retrieval-augmented generation — into one cohesive platform, where each feature builds on the last (the embedding infrastructure used for search directly powers the RAG system). The project also involved real-world debugging of deprecated third-party APIs, library version conflicts, and production deployment challenges.

## 🚀 Status

Fully built, tested, and deployed — actively maintained as a personal project.

## 👩‍💻 Author

**Akanksha Singh**