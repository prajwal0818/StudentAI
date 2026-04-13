const { PromptTemplate } = require('@langchain/core/prompts');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { RunnableSequence } = require('@langchain/core/runnables');
const { getLLM } = require('./llm.service');
const vectorStore = require('./vectorStore.service');
const logger = require('../utils/logger');

const EMAIL_TEMPLATE = `You are an email drafting assistant for a student. Write an email based on the user's prompt.

Tone: {tone}

Relevant context from the student's documents:
{context}

User's prompt: {prompt}

Write a complete email with a subject line, greeting, body, and sign-off. Format it as:

Subject: ...

[email body]`;

const emailPrompt = PromptTemplate.fromTemplate(EMAIL_TEMPLATE);

/**
 * Generate an email using RAG context and an LLM.
 * @param {{ prompt: string, tone: string, userId: string }} params
 * @returns {Promise<{ email: string, sources: string[] }>}
 */
const generateEmail = async ({ prompt, tone, userId }) => {
  // Retrieve relevant context (may be empty if no docs uploaded)
  const relevantDocs = await vectorStore.search(userId, prompt, 3);
  const context = relevantDocs.length
    ? relevantDocs.map((doc) => doc.pageContent).join('\n\n---\n\n')
    : 'No uploaded documents available.';
  const sources = [...new Set(relevantDocs.map((doc) => doc.metadata.source))];

  const chain = RunnableSequence.from([
    emailPrompt,
    getLLM(),
    new StringOutputParser(),
  ]);

  const email = await chain.invoke({
    prompt,
    tone: tone || 'professional',
    context,
  });

  logger.info(`Email generated for user ${userId}, tone: ${tone}`);
  return { email, sources };
};

module.exports = { generateEmail };
