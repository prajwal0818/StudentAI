const { ChatOpenAI } = require('@langchain/openai');

const getLLM = () => {
  return new ChatOpenAI({
    modelName: process.env.LLM_MODEL || 'gpt-3.5-turbo',
    temperature: 0.7,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });
};

module.exports = { getLLM };
