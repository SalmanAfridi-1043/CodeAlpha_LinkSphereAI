# **LinkSphereAI**

A full-stack social networking platform for developers — connect, share, and collaborate in real-time.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![React](https://img.shields.io/badge/react-19.0.0-blue.svg)
![MongoDB](https://img.shields.io/badge/mongodb-Atlas-green.svg)
![Made with Love](https://img.shields.io/badge/made%20with-%E2%9D%A4-red.svg)

---

## Overview

LinkSphereAI is a comprehensive social networking platform designed for developers to connect, share knowledge, and collaborate. Built with the MERN stack and enhanced with real-time capabilities via Socket.IO, it features posts, likes, comments, a dual relationship system (follow + connect), private messaging, and instant notifications.

---

## Features

### Social
- Create, edit, and delete posts with text and images
- Like and comment on posts
- @mention users in posts and comments
- Explore trending content and search posts

### Connections
- **Follow**: One-way relationship to see a user's posts in your feed
- **Connect**: Mutual connection request system (LinkedIn-style) required for direct messaging
- View followers and following lists
- Discover new people through suggestions

### Real-Time Messaging
- Private messaging between connected users only
- Real-time message delivery via Socket.IO
- Typing indicators
- Unread message count
- Conversation history

### Notifications
- Real-time notifications for likes, comments, follows, mentions
- Connection request and acceptance alerts
- Mark notifications as read
- Notification dropdown with unread count

### Explore & Search
- Search for users by name or username
- Search posts by content
- Discover trending posts
- "People you may know" suggestions

### Security
- JWT-based authentication
- Token blacklist on logout for immediate session invalidation
- Ownership middleware prevents IDOR (users cannot edit/delete others' content)
- Password hashing with bcrypt

### UI/UX
- Fully responsive design (mobile, tablet, desktop)
- Dark/light theme toggle with persistence
- Mobile-friendly navigation menu
- Loading skeletons for smooth UX
- Profile QR code sharing

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, Tailwind CSS, Socket.io-client, Axios |
| Backend | Node.js, Express, Socket.io, JWT, Multer |
| Database | MongoDB Atlas + Mongoose |
| Storage | Cloudinary |
| Dev Tools | Nodemon, Concurrently |

---

## Project Structure

```
LinkSphereAI/
├── server/
│   ├── config/          # Database and Cloudinary configuration
│   ├── controllers/     # Request handlers for all features
│   ├── middleware/      # Auth, error handling, ownership verification
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API route definitions
│   ├── scripts/         # Test scripts
│   ├── utils/           # Helper functions (JWT, notifications, mentions)
│   ├── uploads/         # Temporary upload storage
│   └── server.js        # Entry point
│
└── client/
    ├── public/          # Static assets
    ├── src/
    │   ├── api/         # Axios configuration
    │   ├── assets/      # Images and icons
    │   ├── components/  # Reusable UI components
    │   ├── context/     # React contexts (Auth, Socket, Theme)
    │   ├── hooks/       # Custom React hooks
    │   ├── pages/       # Page components
    │   └── utils/       # Utility functions
    └── index.html
```

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm
- MongoDB Atlas account
- Cloudinary account

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd LinkSphereAI

# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Environment Variables

Create `.env` files in both `server/` and `client/` directories:

**Server (`server/.env`)**

```env
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d
CLIENT_URL=http://localhost:5173
PORT=5000
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

**Client (`client/.env`)**

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### Running the Application

```bash
# From project root
npm run dev
```

This starts both the server (port 5000) and client (port 5173) concurrently using Concurrently.

---

## Core Concepts

### Follow vs Connect

LinkSphereAI implements two distinct relationship types:

- **Follow**: A one-way relationship where you can follow another user to see their posts in your feed. Following does not grant messaging privileges. Use this to stay updated with content from developers you admire.

- **Connect**: A mutual relationship requiring both parties to accept. Connection requests must be sent and accepted before a connection is established. Only connected users can exchange private messages. Use this for professional networking and direct collaboration.

### Messaging Permissions

Private messaging is exclusively available between connected users. Even if you follow someone or they follow you, you cannot send messages until a mutual connection is established. This ensures that messaging is consensual and limited to confirmed professional relationships.

---

## Security Notes

- **JWT Authentication**: Users receive a JWT token upon login, which is stored in localStorage and sent with every API request.
- **Token Blacklist**: On logout, the JWT is added to a server-side blacklist with a TTL index, preventing reuse even if the token is still valid.
- **Ownership Middleware**: All edit and delete operations verify that the authenticated user owns the resource (post, comment), preventing Insecure Direct Object Reference (IDOR) attacks.
- **Password Hashing**: All passwords are hashed using bcrypt before storage in the database.

---

## Deployment

### Frontend (Vercel/Netlify)

1. Connect your GitHub repository to Vercel or Netlify
2. Set root directory to `client`
3. Configure build command: `npm run build`
4. Set output directory: `dist`
5. Add client environment variables in the deployment dashboard
6. Deploy

### Backend (Render/Railway)

1. Connect your GitHub repository to Render or Railway
2. Set root directory to `server`
3. Configure build command: `npm install`
4. Set start command: `node server.js`
5. Add server environment variables in the deployment dashboard
6. Update `CLIENT_URL` to match your deployed frontend URL
7. Deploy

### Database & Storage

- **MongoDB Atlas**: Already hosted in the cloud; just update `MONGO_URI` in production
- **Cloudinary**: Already hosted; ensure API credentials are set in production environment variables

**Important**: After deployment, update `CLIENT_URL` in your server environment variables to point to your production frontend URL to ensure proper CORS configuration.

---

## Roadmap

Potential future enhancements:

- Read receipts for messages
- Voice message support
- Group conversations
- Post scheduling
- Analytics dashboard
- Advanced search filters
- Video posts
- Bookmark/save posts
- Report content functionality

---

## License

This project is licensed under the MIT License.

---

## Credits

Built by Salman Afridi
