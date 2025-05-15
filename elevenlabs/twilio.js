const twilio = require('twilio');
const path = require('path');
require('dotenv').config();

const generateSpeech = require('./voice');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);


async function sendVoiceMessage(text, fileName = 'output.mp3') {
  try {
    
    const filePath = await generateSpeech(text, fileName);
    if (!filePath) throw new Error("Voice generation failed");

    
    const publicUrl = `https://some-taxes-heal.loca.lt/uploads/${fileName}`;

    console.log('🔊 Sending voice message:', publicUrl);

    
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
