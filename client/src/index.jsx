import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App';

window.addEventListener('error', (e) => {
  const root = document.getElementById('root');
  if (root && !root.hasChildNodes()) {
    root.innerHTML = `<div style="padding:40px;font-family:monospace">
      <h1 style="color:red">JS Error</h1>
      <pre>${e.message}\n${e.filename}:${e.lineno}</pre>
    </div>`;
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
