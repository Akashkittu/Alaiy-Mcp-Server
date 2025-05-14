const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.VOICE_ID;

async function generateSpeech(text, filename = 'output.mp3') {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;

  const headers = {
    'xi-api-key': ELEVENLABS_API_KEY,
    'Content-Type': 'application/json',
    'Accept': 'audio/mpeg',
  };

  const data = {
    text,
    model_id: 'eleven_monolingual_v1',
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.5,
    },
  };

  try {
    const response = await axios.post(url, data, {
      headers,
      responseType: 'stream',
    });

    const filePath = path.join(__dirname, '..', 'uploads', filename);
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log('✅ Audio saved to:', filePath);
        resolve(filePath);
      });
      writer.on('error', (err) => {
        console.error('❌ Error writing audio file:', err);
        reject(err);
      });
    });
  } catch (error) {
    console.error('❌ Error generating speech from ElevenLabs:', error.response?.data || error.message);
    return null; // return null on failure
  }
}

module.exports = generateSpeech;
