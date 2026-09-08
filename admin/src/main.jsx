import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

import './assets/css/variables.css'
import './assets/css/reset.css'
import './assets/css/layout.css'
import './assets/css/forms.css'
import './assets/css/cards.css'
import './assets/css/tables.css'
import './assets/css/dashboard.css'
import './assets/css/responsive.css'

const isAdminPath = window.location.pathname.startsWith('/admin');
const isPanelPath = window.location.pathname.startsWith('/panel');
const basename = isAdminPath ? "/admin" : (isPanelPath ? "/panel" : undefined);

// Global backdrop click interception:
// Prevents all modals in the application from closing when clicking outside on their backdrop overlay.
document.addEventListener('click', (e) => {
    if (e.target && e.target.classList && e.target.classList.contains('modal-backdrop')) {
        e.stopPropagation();
        e.stopImmediatePropagation();
    }
}, true); // Use capture phase to intercept before React synthetic event handlers fire


ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter basename={basename}>
            <App />
        </BrowserRouter>
    </React.StrictMode>
)