import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// VERCEL DEPLOYMENT:
// 1. Go to vercel.com → New Project
// 2. Import your GitHub repo
// 3. Root directory: client
// 4. Framework preset: Vite
// 5. Add env variables in Vercel dashboard:
//    VITE_API_URL=https://linksphereai.onrender.com/api
//    VITE_SOCKET_URL=https://linksphereai.onrender.com
// 6. Deploy — you get a live URL instantly

