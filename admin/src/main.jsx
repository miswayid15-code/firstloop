// src/main.jsx

import { StrictMode } from 'react'
import logo from './assets/image/logo.png'
import { createRoot } from 'react-dom/client'

import {
  BrowserRouter,
  Routes,
  Route
} from 'react-router-dom'

import './index.css'

import './assets/css/variables.css'
import './assets/css/reset.css'
import './assets/css/layout.css'
import './assets/css/forms.css'

import '@fortawesome/fontawesome-free/css/all.min.css'

import Header from './components/Header'
import Footer from './components/Footer'

import App from './App.jsx'

import Dashboard from './pages/Dashboard.jsx'

createRoot(document.getElementById('root')).render(

  <StrictMode>

    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<App />}
        />

        <Route
          path="/dashboard"
          element={
            <>

              <Header />

              <Dashboard />

              <Footer />

            </>
          }
        />

      </Routes>

    </BrowserRouter>

  </StrictMode>

)