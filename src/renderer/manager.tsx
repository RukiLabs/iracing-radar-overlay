import React from 'react';
import ReactDOM from 'react-dom/client';
import ManagerApp from './ManagerApp';
import './styles/globals.css';
import './styles/manager.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ManagerApp />
  </React.StrictMode>
);
