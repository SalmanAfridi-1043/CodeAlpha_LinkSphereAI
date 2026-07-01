# LinkSphereAI 🌐
> Modern full-stack social media with real-time
> features and a sleek dark UI — Built for CodeAlpha

## 🚀 Live Demo
[https://linksphereai-frontend.vercel.app](https://linksphereai-frontend.vercel.app)

## ✨ Features
- 🔐 JWT Auth (register / login / logout)
- 👤 User profiles + avatar + cover image
- 📝 Posts with image uploads (Cloudinary)
- ❤️ Likes & comments with live counts
- 👥 Follow system with smart feed filter
- 🔔 Real-time notifications (Socket.io)
- 🟢 Online/offline status
- 🌙 Dark / Light mode
- 📱 Fully responsive

## 🛠 Tech Stack
| Layer     | Tech                        |
|-----------|-----------------------------|
| Frontend  | React + Vite + Tailwind CSS |
| Backend   | Node.js + Express.js        |
| Database  | MongoDB + Mongoose          |
| Auth      | JWT + bcryptjs              |
| Real-Time | Socket.io                   |
| Images    | Cloudinary                  |
| Deploy    | Vercel + Render             |

## ⚙️ Local Setup

# Backend
cd server && npm install && npm run dev

# Frontend
cd client && npm install && npm run dev

## 🔑 Env Variables
Server: PORT, MONGO_URI, JWT_SECRET, JWT_EXPIRE, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLIENT_URL, CLIENT_URL_PROD

Client: VITE_API_URL, VITE_SOCKET_URL

## 👨💻 Author
Salman Afridi — CodeAlpha Full Stack Internship
GitHub: [SalmanAfridi-1043](https://github.com/SalmanAfridi-1043)
