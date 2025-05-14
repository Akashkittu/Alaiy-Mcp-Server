const twilio = require('twilio');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const generateSpeech = require('./voice'); // Imports the voice generator

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Sends voice message to WhatsApp
async function sendVoiceMessage(text) {
  try {
    // Step 1: Generate voice MP3
    const filePath = await generateSpeech(text);

    if (!filePath) throw new Error("Voice generation failed");

    // Step 2: Construct the public URL for the generated MP3 file
    const fileName = path.basename(filePath);
    const publicUrl = `https://witty-women-lick.loca.lt/uploads/${fileName}`; // ✅ Your live tunnel

    console.log('🔊 Sending voice message:', publicUrl);

    // Step 3: Send media message via WhatsApp using Twilio
    const message = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${process.env.WHATSAPP_USER}`,
      body: text, // optional text caption
      mediaUrl: [publicUrl], // voice mp3
    });

    console.log('✅ WhatsApp message sent:', message.sid);
  } catch (err) {
    console.error('❌ Error sending voice message:', err.message);
  }
}

module.exports = sendVoiceMessage;
