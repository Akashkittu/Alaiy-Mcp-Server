# 🎤 Claude AI Voice Assistant – Alaiy MCP Server

A full-stack voice assistant project that connects Claude AI with **ElevenLabs voice synthesis**, and supports both **WhatsApp** and **Telegram** integrations.

This project was built for the **Alaiy Computer Scientist Skill Test**, simulating a multi-platform, voice-based conversational experience powered by Claude and ElevenLabs.

---

## 🚀 Features

- 🤖 Claude MCP Assistant Integration  
- 🔊 ElevenLabs Text-to-Speech (TTS) for realistic voice generation  
- 💬 WhatsApp Messaging using Twilio Webhook  
- 📲 Telegram Bot Integration  
- 🧠 Chat history memory (platform-aware)  
- 🌐 Web-based UI with theme toggle and voice playback  

---

## 🧩 Tech Stack

- **Backend**: Node.js + Express  
- **Frontend**: HTML/CSS/JS (Vanilla)  
- **APIs**: Claude (MCP), ElevenLabs, Twilio WhatsApp, Telegram Bot API  

---

## 📁 Folder Structure

```
Alaiy-Mcp-Server/
├── server.js
├── .env.example
├── public/
│   └── index.html
├── elevenlabs/
│   ├── voice.js
│   ├── claude.js
│   ├── twilio.js
│   └── telegram.js
├── uploads/          (auto-generated audio files)
├── .gitignore
└── package.json
```

---

## ⚙️ Setup Instructions (Run Locally)

### 1. Clone the Repo

```bash
git clone https://github.com/Akashkittu/Alaiy-Mcp-Server.git
cd Alaiy-Mcp-Server
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create `.env` File

Create a `.env` file in the root directory and fill it like this:

```env
PORT=3000

# Claude MCP
MCP_API_KEY=your_claude_api_key
MCP_ASSISTANT_ID=your_claude_assistant_id

# ElevenLabs
ELEVENLABS_API_KEY=your_elevenlabs_api_key
VOICE_ID=your_elevenlabs_voice_id

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+your_twilio_number

# Telegram
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

> ✅ You can copy `.env.example` and rename it to `.env`

---

### 4. Start the Server

```bash
node server.js
```

Then visit:  
🌐 http://localhost:3000/

---

## 📲 How to Use WhatsApp Integration (via Twilio + LocalTunnel)

To enable Twilio to access your local server, follow these steps:

### Step 1: Start the server

```bash
node server.js
```

### Step 2: Open a new terminal and run LocalTunnel

```bash
npx localtunnel --port 3000
```

This will give you a URL like:
```
https://bold-mango-lion.loca.lt
```

### Step 3: Update the Webhook in Twilio Console

- Go to [Twilio Console > Messaging > WhatsApp > Senders](https://www.twilio.com/console/sms/whatsapp/senders)
- Choose your sandbox number or phone number
- Set the **Incoming Message Webhook** to:

```
https://your-localtunnel-url/whatsapp
```

> Example:
```
https://bold-mango-lion.loca.lt/whatsapp
```

### Step 4: Update `twilio.js` if you're pushing from server

If you're sending messages from the backend using `twilio.js`, update the `url` with the new localtunnel link inside the `sendVoiceMessage()` function.
