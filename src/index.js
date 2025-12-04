import React from 'react';
import ReactDOM from 'react-dom/client';

// The import path is now simpler because App.jsx is in the same folder as index.js
import App from './App.jsx'; 

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App /> 
  </React.StrictMode>
);
