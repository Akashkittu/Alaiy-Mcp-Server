const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const { MessagingResponse } = require('twilio').twiml;
const bodyParser = require('body-parser');

dotenv.config();

const generateSpeech = require(path.join(__dirname, 'elevenlabs', 'voice'));
const getClaudeReply = require(path.join(__dirname, 'elevenlabs', 'claude'));
const sendVoiceMessage = require(path.join(__dirname, 'elevenlabs', 'twilio'));
const { telegramHistory } = require('./elevenlabs/telegram'); 

const app = express();
const PORT = 3000;


let chatHistory = [];


app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(bodyParser.urlencoded({ extended: false }));


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.get('/speak', async (req, res) => {
  const text = req.query.text || 'Hello from ElevenLabs voice!';
  const filePath = await generateSpeech(text);

  console.log('Generated file path:', filePath);

  if (!filePath) {
    return res.status(500).send('Error: Voice generation failed.');
  }

  res.download(filePath, 'voice.mp3');
});


app.get('/claude-speak', async (req, res) => {
  const text = req.query.text;
  if (!text) return res.status(400).send('Text is required.');

  const lowerText = text.toLowerCase();
  let reply;

  if (lowerText.includes("last whatsapp") || lowerText.includes("previous whatsapp")) {
    const lastWhatsapp = chatHistory.filter(entry => entry.platform === 'whatsapp').slice(-5);
    if (lastWhatsapp.length === 0) {
      reply = "📭 No previous WhatsApp messages found.";
    } else {
      reply = `📜 Last ${lastWhatsapp.length} WhatsApp message${lastWhatsapp.length > 1 ? 's' : ''}:
`;
      lastWhatsapp.forEach((entry, i) => {
        reply += `\n${i + 1}. 👤 You: \"${entry.user}\"\n🤖 Claude: \"${entry.claude || 'No reply'}\"\n`;
      });
    }
  } else if (lowerText.includes("last telegram") || lowerText.includes("previous telegram")) {
    const lastTelegram = telegramHistory.slice(-5);
    if (lastTelegram.length === 0) {
      reply = "📭 No previous Telegram messages found.";
    } else {
      reply = `📜 Last ${lastTelegram.length} Telegram message${lastTelegram.length > 1 ? 's' : ''}:
`;
      lastTelegram.forEach((entry, i) => {
        reply += `\n${i + 1}. 👤 You: \"${entry.user}\"\n🤖 Claude: \"${entry.claude || 'No reply'}\"\n`;
      });
    }
  } else {
    reply = await getClaudeReply(text);
  }

  const voicePath = await generateSpeech(reply, 'claude_output.mp3');
  chatHistory.push({ user: text, claude: reply, platform: 'frontend' });
  if (chatHistory.length > 7) chatHistory.shift();

  if (!voicePath) {
    return res.status(500).send('Voice generation failed.');
  }

  res.json({ reply, audio: '/uploads/claude_output.mp3', history: chatHistory });
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

    if (lowerText.includes("last whatsapp") || lowerText.includes("previous whatsapp")) {
      const lastWhatsapp = chatHistory.filter(entry => entry.platform === 'whatsapp').slice(-5);
      if (lastWhatsapp.length === 0) {
        twiml.message("📭 No previous WhatsApp messages found.");
      } else {
        let replyMsg = `📜 Last ${lastWhatsapp.length} WhatsApp message${lastWhatsapp.length > 1 ? 's' : ''}:
`;
        lastWhatsapp.forEach((entry, i) => {
          replyMsg += `\n${i + 1}. 👤 You: \"${entry.user}\"\n🤖 Claude: \"${entry.claude || 'No reply'}\"\n`;
        });
        twiml.message(replyMsg);
      }
    } else {
      const reply = await getClaudeReply(incomingMsg);
      chatHistory.push({ user: incomingMsg, claude: reply, platform: 'whatsapp' });
      if (chatHistory.length > 7) chatHistory.shift();

      await generateSpeech(reply, 'output.mp3');
      twiml.message(`Claude: \"${reply}\"\n🔊 Sending voice reply...`);

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

require('./elevenlabs/telegram');

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
