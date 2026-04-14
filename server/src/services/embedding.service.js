const { GoogleGenerativeAIEmbeddings } = require('@langchain/google-genai');

let embeddingsInstance = null;

const getEmbeddings = () => {
  if (!embeddingsInstance) {
    embeddingsInstance = new GoogleGenerativeAIEmbeddings({
      model: process.env.EMBEDDING_MODEL || 'gemini-embedding-001',
      apiKey: process.env.GOOGLE_API_KEY,
    });
  }
  return embeddingsInstance;
};

module.exports = { getEmbeddings };
