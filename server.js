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

  const lowerText = text.toLowerCase();
  let reply;

  // ✅ Check for WhatsApp history request
  if (lowerText.includes("last whatsapp") || lowerText.includes("previous whatsapp")) {
    const lastWhatsapp = chatHistory
      .filter(entry => entry.platform === 'whatsapp')
      .slice(-5);

    if (lastWhatsapp.length === 0) {
      reply = "📭 No previous WhatsApp messages found.";
    } else {
      reply = `📜 Last ${lastWhatsapp.length} WhatsApp message${lastWhatsapp.length > 1 ? 's' : ''}:\n`;
      lastWhatsapp.forEach((entry, i) => {
        reply += `\n${i + 1}. 👤 You: "${entry.user}"\n🤖 Claude: "${entry.claude || 'No reply'}"\n`;
      });
    }
  } else {
    reply = await getClaudeReply(text);
  }

  const voicePath = await generateSpeech(reply, 'claude_output.mp3');

  // Save chat
  chatHistory.push({ user: text, claude: reply, platform: 'frontend' });
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
    console.log(`🎤 Voice message received: ${mediaUrl} (${mediaType})`);
    twiml.message("🎧 Thanks! I received your voice message.");
  } else if (incomingMsg) {
    const lowerText = incomingMsg.toLowerCase();

    // ✅ Check for "last whatsapp" request
    if (lowerText.includes("last whatsapp") || lowerText.includes("previous whatsapp")) {
      const lastWhatsapp = chatHistory
        .filter(entry => entry.platform === 'whatsapp')
        .slice(-5); // last 5

      if (lastWhatsapp.length === 0) {
        twiml.message("📭 No previous WhatsApp messages found.");
      } else {
        let replyMsg = `📜 Last ${lastWhatsapp.length} WhatsApp message${lastWhatsapp.length > 1 ? 's' : ''}:\n`;
        lastWhatsapp.forEach((entry, i) => {
          replyMsg += `\n${i + 1}. 👤 You: "${entry.user}"\n🤖 Claude: "${entry.claude || 'No reply'}"\n`;
        });
        twiml.message(replyMsg);
      }
    } else {
      // 🧠 Get Claude reply
      const reply = await getClaudeReply(incomingMsg);

      // 💬 Save in chat history
      chatHistory.push({ user: incomingMsg, claude: reply, platform: 'whatsapp' });
      if (chatHistory.length > 7) chatHistory.shift();

      // 🔊 Generate voice and send
      await generateSpeech(reply, 'output.mp3');
      twiml.message(`Claude: "${reply}"\n🔊 Sending voice reply...`);

      setTimeout(async () => {
        await sendVoiceMessage(reply, 'output.mp3');
      }, 1000);
    }
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
