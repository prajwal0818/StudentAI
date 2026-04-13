const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

/**
 * Split raw text into chunks with metadata.
 * @param {string} text - The full extracted text.
 * @param {{ documentId: string, userId: string, originalName: string }} meta
 * @returns {Promise<import('langchain/schema').Document[]>}
 */
const chunkText = async (text, meta) => {
  const docs = await splitter.createDocuments(
    [text],
    [{ documentId: meta.documentId, userId: meta.userId, source: meta.originalName }]
  );
  return docs;
};

module.exports = { chunkText };
