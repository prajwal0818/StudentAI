const { OpenAIEmbeddings } = require('@langchain/openai');

let embeddingsInstance = null;

const getEmbeddings = () => {
  if (!embeddingsInstance) {
    embeddingsInstance = new OpenAIEmbeddings({
      modelName: process.env.EMBEDDING_MODEL || 'text-embedding-ada-002',
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
  }
  return embeddingsInstance;
};

module.exports = { getEmbeddings };
