import api from './api';

export const generateEmail = (prompt, tone = 'professional') =>
  api.post('/email/generate', { prompt, tone });
