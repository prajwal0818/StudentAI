import api from './api';

export const askQuestion = (question) =>
  api.post('/chat/ask', { question });

export const getChatHistory = (page = 1, limit = 20) =>
  api.get('/chat/history', { params: { page, limit } });
