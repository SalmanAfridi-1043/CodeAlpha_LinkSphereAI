# LinkSphereAI 🌐

A modern full-stack social media platform with real-time notifications, a theme toggle system, and a sleek responsive UI layout shell.

## 🚀 Live Demo
- **Live Link:** [https://linksphereai-frontend.vercel.app](https://linksphereai-frontend.vercel.app)
- **Backend API:** [https://linksphereai.onrender.com](https://linksphereai.onrender.com)

---

## ✨ Features
- 🔐 **Secure Authentication** — JWT token-based register, login, and sessions.
- 🌙 **Persistent Theme System** — Instant dark/light mode toggle saved to localStorage.
- 📱 **Fluid Responsive Layout** — Dynamic Navbar, collapsible icon-only tablet Sidebar, RightPanel statistics, and mobile bottom navigation.
- 🟢 **Real-Time Presence** — Active online indicators, notification badges, and messaging streams via Socket.io.
- 📝 **Interactive Media Feed** — Cloudinary image upload, comments flow, infinite feed scroll, and user followers streams.
- 🛡️ **Defensive UX & Skeletons** — Custom ErrorBoundary fallbacks and detailed loading skeletons for profile card components.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React.js + Vite + Tailwind CSS + Axios |
| **Backend** | Node.js + Express.js |
| **Database** | MongoDB + Mongoose |
| **Real-Time** | Socket.io |
| **Media** | Cloudinary |
| **Security** | JWT + bcryptjs |
| **Deployment** | Vercel (Frontend) + Render (Backend) |

---

## 📁 Project Structure

```text
CodeAlpha_LinkSphereAI/
├── server/                 # Express.js backend
│   ├── config/             # DB & Cloudinary config
│   ├── controllers/        # Route handlers
│   ├── middleware/         # Auth & error middleware
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API routes
│   ├── utils/              # Helper utilities
│   ├── .renderignore       # Render ignore configs
│   └── server.js           # Entry point
├── client/                 # React frontend
│   ├── public/             # Static public assets
│   ├── vercel.json         # Vercel SPA redirects
│   ├── .env.production     # Production endpoints
│   └── src/
│       ├── api/            # Axios setup
│       ├── components/     # Reusable UI components
│       │   └── skeletons/  # Loading skeleton displays
│       ├── context/        # React context providers
│       ├── hooks/          # Custom hooks
│       ├── pages/          # Private and public route pages
│       ├── utils/          # Formatting helpers
│       ├── App.jsx         # App router config
│       ├── index.css       # Global styles and overrides
│       └── main.jsx        # Main DOM entrypoint
└── README.md
```

---

## ⚙️ Setup Instructions

### 1. Backend Server Setup
```bash
cd server
npm install
```
Configure a `.env` file in the `server/` directory:
```env
PORT=5000
MONGO_URI=your-mongodb-atlas-connection-string
JWT_SECRET=your-jwt-signing-secret
JWT_EXPIRE=30d
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
CLIENT_URL=http://localhost:5173
CLIENT_URL_PROD=https://linksphereai-frontend.vercel.app
```
Start development backend:
```bash
npm run dev
```

### 2. Frontend Client Setup
```bash
cd client
npm install
```
Configure a `.env` file in the `client/` directory for local development:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```
Start development client:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔑 Environment Variables References

### Server Configurations (`server/.env`)
- `PORT`: Execution port (default `5000`).
- `MONGO_URI`: Remote MongoDB Cluster cloud connection URI.
- `JWT_SECRET`: Signature encryption seed.
- `CLIENT_URL`: Local CORS development frontend url.
- `CLIENT_URL_PROD`: Vercel production frontend CORS registration URL.

### Client Configurations (`client/.env.production`)
- `VITE_API_URL`: Root API endpoints route base pointer.
- `VITE_SOCKET_URL`: Production socket cluster listener server.

---

## 📸 Screenshots

### Dark Mode (Default)
![Dark UI Mockup](https://raw.githubusercontent.com/SalmanAfridi-1043/CodeAlpha_LinkSphereAI/main/docs/screenshots/dark_mode_mock.png)

### Light Mode Toggle
![Light UI Mockup](https://raw.githubusercontent.com/SalmanAfridi-1043/CodeAlpha_LinkSphereAI/main/docs/screenshots/light_mode_mock.png)

---

## 👨💻 Author
Built by **Salman Afridi** for CodeAlpha Internship.
- GitHub: [SalmanAfridi-1043](https://github.com/SalmanAfridi-1043)
