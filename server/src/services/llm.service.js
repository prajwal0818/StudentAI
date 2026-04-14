const { ChatGroq } = require('@langchain/groq');

const getLLM = () => {
  return new ChatGroq({
    model: process.env.LLM_MODEL || 'llama-3.3-70b-versatile',
    temperature: 0.7,
    apiKey: process.env.GROQ_API_KEY,
  });
};

module.exports = { getLLM };
