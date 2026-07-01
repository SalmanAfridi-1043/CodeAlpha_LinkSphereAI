import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// VERCEL DEPLOYMENT STEPS:
// 1. vercel.com → New Project
// 2. Import GitHub repo
// 3. Root directory: client
// 4. Framework preset: Vite
// 5. Add env vars in Vercel dashboard
// 6. Deploy — get your live URL
// 7. Paste live URL into Render CLIENT_URL_PROD


