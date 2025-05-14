const express = require('express');
const path = require('path');
const generateSpeech = require(path.join(__dirname, 'elevenlabs', 'voice'));
const getClaudeReply = require(path.join(__dirname, 'elevenlabs', 'claude'));
const app = express();
const PORT = 3000;

// ✅ In-memory chat history (global)
let chatHistory = [];

// ✅ Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Serve homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ✅ Direct text-to-speech endpoint
app.get('/speak', async (req, res) => {
  const text = req.query.text || 'Hello from ElevenLabs voice!';
  const filePath = await generateSpeech(text);

  console.log('Generated file path:', filePath);

  if (!filePath) {
    return res.status(500).send('Error: Voice generation failed.');
  }

  res.download(filePath, 'voice.mp3');
});

// ✅ Claude + ElevenLabs voice + Chat History
app.get('/claude-speak', async (req, res) => {
  const text = req.query.text;
  if (!text) return res.status(400).send('Text is required.');

  const reply = await getClaudeReply(text);
  const voicePath = await generateSpeech(reply, 'claude_output.mp3');

  // 🧠 Update in-memory history
  chatHistory.push({ user: text, claude: reply });
  if (chatHistory.length > 7) chatHistory.shift(); // Keep last 7

  if (!voicePath) {
    return res.status(500).send('Voice generation failed.');
  }

  res.json({
    reply,
    audio: '/uploads/claude_output.mp3',
    history: chatHistory  // ⬅️ Send full history
  });
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
