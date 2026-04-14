import api from './api';

export const getGmailStatus = () => api.get('/gmail/status');

export const getGmailConnectUrl = () => api.get('/gmail/connect');

export const sendViaGmail = (to, cc, subject, body) =>
  api.post('/gmail/send', { to, cc, subject, body });

export const disconnectGmail = () => api.post('/gmail/disconnect');
