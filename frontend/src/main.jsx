import { createRoot } from 'react-dom/client'
import './styles/main.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { AppearanceProvider } from './contexts/AppearanceContext.jsx'

createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <AppearanceProvider>
      <App />
    </AppearanceProvider>
  </AuthProvider>,
)
