import React from 'react';
import ReactDOM from 'react-dom/client';

// Import your main component file
import App from './MummyVotePortal.jsx'; 

// This assumes your public/index.html has <div id="root"></div>
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    {/* Render your main component */}
    <App /> 
  </React.StrictMode>
);
