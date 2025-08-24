## DevLink Backend (Express + MongoDB)

Backend API for DevLink, a developer networking platform. Provides authentication, profiles, posts, projects, skills, connections, notifications, search, and file uploads.

### Tech Stack
- Node.js, Express 5
- MongoDB with Mongoose
- JWT for auth (`x-auth-token` header)
- Multer for uploads
- CORS, dotenv

### Features
- **Auth**: Register, login, get current user.
- **Profiles**: CRUD profile, experience, education; public profile listing.
- **Posts**: CRUD posts, like/unlike, comment CRUD, pin, visibility, edit history.
- **Projects**: CRUD projects, featured listing, per-user listing.
- **Skills**: CRUD skills, categories, search, endorsements.
- **Connections**: Request/accept/reject/remove, suggestions, lists.
- **Notifications**: Like/comment/connection notifications, unread count, mark read, delete.
- **Search**: Users, posts, combined results with connection-aware visibility.
- **Uploads**: Authenticated image upload for project images with 5MB limit.

### Getting Started
```bash
cd devlink-backend
npm install
```

Create `.env` in `devlink-backend/`:

```ini
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>
JWT_SECRET=your_jwt_secret
PORT=5000
```

Run the server:

```bash
# Dev
npm run dev

# Prod
npm start
```

The API listens on `http://localhost:5000` by default. Static uploads are served from `/uploads`.

### Global Behavior
- All private routes require header: `x-auth-token: <JWT>`.
- CORS enabled for development. Adjust origins as needed.
- Uploads directory: `devlink-backend/uploads/` (auto-created). Project images are stored in `uploads/projects` and accessible at `/uploads/projects/<filename>`.

### Routes Overview

#### Auth (`/api/auth`) — `routes/auth.js`
- `POST /register` – Register a user. Returns JWT.
- `POST /login` – Login. Returns JWT.
- `GET /me` – Get current user (private).

#### Profile (`/api/profile`) — `routes/profile.js`
- `GET /me` – Get current user profile (private).
- `POST /` – Create/Update profile (private). Fields: `bio`, `location`, `skills` (array or comma list), `profilePicture`, `social{github,linkedin,twitter}`.
- `GET /` – List all profiles (public).
- `GET /user/:user_id` – Get profile by user id (public).
- `PUT /experience` – Add experience (private).
- `PUT /education` – Add education (private).
- `DELETE /experience/:exp_id` – Remove experience (private).
- `DELETE /education/:edu_id` – Remove education (private).
- `DELETE /` – Delete profile and user (private).

#### Posts (`/api/posts`) — `routes/posts.js`
- `GET /` – Feed for current user (private). Includes public + connections.
- `GET /me` – Current user posts (private).
- `GET /user/:userId` – Public posts by user (public).
- `GET /:id` – Get single post (public).
- `POST /` – Create post (private). Fields: `content`, optional `postType`, `image`, `link`, `project`, `tags`, `visibility`.
- `PUT /:id` – Update own post (private, saves edit history).
- `DELETE /:id` – Delete own post (private).
- `POST /:id/like` – Toggle like (private). Notifies author on like.
- `POST /:id/comment` – Add comment (private). Notifies author.
- `DELETE /:id/comment/:commentId` – Remove own comment or if post owner (private).
- `POST /:id/pin` – Pin/unpin own post (private).

#### Projects (`/api/projects`) — `routes/projects.js`
- `GET /` – List all projects (public).
- `GET /featured/all` – Featured projects (public, limited).
- `GET /me` – Current user projects (private).
- `GET /user/:userId` – Projects by user (public).
- `GET /:id` – Get project (public).
- `POST /` – Create project (private). Required: `title`, `description`, `technologies` (array or comma list). Optional: `projectImage`, `liveUrl`, `githubUrl`, `featured`, `status`, `startDate`, `endDate`.
- `PUT /:id` – Update own project (private).
- `DELETE /:id` – Delete own project (private).

#### Skills (`/api/skills`) — `routes/skills.js`
- `GET /me` – Current user skills (private).
- `GET /user/:userId` – Skills by user (public).
- `GET /categories` – Category counts for current user (private).
- `GET /search` – Search skills across users (public). Query: `q`, `category`, `proficiency`.
- `POST /` – Create skill (private). Unique per user by `name`.
- `PUT /:id` – Update own skill (private).
- `DELETE /:id` – Delete own skill (private).
- `POST /:id/endorse` – Endorse another user's skill (private).
- `DELETE /:id/endorse` – Remove own endorsement (private).

