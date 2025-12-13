import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { InvitationsProvider } from './context/InvitationsContext'
import { PresenceProvider } from './context/PresenceContext'
import { ToastProvider } from './components/ui/Toast'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="theme">
        <AuthProvider>
          <PresenceProvider>
            <InvitationsProvider>
              <ToastProvider>
                <App />
              </ToastProvider>
            </InvitationsProvider>
          </PresenceProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)
