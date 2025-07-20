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

