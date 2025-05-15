const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const getClaudeReply = require('./claude');
const generateSpeech = require('./voice');

const telegramHistory = []; // ✅ Add this to store last chats

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;

  
  if (msg.voice || msg.audio) {
    await bot.sendMessage(chatId, "🎧 Thanks! I received your voice message.");
    console.log(`🎤 Telegram Voice message received from ${chatId}`);
    return;
  }

  const userText = msg.text;
  if (!userText) return;

  console.log(`📩 Telegram: "${userText}" from ${chatId}`);

  try {
    const reply = await getClaudeReply(userText);
    const filename = `telegram_reply_${Date.now()}.mp3`;
    const voicePath = await generateSpeech(reply, filename);

   
    telegramHistory.push({ user: userText, claude: reply, platform: 'telegram' });
    if (telegramHistory.length > 10) telegramHistory.shift(); 

   
    await bot.sendMessage(chatId, `Claude: ${reply}`);

    
    await bot.sendAudio(chatId, fs.createReadStream(path.join(__dirname, '..', 'uploads', filename)));
  } catch (err) {
    console.error('❌ Telegram Bot Error:', err);
    await bot.sendMessage(chatId, "❌ Sorry, something went wrong.");
  }
});


module.exports = { telegramHistory };
