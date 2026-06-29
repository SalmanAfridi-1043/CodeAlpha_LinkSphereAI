# LinkSphereAI

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

A modern full-stack social media platform with real-time features, AI-powered interactions, and a sleek dark UI.

## Features

- **User Authentication** — Secure JWT-based registration and login
- **Social Feed** — Create, view, and interact with posts
- **Real-Time Updates** — Live notifications and interactions via Socket.io
- **Image Uploads** — Cloudinary-powered media storage
- **Follow System** — Connect with other users
- **Comments & Likes** — Engage with content in real time
- **Explore** — Discover new users and trending content
- **Dark UI** — Modern, responsive design with Tailwind CSS

## Tech Stack

| Layer      | Technology                          |
| ---------- | ----------------------------------- |
| Frontend   | React, Vite, Tailwind CSS           |
| Backend    | Node.js, Express.js                 |
| Database   | MongoDB, Mongoose                   |
| Auth       | JSON Web Tokens (JWT)               |
| Real-Time  | Socket.io                           |
| Media      | Cloudinary                          |
| Deployment | Vercel (frontend), Render (backend) |

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/CodeAlpha_LinkSphereAI.git
   cd CodeAlpha_LinkSphereAI
   ```

2. **Set up the backend**

   ```bash
   cd server
   npm install
   # Configure server/.env (see Environment Variables)
   npm run dev
   ```

3. **Set up the frontend**

   ```bash
   cd client
   npm install
   # Configure client/.env (see Environment Variables)
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Environment Variables

### Server (`server/.env`)

| Variable                 | Description                    |
| ------------------------ | ------------------------------ |
| `PORT`                   | Server port (default: 5000)    |
| `MONGO_URI`              | MongoDB connection string      |
| `JWT_SECRET`             | Secret key for JWT signing     |
| `JWT_EXPIRE`             | Token expiration (e.g. `30d`)  |
| `CLOUDINARY_CLOUD_NAME`  | Cloudinary cloud name          |
| `CLOUDINARY_API_KEY`     | Cloudinary API key             |
| `CLOUDINARY_API_SECRET`  | Cloudinary API secret          |
| `NODE_ENV`               | `development` or `production`  |
| `CLIENT_URL`             | Frontend URL for CORS          |

### Client (`client/.env`)

| Variable           | Description              |
| ------------------ | ------------------------ |
| `VITE_API_URL`     | Backend API base URL     |
| `VITE_SOCKET_URL`  | Socket.io server URL     |

## Folder Structure

```
CodeAlpha_LinkSphereAI/
├── server/                 # Express.js backend
│   ├── config/             # DB & Cloudinary config
│   ├── controllers/        # Route handlers
│   ├── middleware/         # Auth & error middleware
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API routes
│   ├── utils/              # Helper utilities
│   └── server.js           # Entry point
├── client/                 # React frontend
│   ├── public/
│   └── src/
│       ├── api/            # Axios instance
│       ├── components/     # Reusable UI components
│       ├── context/        # React context providers
│       ├── hooks/          # Custom hooks
│       ├── pages/          # Route pages
│       └── utils/          # Helper functions
└── README.md
```

## Screenshots

> Screenshots will be added as the UI is built in later parts.

<!-- ![Home Feed](./docs/screenshots/home.png) -->
<!-- ![Profile Page](./docs/screenshots/profile.png) -->

## Live Demo

> Live demo links will be added after deployment.

- **Frontend:** _Coming soon — Vercel_
- **Backend API:** _Coming soon — Render_

## Author

Built as part of the **CodeAlpha LinkSphereAI** full-stack social media project.
