# LinkSphereAI

A full-stack social networking platform for developers — featuring posts, real-time messaging, notifications, follow/connection system, and AI-assisted profile tools.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, Socket.IO Client |
| Backend | Node.js, Express 5, Socket.IO |
| Database | MongoDB, Mongoose |
| Auth | JWT (with server-side blacklist on logout) |
| File Storage | Cloudinary (avatars, cover images, post images) |
| Real-time | Socket.IO (messages, notifications, online status) |

---

## Project Structure

```
LinkSphereAI/
├── server/
│   ├── config/
│   │   ├── cloudinary.js         — Cloudinary + Multer upload config
│   │   └── db.js                 — MongoDB connection via Mongoose
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── commentController.js
│   │   ├── connectionController.js
│   │   ├── followController.js
│   │   ├── likeController.js
│   │   ├── messageController.js
│   │   ├── notificationController.js
│   │   ├── postController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── authMiddleware.js     — JWT verify + blacklist check
│   │   ├── errorMiddleware.js    — Global error + 404 handlers
│   │   └── ownershipMiddleware.js — IDOR prevention for posts/comments
│   ├── models/
│   │   ├── BlacklistedToken.js
│   │   ├── Comment.js
│   │   ├── Connection.js
│   │   ├── Follow.js             — Stub (follows stored on User model)
│   │   ├── Like.js
│   │   ├── Message.js
│   │   ├── Notification.js
│   │   ├── Post.js
│   │   └── User.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── commentRoutes.js
│   │   ├── connectionRoutes.js
│   │   ├── followRoutes.js
│   │   ├── likeRoutes.js
│   │   ├── messageRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── postRoutes.js
│   │   └── userRoutes.js
│   ├── scripts/
│   │   ├── testAuth.js           — Manual auth test script
│   │   └── testPosts.js          — Manual post test script
│   ├── utils/
│   │   ├── generateToken.js      — JWT sign helper
│   │   ├── mentionHelper.js      — @mention parsing utility
│   │   └── notificationHelper.js — DB notification creation + socket emit
│   ├── uploads/                  — Local upload temp folder
│   ├── .env
│   └── server.js                 — Express app + Socket.IO setup + entry point
│
└── client/
    ├── src/
    │   ├── api/
    │   │   └── axios.js          — Axios instance with base URL + auth header
    │   ├── assets/
    │   │   └── hero.png
    │   ├── components/
    │   │   ├── skeletons/
    │   │   │   ├── PostCardSkeleton.jsx
    │   │   │   ├── ProfileSkeleton.jsx
    │   │   │   └── UserItemSkeleton.jsx
    │   │   ├── AppLayout.jsx
    │   │   ├── Avatar.jsx
    │   │   ├── ConnectionButton.jsx
    │   │   ├── EditProfileModal.jsx
    │   │   ├── ErrorBoundary.jsx
    │   │   ├── LogoBadge.jsx
    │   │   ├── MentionInput.jsx
    │   │   ├── Navbar.jsx
    │   │   ├── NotificationDropdown.jsx
    │   │   ├── PostCard.jsx
    │   │   ├── ProfileQRCard.jsx
    │   │   ├── RightPanel.jsx
    │   │   ├── ShareProfileModal.jsx
    │   │   ├── Sidebar.jsx
    │   │   ├── Spinner.jsx
    │   │   └── UserListItem.jsx
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   ├── SocketContext.jsx
    │   │   └── ThemeContext.jsx
    │   ├── hooks/
    │   │   ├── useAuth.js
    │   │   ├── usePageTitle.js
    │   │   ├── useSocket.js
    │   │   └── useSuggestions.js
    │   ├── pages/
    │   │   ├── Connect.jsx
    │   │   ├── CreatePost.jsx
    │   │   ├── Explore.jsx
    │   │   ├── Home.jsx
    │   │   ├── Login.jsx
    │   │   ├── Messages.jsx
    │   │   ├── NotificationsPage.jsx
    │   │   ├── Profile.jsx
    │   │   └── Register.jsx
    │   ├── utils/
    │   │   └── formatDate.js
    │   ├── App.jsx
    │   ├── index.css
    │   └── main.jsx
    ├── public/
    │   ├── favicon.svg
    │   ├── icons.svg
    │   └── index.html
    ├── .env
    ├── index.html
    └── package.json
```

