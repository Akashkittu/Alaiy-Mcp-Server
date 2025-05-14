const twilio = require('twilio');
const path = require('path');
require('dotenv').config();

const generateSpeech = require('./voice');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// ✅ Updated to accept optional filename
async function sendVoiceMessage(text, fileName = 'output.mp3') {
  try {
    // Step 1: Generate voice with specific file name
    const filePath = await generateSpeech(text, fileName);
    if (!filePath) throw new Error("Voice generation failed");

    // Step 2: Get public URL for the mp3 file
    const publicUrl = `https://young-wolves-wash.loca.lt/uploads/${fileName}`;

    console.log('🔊 Sending voice message:', publicUrl);

    // Step 3: Send to WhatsApp
    const message = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${process.env.WHATSAPP_USER}`,
      body: text,
      mediaUrl: [publicUrl],
    });

    console.log('✅ WhatsApp message sent:', message.sid);
  } catch (err) {
    console.error('❌ Error sending voice message:', err.message);
  }
}

module.exports = sendVoiceMessage;
