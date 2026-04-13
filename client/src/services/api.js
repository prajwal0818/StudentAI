import axios from 'axios';

const getApiBase = () => {
  const { pathname, port } = window.location;

  // If already behind a proxy sub-path (e.g. /proxy/5000/), use it
  const proxyMatch = pathname.match(/^(\/proxy\/\d+)\//);
  if (proxyMatch) {
    return proxyMatch[1] + '/api';
  }

  // VS Code code-server environment — route through its proxy to port 5000
  if (port && port !== '5000' && port !== '3000' && port !== '3002') {
    return '/proxy/5000/api';
  }

  // Direct access (localhost:5000, production, etc.)
  return '/api';
};

const api = axios.create({
  baseURL: getApiBase(),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