---

## Section 2 — File Summaries

### Server

#### `server.js`
- **Purpose:** Express app entry point — mounts all routes, sets up Socket.IO, applies security middleware, starts HTTP server
- **Key logic:** JWT socket auth, online user tracking (`Map`), typing events, user room joins
- **Connects to:** All route files, all middleware, Socket.IO

---

#### `config/db.js`
- **Purpose:** Connects to MongoDB Atlas using Mongoose
- **Key functions:** `connectDB()`
- **Connects to:** `server.js`

#### `config/cloudinary.js`
- **Purpose:** Configures Cloudinary SDK and Multer storage for image uploads
- **Key exports:** `upload` (Multer middleware), `cloudinary` instance
- **Connects to:** `postRoutes.js`, `userRoutes.js`

---

#### `controllers/authController.js`
- **Purpose:** Handles user registration, login, profile retrieval, logout
- **Functions:** `registerUser`, `loginUser`, `getMe`, `logoutUser`
- **Connects to:** `User.js`, `BlacklistedToken.js`, `generateToken.js`, `authRoutes.js`

#### `controllers/userController.js`
- **Purpose:** User search, profile updates, suggestions, followers/following lists
- **Functions:** `searchUsers`, `getSuggestedUsers`, `refreshSuggestedUsers`, `updateUserProfile`, `getFollowers`, `getFollowing`
- **Connects to:** `User.js`, `userRoutes.js`, `cloudinary.js`

#### `controllers/postController.js`
- **Purpose:** CRUD for posts, feed, explore, search, user profile posts
- **Functions:** `createPost`, `getFeedPosts`, `getExplorePosts`, `getUserPosts`, `updatePost`, `deletePost`, `getUserProfile`, `searchPosts`
- **Connects to:** `Post.js`, `User.js`, `mentionHelper.js`, `notificationHelper.js`, `postRoutes.js`

#### `controllers/commentController.js`
- **Purpose:** Add, read, edit, delete comments on posts
- **Functions:** `addComment`, `getPostComments`, `updateComment`, `deleteComment`
- **Connects to:** `Comment.js`, `Post.js`, `notificationHelper.js`, `commentRoutes.js`

#### `controllers/likeController.js`
- **Purpose:** Toggle like/unlike on posts, fetch post likes
- **Functions:** `toggleLike`, `getPostLikes`
- **Connects to:** `Like.js`, `Post.js`, `notificationHelper.js`, `likeRoutes.js`

#### `controllers/followController.js`
- **Purpose:** Follow/unfollow users, check follow status, get mutual followers
- **Functions:** `toggleFollow`, `checkFollowStatus`, `getMutualFollowers`
- **Connects to:** `User.js`, `notificationHelper.js`, `followRoutes.js`

#### `controllers/connectionController.js`
- **Purpose:** LinkedIn-style connection requests — send, accept/reject, list pending, list accepted
- **Functions:** `sendRequest`, `respondToRequest`, `getMyConnections`, `getPendingRequests`, `findPeople`
- **Connects to:** `Connection.js`, `User.js`, `notificationHelper.js`, `connectionRoutes.js`

#### `controllers/messageController.js`
- **Purpose:** Private messaging between connected users — send, fetch conversation, list conversations, unread count
- **Functions:** `sendMessage`, `getConversation`, `getConversationList`, `getUnreadCount`
- **Connects to:** `Message.js`, `Connection.js`, `User.js`, `messageRoutes.js`, Socket.IO

#### `controllers/notificationController.js`
- **Purpose:** Fetch, mark-read, and mark-all-read for user notifications
- **Functions:** `getNotifications`, `markAsRead`, `markAllAsRead`
- **Connects to:** `Notification.js`, `notificationRoutes.js`

---