#### Connections (`/api/connections`) — `routes/connections.js`
- `POST /request` – Send request (private).
- `GET /requests/received` – Received requests (private).
- `GET /requests/sent` – Sent requests (private).
- `PUT /:id/accept` – Accept request (private).
- `PUT /:id/reject` – Reject request (private).
- `GET /` – Accepted connections list (private).
- `DELETE /:id` – Remove connection (private).
- `GET /suggestions` – Suggestions (exclude existing/pending) (private).

#### Notifications (`/api/notifications`) — `routes/notifications.js`
- `GET /` – Paginated notifications (private). Includes sender profile picture.
- `GET /unread-count` – Unread count (private).
- `PUT /mark-read` – Mark selected notifications as read (private).
- `PUT /mark-all-read` – Mark all as read (private).
- `DELETE /:id` – Delete a notification (private).
- `DELETE /` – Delete all notifications (private).

#### Search (`/api/search`) — `routes/search.js`
- `GET /users` – Search users by name/email (private). Includes profile and connection status.
- `GET /posts` – Search posts by content/tags (private) with connection-aware visibility.
- `GET /all` – Combined lightweight users+posts result (private).

#### Uploads (`/api/upload`) — `routes/upload.js`
- `POST /project-image` – Upload project image (private, image-only, ≤5MB). Returns `{ imageUrl }` such as `/uploads/projects/<filename>`.
- `DELETE /project-image/:filename` – Delete own uploaded image (private).

### Models
- `User` — name, email, password.
- `Profile` — user ref, bio, location, skills, social, experience, education.
- `Post` — content, type, media/link, tags, likes/comments/shares, visibility, pin/edit history.
- `Project` — title, description, technologies, image, links, status, dates.
- `Skill` — name, category, proficiency, endorsements, certifications, projects.
- `Connection` — requester, recipient, status, timestamps.
- `Notification` — recipient, sender, type, message, refs, read flags, helper statics.

### Headers and Auth
Send the JWT in every private request:

```http
x-auth-token: <JWT>
Content-Type: application/json
```

### Example: Create a Post
```bash
curl -X POST http://localhost:5000/api/posts \
  -H "Content-Type: application/json" \
  -H "x-auth-token: $TOKEN" \
  -d '{
    "content": "Hello DevLink!",
    "postType": "text",
    "visibility": "public"
  }'
```

### Troubleshooting
- 401 Unauthorized: Missing/invalid `x-auth-token`.
- Mongo connection errors: verify `MONGO_URI`.
- CORS blocked: configure allowed origins.
- Upload errors: ensure image file ≤ 5MB and use field name `projectImage`.

### License
Part of the DevLink application.

📘 DevLink – Backend API
DevLink is a full-stack developer networking platform built with the MERN stack (MongoDB, Express, React, Node.js). This is the backend API for user authentication, profile management, and experience/education tracking.

🚀 Features
JWT-based user authentication (/api/auth)

Create and update developer profiles (/api/profile)

Add/remove experience and education

View other developers' public profiles

Secure protected routes via middleware

MongoDB for storage via Mongoose models

🧱 Technologies
Node.js

Express.js

MongoDB + Mongoose

JWT (jsonwebtoken)

bcryptjs

dotenv

Nodemon (dev)

📂 Folder Structure
bash
Copy
Edit
devlink-backend/
├── config/         # DB config
├── middleware/     # Auth middleware
├── models/         # Mongoose schemas (User, Profile)
├── routes/         # API route handlers
├── .env            # Environment variables
├── server.js       # App entry point
└── package.json
🔧 Getting Started
Clone the repository

bash
Copy
Edit
git clone https://github.com/yourusername/devlink-backend.git
cd devlink-backend
Install dependencies

bash
Copy
Edit
npm install
Set up your .env
Create a .env file with:

ini
Copy
Edit
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
Start the server

Dev mode (auto-restart):

bash
Copy
Edit
npm run dev
Production:

bash
Copy
Edit
npm start
📬 API Endpoints
🔐 Auth
Method	Route	Description
POST	/api/auth/register	Register new user
POST	/api/auth/login	Login & get token
GET	/api/auth/me	Get current user

👤 Profile
Method	Route	Description
GET	/api/profile/me	Current user's profile
POST	/api/profile	Create/update profile
GET	/api/profile	Get all profiles
GET	/api/profile/user/:id	Get profile by user ID
PUT	/api/profile/experience	Add experience
PUT	/api/profile/education	Add education
DELETE	/api/profile/experience/:exp_id	Delete experience
DELETE	/api/profile/education/:edu_id	Delete education
DELETE	/api/profile	Delete user and profile

✅ To-Do (Frontend)
Build React frontend (/client)

Integrate form submission and protected routes

Style with Tailwind or CSS framework

🧑‍💻 Author
Built by Prince Raval — open to collaboration & feedback!

