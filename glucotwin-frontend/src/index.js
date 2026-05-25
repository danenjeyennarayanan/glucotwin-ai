import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import GlucoTwinApp from './GlucoTwinAI';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <GlucoTwinApp />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