#### `middleware/authMiddleware.js`
- **Purpose:** Verifies JWT from Authorization header; checks token is not blacklisted
- **Connects to:** All protected routes, `BlacklistedToken.js`

#### `middleware/errorMiddleware.js`
- **Purpose:** Global 404 and error response handlers
- **Connects to:** `server.js` (mounted last)

#### `middleware/ownershipMiddleware.js`
- **Purpose:** IDOR prevention — confirms the logged-in user owns the post or comment before edit/delete
- **Functions:** `verifyPostOwner`, `verifyCommentOwner`
- **Connects to:** `postRoutes.js`, `commentRoutes.js`

---

#### `utils/generateToken.js`
- **Purpose:** Signs a JWT with user ID and configured secret/expiry
- **Connects to:** `authController.js`

#### `utils/notificationHelper.js`
- **Purpose:** Creates a Notification document in DB and emits `new_notification` via Socket.IO
- **Connects to:** `Notification.js`, all controllers that create notifications

#### `utils/mentionHelper.js`
- **Purpose:** Parses `@username` mentions from text and resolves them to user IDs
- **Connects to:** `postController.js`, `commentController.js`

---

### Client

#### `api/axios.js`
- **Purpose:** Pre-configured Axios instance — sets base URL from `VITE_API_URL` and attaches JWT Bearer token from localStorage on every request
- **Connects to:** All page and context files that call the API

#### `context/AuthContext.jsx`
- **Purpose:** Global auth state — stores user object and token, exposes login/logout/update helpers
- **Connects to:** `App.jsx`, all pages/components via `useAuth`

#### `context/SocketContext.jsx`
- **Purpose:** Manages Socket.IO connection, online users, notifications, pending connection count, real-time events
- **Key state:** `socket`, `onlineUsers`, `notifications`, `unreadCount`, `pendingConnectionCount`, `newConnectionRequest`
- **Connects to:** All components that need real-time data

#### `context/ThemeContext.jsx`
- **Purpose:** Dark/light theme toggle — persists to localStorage
- **Connects to:** `App.jsx`, `Sidebar.jsx`

#### `hooks/useAuth.js`
- **Purpose:** Shortcut hook — returns value from `AuthContext`

#### `hooks/useSocket.js`
- **Purpose:** Shortcut hook — returns value from `SocketContext`

#### `hooks/usePageTitle.js`
- **Purpose:** Sets `document.title` dynamically per page

#### `hooks/useSuggestions.js`
- **Purpose:** Fetches and manages "People you may know" suggestions

#### `components/AppLayout.jsx`
- **Purpose:** Root layout wrapper — renders `Sidebar`, `Navbar`, main content area, `RightPanel`

#### `components/Sidebar.jsx`
- **Purpose:** Left navigation — Home, Explore, Notifications, Connect, Messages, Profile, Create Post; shows unread badges; user profile card
- **Connects to:** `useSocket`, `useAuth`, `/messages/unread-count` API

#### `components/Navbar.jsx`
- **Purpose:** Top bar — logo, notification bell, theme toggle, mobile menu

#### `components/Avatar.jsx`
- **Purpose:** Reusable user avatar with optional online status dot and ring

#### `components/PostCard.jsx`
- **Purpose:** Renders a single post with like, comment, share, edit/delete actions

#### `components/NotificationDropdown.jsx`
- **Purpose:** Bell dropdown showing real-time notifications with mark-read actions

#### `components/ConnectionButton.jsx`
- **Purpose:** Context-aware button — shows Connect+, Requested, or Message based on connection status

#### `components/EditProfileModal.jsx`
- **Purpose:** Modal form for updating name, bio, avatar, cover image, website, location

#### `components/MentionInput.jsx`
- **Purpose:** Textarea with live `@mention` autocomplete for post/comment creation

#### `components/RightPanel.jsx`
- **Purpose:** Right sidebar — suggested users, trending topics

#### `components/ProfileQRCard.jsx`
- **Purpose:** Generates a QR code for the user's profile link

#### `components/ShareProfileModal.jsx`
- **Purpose:** Share sheet — copy link, share via QR, social share buttons

