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
    const text = prompt('Paste the note text here to summarize (for testing):');
    if (!text) {
      setSummarizingId(null);
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/api/notes/summarize/${noteId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      alert('Summary: ' + data.summary);
      fetchNotes();
    } catch (error) {
      alert('Summarization failed');
    }
    setSummarizingId(null);
  };

  if (!user) {
    return (
      <div style={{ maxWidth: '400px', margin: '50px auto', fontFamily: 'Arial' }}>
        <h2>StudyMate AI - {isLogin ? 'Login' : 'Signup'}</h2>
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ display: 'block', width: '100%', padding: '10px', marginBottom: '10px' }}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '10px', marginBottom: '10px' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '10px', marginBottom: '10px' }}
          />
          <button type="submit" style={{ padding: '10px 20px' }}>
            {isLogin ? 'Login' : 'Signup'}
          </button>
        </form>
        {message && <p>{message}</p>}
        <p onClick={() => setIsLogin(!isLogin)} style={{ color: 'blue', cursor: 'pointer' }}>
          {isLogin ? 'New user? Signup here' : 'Already have account? Login here'}
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', fontFamily: 'Arial' }}>
      <h2>Welcome, {user.name}!</h2>

      <h3>Upload a Note</h3>
      <form onSubmit={handleUpload}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ display: 'block', width: '100%', padding: '10px', marginBottom: '10px' }}
        />
        <input
          type="text"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          style={{ display: 'block', width: '100%', padding: '10px', marginBottom: '10px' }}
        />
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          style={{ display: 'block', marginBottom: '10px' }}
        />
        <button type="submit" style={{ padding: '10px 20px' }}>Upload</button>
      </form>
      {message && <p>{message}</p>}

      <h3 style={{ marginTop: '30px' }}>Your Notes</h3>
      {notes.length === 0 ? (
        <p>No notes uploaded yet.</p>
      ) : (
        <ul>
          {notes.map((note) => (
            <li key={note._id} style={{ marginBottom: '10px' }}>
              <strong>{note.title}</strong> ({note.subject}) —{' '}
              <a href={`http://localhost:5000/uploads/${note.fileUrl}`} target="_blank" rel="noreferrer">
                View File
              </a>
              <br />
                <button
                onClick={() => handleSummarize(note._id)}
                disabled={summarizingId === note._id}
                style={{ marginTop: '5px', padding: '5px 10px' }}
              >
                {summarizingId === note._id ? 'Summarizing...' : 'Summarize'}
              </button>
              {note.summary && (
                <p style={{ marginTop: '5px', fontStyle: 'italic' }}>
                  Summary: {note.summary}
                </p>
              )}
               </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;