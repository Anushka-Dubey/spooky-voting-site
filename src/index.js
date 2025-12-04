import React from 'react';
import ReactDOM from 'react-dom/client';

// *** NEW: Importing the global CSS file ***
import './index.css'; 

// This must point to the file you just renamed: App.js
import App from './App.js'; 

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App /> 
  </React.StrictMode>
);
