import React from 'react';
import ReactDOM from 'react-dom/client';

// *** THIS MUST POINT TO './App.js' (assuming you renamed the main file in src) ***
import App from './App.js'; 

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App /> 
  </React.StrictMode>
);
