import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
// This is a known issue with recharts and ResizeObserver
// It's a benign error and can be safely ignored.
const RO_ERROR_MSG = 'ResizeObserver loop completed with undelivered notifications';
window.addEventListener('error', e => {
  if (e.message === RO_ERROR_MSG) {
    // Prevent the error from appearing in the console
    e.stopImmediatePropagation();
  }
});
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