#### `components/LogoBadge.jsx`
- **Purpose:** Branded logo component used in navbar and auth pages

#### `components/Spinner.jsx`
- **Purpose:** Loading spinner with configurable size and color

#### `components/UserListItem.jsx`
- **Purpose:** Compact user row — avatar, name, username, follow/connect button

#### `components/ErrorBoundary.jsx`
- **Purpose:** React error boundary — catches render errors and shows fallback UI

#### `components/skeletons/PostCardSkeleton.jsx`
- **Purpose:** Animated skeleton placeholder for post cards while loading

#### `components/skeletons/ProfileSkeleton.jsx`
- **Purpose:** Animated skeleton for profile page

#### `components/skeletons/UserItemSkeleton.jsx`
- **Purpose:** Animated skeleton for user list items

#### `pages/Home.jsx`
- **Purpose:** Feed page — fetches followed users' posts, infinite scroll, create post shortcut

#### `pages/Explore.jsx`
- **Purpose:** Explore/discover page — trending posts, search by keyword

#### `pages/Profile.jsx`
- **Purpose:** User profile page — avatar, bio, posts, follow/connect button, edit profile

#### `pages/CreatePost.jsx`
- **Purpose:** Post creation page — text + image upload, @mention support

#### `pages/Connect.jsx`
- **Purpose:** Connection management — Find People (search), Pending Requests, My Connections tabs

#### `pages/Messages.jsx`
- **Purpose:** Real-time private messaging — conversation list (left) + chat window (right); uses `myId` from server for identity-safe rendering
- **Key features:** No duplicate messages, typing indicators, auto-scroll, 30/70 layout

#### `pages/NotificationsPage.jsx`
- **Purpose:** Full notifications list page — all notification types with mark-read

#### `pages/Login.jsx`
- **Purpose:** Login form with JWT auth

#### `pages/Register.jsx`
- **Purpose:** Registration form — name, username, email, password

#### `utils/formatDate.js`
- **Purpose:** Converts timestamps to human-readable relative time ("2 hours ago", "Jan 5, 2025")

---

## Section 3 — API Routes

### Auth — `/api/auth`

| Method | Route | Controller | Auth Required |
|--------|-------|-----------|--------------|
| POST | `/api/auth/register` | `registerUser` | No |
| POST | `/api/auth/login` | `loginUser` | No |
| GET | `/api/auth/me` | `getMe` | Yes |
| POST | `/api/auth/logout` | `logoutUser` | Yes |

### Users — `/api/users`

| Method | Route | Controller | Auth Required |
|--------|-------|-----------|--------------|
| GET | `/api/users/search` | `searchUsers` | Yes |
| GET | `/api/users/suggestions` | `getSuggestedUsers` | Yes |
| GET | `/api/users/suggestions/refresh` | `refreshSuggestedUsers` | Yes |
| PUT | `/api/users/update` | `updateUserProfile` | Yes |
| GET | `/api/users/:userId/followers` | `getFollowers` | Yes |
| GET | `/api/users/:userId/following` | `getFollowing` | Yes |

### Posts — `/api/posts`

| Method | Route | Controller | Auth Required |
|--------|-------|-----------|--------------|
| POST | `/api/posts` | `createPost` | Yes |
| GET | `/api/posts/feed` | `getFeedPosts` | Yes |
| GET | `/api/posts/explore` | `getExplorePosts` | Yes |
| GET | `/api/posts/user/:username` | `getUserPosts` | Yes |
| GET | `/api/posts/profile/:username` | `getUserProfile` | Yes |
| GET | `/api/posts/search` | `searchPosts` | Yes |
| PUT | `/api/posts/:id` | `updatePost` | Yes (owner only) |
| DELETE | `/api/posts/:id` | `deletePost` | Yes (owner only) |

### Comments — `/api/comments`

| Method | Route | Controller | Auth Required |
|--------|-------|-----------|--------------|
| POST | `/api/comments/:postId` | `addComment` | Yes |
| GET | `/api/comments/:postId` | `getPostComments` | Yes |
| PUT | `/api/comments/:commentId` | `updateComment` | Yes (owner only) |
| DELETE | `/api/comments/:commentId` | `deleteComment` | Yes (owner only) |

