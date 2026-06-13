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

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter >
        {/* <BrowserRouter basename="/admin"> */}
            <App />
        </BrowserRouter>
    </React.StrictMode>
)