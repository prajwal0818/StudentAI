import api from './api';

export const uploadDocument = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const listDocuments = () => api.get('/documents');

export const removeDocument = (id) => api.delete(`/documents/${id}`);