### Likes — `/api/likes`

| Method | Route | Controller | Auth Required |
|--------|-------|-----------|--------------|
| POST | `/api/likes/:postId` | `toggleLike` | Yes |
| GET | `/api/likes/:postId` | `getPostLikes` | Yes |

### Follow — `/api/follow`

| Method | Route | Controller | Auth Required |
|--------|-------|-----------|--------------|
| POST | `/api/follow/:userId` | `toggleFollow` | Yes |
| GET | `/api/follow/status/:userId` | `checkFollowStatus` | Yes |
| GET | `/api/follow/mutual/:userId` | `getMutualFollowers` | Yes |

### Connections — `/api/connections`

| Method | Route | Controller | Auth Required |
|--------|-------|-----------|--------------|
| GET | `/api/connections/find` | `findPeople` | Yes |
| GET | `/api/connections/pending` | `getPendingRequests` | Yes |
| GET | `/api/connections` | `getMyConnections` | Yes |
| POST | `/api/connections/request/:userId` | `sendRequest` | Yes |
| PUT | `/api/connections/respond/:connectionId` | `respondToRequest` | Yes |

### Messages — `/api/messages`

| Method | Route | Controller | Auth Required |
|--------|-------|-----------|--------------|
| GET | `/api/messages/unread-count` | `getUnreadCount` | Yes |
| GET | `/api/messages` | `getConversationList` | Yes |
| GET | `/api/messages/:userId` | `getConversation` | Yes |
| POST | `/api/messages/:userId` | `sendMessage` | Yes |

### Notifications — `/api/notifications`

| Method | Route | Controller | Auth Required |
|--------|-------|-----------|--------------|
| GET | `/api/notifications` | `getNotifications` | Yes |
| PUT | `/api/notifications/read-all` | `markAllAsRead` | Yes |
| PUT | `/api/notifications/:id/read` | `markAsRead` | Yes |

---

## Section 4 — Database Models

### User Model

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | String | Yes | max 50 chars |
| username | String | Yes | unique, lowercase, alphanumeric+underscore |
| email | String | Yes | unique, lowercase |
| password | String | Yes | min 6 chars, select: false |
| avatar | String | No | Cloudinary URL |
| coverImage | String | No | Cloudinary URL |
| bio | String | No | max 200 chars |
| website | String | No | |
| location | String | No | |
| followers | [ObjectId] | No | ref: User |
| following | [ObjectId] | No | ref: User |
| isVerified | Boolean | No | default: false |
| role | String | No | enum: user/admin |
| createdAt | Date | Auto | timestamps |
| updatedAt | Date | Auto | timestamps |

### Post Model

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| user | ObjectId | Yes | ref: User |
| content | String | Conditional | required if no image, max 500 |
| image | String | No | Cloudinary URL |
| likesCount | Number | No | default: 0 |
| commentsCount | Number | No | default: 0 |
| isEdited | Boolean | No | default: false |
| mentions | [ObjectId] | No | ref: User |
| createdAt | Date | Auto | |
| updatedAt | Date | Auto | |

### Comment Model

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| post | ObjectId | Yes | ref: Post |
| user | ObjectId | Yes | ref: User |
| text | String | Yes | max 300 chars |
| isEdited | Boolean | No | default: false |
| mentions | [ObjectId] | No | ref: User |
| createdAt | Date | Auto | |
| updatedAt | Date | Auto | |

### Like Model

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| post | ObjectId | Yes | ref: Post |
| user | ObjectId | Yes | ref: User |
| createdAt | Date | Auto | compound unique index (post+user) |

### Connection Model

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| sender | ObjectId | Yes | ref: User |
| receiver | ObjectId | Yes | ref: User |
| status | String | No | enum: pending/accepted/rejected |
| createdAt | Date | Auto | |
| updatedAt | Date | Auto | |

