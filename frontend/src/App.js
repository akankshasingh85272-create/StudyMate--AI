import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [isLogin, setIsLogin] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState([]);
  const [summarizingId, setSummarizingId] = useState(null);
  const [quizzingId, setQuizzingId] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotes();
    }
    // eslint-disable-next-line
  }, [user]);

  const fetchNotes = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/notes/my-notes/${user.id}`);
      const data = await response.json();
      setNotes(data);
    } catch (error) {
      console.log('Failed to fetch notes');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = isLogin
      ? 'http://localhost:5000/api/auth/login'
      : 'http://localhost:5000/api/auth/signup';

    const body = isLogin
      ? { email, password }
      : { name, email, password };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      setMessage(data.message);

      if (isLogin && data.token) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
      }
    } catch (error) {
      setMessage('Something went wrong');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', title);
    formData.append('subject', subject);
    formData.append('file', file);
    formData.append('userId', user.id);

    try {
      const response = await fetch('http://localhost:5000/api/notes/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setMessage(data.message);
      setTitle('');
      setSubject('');
      setFile(null);
      fetchNotes();
    } catch (error) {
      setMessage('Upload failed');
    }
  };

  const handleSummarize = async (noteId) => {
    setSummarizingId(noteId);
    try {
      const response = await fetch(`http://localhost:5000/api/notes/summarize/${noteId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (response.ok) {
        alert('Summary: ' + data.summary);
      } else {
        alert(data.message);
      }
      fetchNotes();
    } catch (error) {
      alert('Summarization failed');
    }
    setSummarizingId(null);
  };

  const handleGenerateQuiz = async (noteId) => {
    setQuizzingId(noteId);
    try {
      const response = await fetch(`http://localhost:5000/api/notes/generate-quiz/${noteId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (response.ok) {
        alert('Quiz Questions:\n' + data.quiz.join('\n'));
      } else {
        alert(data.message);
      }
      fetchNotes();
    } catch (error) {
      alert('Quiz generation failed');
    }
    setQuizzingId(null);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearching(true);
    try {
      const response = await fetch(`http://localhost:5000/api/notes/search/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error) {
      alert('Search failed');
    }
    setSearching(false);
  };

  const handleAsk = async (e) => {
    e.preventDefault();
    setAsking(true);
    setAnswer('');
    try {
      const response = await fetch(`http://localhost:5000/api/notes/ask/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const data = await response.json();
      if (response.ok) {
        setAnswer(`${data.answer}\n\n(Source: ${data.source})`);
      } else {
        setAnswer(data.message);
      }
    } catch (error) {
      setAnswer('Something went wrong');
    }
    setAsking(false);
  };

  // LOGIN / SIGNUP PAGE
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">📚 StudyMate AI</h1>
            <p className="text-gray-500 mt-2">
              {isLogin ? 'Welcome back!' : 'Create your account'}
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition"
            >
              {isLogin ? 'Login' : 'Sign Up'}
            </button>
          </form>
          {message && <p className="text-center text-sm text-red-500 mt-4">{message}</p>}
          <p
            onClick={() => setIsLogin(!isLogin)}
            className="text-center text-indigo-600 mt-6 cursor-pointer hover:underline text-sm"
          >
            {isLogin ? "New user? Sign up here" : 'Already have an account? Login here'}
          </p>
        </div>
      </div>
    );
  }

  // DASHBOARD
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-indigo-600">📚 StudyMate AI</h1>
        <span className="text-gray-600">Welcome, {user.name}!</span>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* Smart Search */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">🔍 Smart Search</h2>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Search your notes by meaning..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={searching}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-medium transition disabled:opacity-50"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </form>
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              {searchResults.map((r) => (
                <div key={r._id} className="bg-gray-50 rounded-lg p-3 flex justify-between text-sm">
                  <span className="font-medium text-gray-700">{r.title} ({r.subject})</span>
                  <span className="text-indigo-600">Match: {r.similarity}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RAG - Ask Questions */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">🤖 Ask Your Notes (RAG)</h2>
          <form onSubmit={handleAsk} className="flex gap-2">
            <input
              type="text"
              placeholder="Ask a question based on your notes..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={asking}
              className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg font-medium transition disabled:opacity-50"
            >
              {asking ? 'Thinking...' : 'Ask'}
            </button>
          </form>
          {answer && (
            <p className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
              {answer}
            </p>
          )}
        </div>

        {/* Upload */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">📤 Upload a Note</h2>
          <form onSubmit={handleUpload} className="space-y-3">
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full text-sm text-gray-600"
            />
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-medium transition"
            >
              Upload
            </button>
          </form>
          {message && <p className="text-sm text-gray-600 mt-3">{message}</p>}
        </div>

        {/* Notes List */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">📝 Your Notes</h2>
          {notes.length === 0 ? (
            <p className="text-gray-400 text-sm">No notes uploaded yet.</p>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <div key={note._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-gray-800">{note.title}</h3>
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                        {note.subject}
                      </span>
                    </div>
                    <a>
                      href={`http://localhost:5000/uploads/${note.fileUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 text-sm hover:underline"
                    
                      View File
                    </a>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleSummarize(note._id)}
                      disabled={summarizingId === note._id}
                      className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                    >
                      {summarizingId === note._id ? 'Summarizing...' : '✨ Summarize'}
                    </button>
                    <button
                      onClick={() => handleGenerateQuiz(note._id)}
                      disabled={quizzingId === note._id}
                      className="text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                    >
                      {quizzingId === note._id ? 'Generating...' : '📝 Generate Quiz'}
                    </button>
                  </div>

                  {note.summary && (
                    <p className="mt-3 text-sm text-gray-600 italic bg-gray-50 p-3 rounded-lg">
                      {note.summary}
                    </p>
                  )}

                  {note.quiz && note.quiz.length > 0 && (
                    <div className="mt-3 bg-yellow-50 p-3 rounded-lg">
                      <p className="font-medium text-sm text-gray-700 mb-1">Quiz Questions:</p>
                      <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                        {note.quiz.map((q, index) => (
                          <li key={index}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;