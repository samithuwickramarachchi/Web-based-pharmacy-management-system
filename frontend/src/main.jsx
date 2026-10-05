import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import './styles/layout.css';
import './styles/auth.css';
import './styles/dashboard.css';
import './styles/components.css';
import './styles/customer.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