### Message Model

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| conversationId | String | Yes | sorted join of sender+receiver IDs |
| sender | ObjectId | Yes | ref: User |
| receiver | ObjectId | Yes | ref: User |
| text | String | Yes | max 1000 chars |
| isRead | Boolean | No | default: false |
| createdAt | Date | Auto | |
| updatedAt | Date | Auto | |

### Notification Model

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| recipient | ObjectId | Yes | ref: User |
| sender | ObjectId | Yes | ref: User |
| type | String | Yes | enum: like/comment/follow/mention/connection_request/connection_accepted |
| post | ObjectId | No | ref: Post, nullable |
| isRead | Boolean | No | default: false |
| createdAt | Date | Auto | |
| updatedAt | Date | Auto | |

### BlacklistedToken Model

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| token | String | Yes | unique |
| expiresAt | Date | Yes | TTL index — MongoDB auto-deletes expired docs |
| createdAt | Date | Auto | |

---

## Section 5 — Socket Events

### Server → Client

| Event | Emitted By | Received By | Data |
|-------|-----------|-------------|------|
| `user_online` | Server (on connect) | All connected clients | `{ userId }` |
| `user_offline` | Server (on disconnect) | All connected clients | `{ userId }` |
| `online_users_list` | Server | Requesting client only | `[userId, ...]` |
| `new_message` | Server (via `sendMessage`) | Receiver only | Full populated message object |
| `user_typing` | Server | Receiver only | `{ senderId }` |
| `user_stop_typing` | Server | Receiver only | `{ senderId }` |
| `new_notification` | Server (via `notificationHelper`) | Recipient only | Full populated notification object |
| `connection_request` | Server (via `sendRequest`) | Receiver only | Populated Connection object |
| `connection_accepted` | Server (via `respondToRequest`) | Original sender | Populated Connection object |

### Client → Server

| Event | Emitted By | Data | Purpose |
|-------|-----------|------|---------|
| `get_online_users` | Client (on socket connect) | none | Request current online list |
| `typing` | `Messages.jsx` | `{ receiverId }` | Tell receiver you are typing |
| `stop_typing` | `Messages.jsx` | `{ receiverId }` | Tell receiver you stopped typing |

---

## Section 6 — Environment Variables

### Server (`server/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | Secret key for signing JWTs |
| `JWT_EXPIRE` | Yes | JWT expiry (e.g. `30d`) |
| `CLIENT_URL` | Yes | Frontend origin for CORS (e.g. `http://localhost:5173`) |
| `CLIENT_URL_PROD` | No | Production frontend URL for CORS |
| `CLOUDINARY_CLOUD_NAME` | Yes | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret |
| `PORT` | No | Server port (default: 5000) |
| `NODE_ENV` | No | `development` or `production` |

### Client (`client/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend API base URL (e.g. `http://localhost:5000/api`) |
| `VITE_SOCKET_URL` | Yes | Socket.IO server URL (e.g. `http://localhost:5000`) |
| `VITE_APP_URL` | Yes | Frontend app URL (e.g. `http://localhost:5173`) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Cloudinary account

### Install & Run

```bash
# Server
cd server
npm install
npm run dev        # nodemon server.js

# Client (new terminal)
cd client
npm install
npm run dev        # vite
```

### Build for Production

```bash
# Client
cd client
npm run build      # output → client/dist

# Server
cd server
npm start          # node server.js
```

---

## Scripts

| Location | Command | Description |
|----------|---------|-------------|
| `server/` | `npm run dev` | Start server with nodemon |
| `server/` | `npm start` | Start server (production) |
| `client/` | `npm run dev` | Start Vite dev server |
| `client/` | `npm run build` | Build for production |
| `client/` | `npm run lint` | Run oxlint |
| `client/` | `npm run preview` | Preview production build |

---

## Deployment

### Server (Render)
1. New Web Service → connect GitHub repo
2. Root directory: `server`
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add all server env vars in Render dashboard

### Client (Vercel)
1. Import GitHub repo
2. Root directory: `client`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add all client env vars in Vercel dashboard

---

*Built for CodeAlpha — v1.0.0*
