// elevenlabs/claude.js
const axios = require('axios');
require('dotenv').config();

const MCP_API_KEY = process.env.MCP_API_KEY;

async function getClaudeReply(prompt) {
  console.log("📩 Prompt received:", prompt);

  // 🧠 Check for special keyword "Akash"
  if (/akash/i.test(prompt)) {
    return "Hi Akash! I'm Claude, your friendly assistant.";
  }

  try {
    // ⚡ Attempt Claude real API call
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: "claude-3-haiku-20240307",
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': MCP_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      }
    );

    const text = response.data?.content?.[0]?.text;
    return text || getFallbackReply();
  } catch (err) {
    console.error('❌ Claude Error:', err.response?.data || err.message);

    // ⛔ If credits are exhausted or key is invalid, fallback
    if (
      err.response?.data?.error?.message?.includes('credit balance') ||
      err.response?.status === 401
    ) {
      return getFallbackReply();
    }

    return 'Error talking to Claude.';
  }
}

// 🔁 Fallback demo replies
function getFallbackReply() {
  const fakeReplies = [
    "This is a simulated reply from Claude AI.",
    "I'm currently running in demo mode, but feel free to ask anything!",
    "Great question! Here's what I think...",
    "Thanks for asking — let me explain that in simple words."
  ];
  return fakeReplies[Math.floor(Math.random() * fakeReplies.length)];
}

module.exports = getClaudeReply;
