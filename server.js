const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const { MessagingResponse } = require('twilio').twiml;
const bodyParser = require('body-parser');

dotenv.config();

const generateSpeech = require(path.join(__dirname, 'elevenlabs', 'voice'));
const getClaudeReply = require(path.join(__dirname, 'elevenlabs', 'claude'));
const sendVoiceMessage = require(path.join(__dirname, 'elevenlabs', 'twilio'));

const app = express();
const PORT = 3000;

// ✅ In-memory chat history (global)
let chatHistory = [];

// ✅ Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(bodyParser.urlencoded({ extended: false }));

// ✅ Homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ✅ Text to speech via ElevenLabs
app.get('/speak', async (req, res) => {
  const text = req.query.text || 'Hello from ElevenLabs voice!';
  const filePath = await generateSpeech(text);

  console.log('Generated file path:', filePath);

  if (!filePath) {
    return res.status(500).send('Error: Voice generation failed.');
  }

  res.download(filePath, 'voice.mp3');
});

// ✅ Claude response + voice + chat history
app.get('/claude-speak', async (req, res) => {
  const text = req.query.text;
  if (!text) return res.status(400).send('Text is required.');

  const reply = await getClaudeReply(text);
  const voicePath = await generateSpeech(reply, 'claude_output.mp3');

  // Update in-memory history
  chatHistory.push({ user: text, claude: reply });
  if (chatHistory.length > 7) chatHistory.shift();

  if (!voicePath) {
    return res.status(500).send('Voice generation failed.');
  }

  res.json({
    reply,
    audio: '/uploads/claude_output.mp3',
    history: chatHistory
  });
});


app.post('/whatsapp', async (req, res) => {
  const incomingMsg = req.body.Body;
  const from = req.body.From;
  const mediaUrl = req.body.MediaUrl0;
  const mediaType = req.body.MediaContentType0;

  console.log(`📩 Message from ${from}`);
  const twiml = new MessagingResponse();

  if (mediaUrl && mediaType && mediaType.startsWith('audio')) {
    // 🎤 Handle voice message
    console.log(`🎤 Voice message received: ${mediaUrl} (${mediaType})`);
    
    // Optionally download or transcribe
    twiml.message("🎧 Thanks! I received your voice message.");
  } else if (incomingMsg) {
    // ✍️ Handle text message
    const reply = await getClaudeReply(incomingMsg);
    await sendVoiceMessage(reply);
    twiml.message(`Claude replied: "${reply}"\n✅ Voice message sent!`);
  } else {
    twiml.message("❓ Sorry, I couldn't understand your message.");
  }

  res.set('Content-Type', 'text/xml');
  res.send(twiml.toString());
});
// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
