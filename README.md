# 🌐 DevLink Backend API

A comprehensive RESTful API for the DevLink developer networking platform, built with Node.js, Express 5, and MongoDB. This backend powers a complete social networking experience for developers with authentication, profiles, posts, projects, skills management, connections, notifications, and file uploads.

## ✨ Features

### 🔐 Authentication & Security
- **JWT Authentication** - Secure token-based auth with `x-auth-token` header
- **Password Encryption** - bcryptjs for secure password hashing
- **Protected Routes** - Middleware-based route protection
- **Session Management** - Persistent user sessions with JWT tokens

### 👤 Profile Management
- **Developer Profiles** - Comprehensive user profiles with bio, location, and social links
- **Experience & Education** - Complete career and academic history tracking
- **Skills Management** - Categorized skills with proficiency levels and endorsements
- **Public Profile Discovery** - Browse and discover developer profiles

### 📝 Social Features
- **Posts & Feed** - Create, edit, and share posts with the developer community
- **Post Interactions** - Like, comment, pin, and share functionality
- **Visibility Controls** - Public and connection-based post visibility
- **Edit History** - Track post modifications with version history

### 🚀 Project Showcase
- **Project Portfolio** - Create and manage development projects
- **Featured Projects** - Highlight your best work
- **Media Uploads** - Image support for project showcases (5MB limit)
- **Technology Tracking** - Tag projects with relevant technologies

### 🤝 Networking & Connections
- **Connection System** - Send, accept, reject connection requests
- **Smart Suggestions** - AI-driven connection recommendations
- **Connection Management** - View and manage your professional network
- **Request Tracking** - Monitor sent and received connection requests

### 🔔 Notifications System
- **Real-time Notifications** - Like, comment, and connection notifications
- **Unread Tracking** - Keep track of new notifications
- **Bulk Operations** - Mark all as read or delete multiple notifications
- **Rich Notifications** - Include sender profile pictures and context

### 🔍 Advanced Search
- **Multi-entity Search** - Search users, posts, and projects
- **Connection-aware Results** - Respect privacy and connection status
- **Smart Filtering** - Filter by skills, categories, and proficiency
- **Combined Results** - Unified search across all content types

### 📎 File Management
- **Image Uploads** - Secure authenticated file uploads
- **Project Media** - Visual project documentation support
- **File Validation** - Type and size restrictions for security
- **Static Serving** - Efficient media delivery

## 🛠️ Tech Stack

### **Backend Framework**
- **Node.js** - JavaScript runtime for scalable server-side applications
- **Express 5** - Latest version of the fast, minimalist web framework
- **Mongoose** - Elegant MongoDB object modeling for Node.js

### **Database & Storage**
- **MongoDB** - NoSQL document database for flexible data modeling
- **GridFS** - Large file storage and retrieval system
- **Indexing** - Optimized database queries and search performance

### **Authentication & Security**
- **JWT (jsonwebtoken)** - Stateless authentication tokens
- **bcryptjs** - Industry-standard password hashing
- **CORS** - Cross-origin resource sharing configuration
- **Rate Limiting** - API abuse prevention

### **File Handling & Middleware**
- **Multer** - Multipart form data handling for file uploads
- **dotenv** - Environment variable management
- **Custom Middleware** - Authentication, validation, and error handling

### **Development Tools**
- **nodemon** - Automatic server restart during development
- **ESLint** - Code quality and consistency enforcement
- **Morgan** - HTTP request logging for debugging

## 📁 Project Structure

```
devlink-backend/
├── config/
│   └── db.js                     # MongoDB connection configuration
├── middleware/
│   ├── auth.js                   # JWT authentication middleware
│   └── upload.js                 # File upload middleware
├── models/
│   ├── User.js                   # User schema and model
│   ├── Profile.js                # Profile schema and model
│   ├── Post.js                   # Post schema with interactions
│   ├── Project.js                # Project showcase model
│   ├── Skill.js                  # Skills and endorsements model
│   ├── Connection.js             # Connection requests and relationships
│   └── Notification.js           # Notification system model
├── routes/
│   ├── auth.js                   # Authentication endpoints
│   ├── profile.js                # Profile management
│   ├── posts.js                  # Posts and social features
│   ├── projects.js               # Project management
│   ├── skills.js                 # Skills and endorsements
│   ├── connections.js            # Networking features
│   ├── notifications.js          # Notification system
│   ├── search.js                 # Search functionality
│   └── upload.js                 # File upload handling
├── uploads/
│   └── projects/                 # Project image storage
├── .env                          # Environment variables
├── .env.example                  # Environment template
├── server.js                     # Application entry point
├── package.json                  # Dependencies and scripts
└── README.md                     # This documentation
```

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** and npm/yarn
- **MongoDB** (local or Atlas cluster)
- **Git** for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/prince21241/devlink-backend.git
   cd devlink-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create `.env` file in the root directory:
   ```env
   # Database Configuration
   MONGO_URI=mongodb+srv://<username>:<password>@<cluster>/<database>
   
   # Authentication
   JWT_SECRET=your_super_secure_jwt_secret_key_here
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # CORS Configuration (optional)
   CLIENT_URL=http://localhost:5173
   ```

4. **Start the Development Server**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

5. **Verify Installation**
   ```bash
   curl http://localhost:5000/api/auth
   # Should return API information
   ```

The API will be available at `http://localhost:5000` with static uploads served from `/uploads`.

## 📚 Comprehensive API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Headers
All private routes require the JWT token:
```http
x-auth-token: your_jwt_token_here
Content-Type: application/json
```

---

### 🔐 Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/register` | Register new user account | ❌ |
| `POST` | `/login` | User login and token generation | ❌ |
| `GET` | `/me` | Get current authenticated user | ✅ |

#### Register New User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john.doe@example.com"
  }
}
```

---

### 👤 Profile Management (`/api/profile`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/me` | Get current user's profile | ✅ |
| `POST` | `/` | Create or update profile | ✅ |
| `GET` | `/` | List all public profiles | ❌ |
| `GET` | `/user/:user_id` | Get profile by user ID | ❌ |
| `PUT` | `/experience` | Add work experience | ✅ |
| `PUT` | `/education` | Add education entry | ✅ |
| `DELETE` | `/experience/:exp_id` | Remove experience | ✅ |
| `DELETE` | `/education/:edu_id` | Remove education | ✅ |
| `DELETE` | `/` | Delete profile and user | ✅ |

#### Create/Update Profile
```http
POST /api/profile
x-auth-token: your_jwt_token
Content-Type: application/json

{
  "bio": "Full-stack developer passionate about creating scalable web applications",
  "location": "San Francisco, CA",
  "skills": ["JavaScript", "React", "Node.js", "MongoDB", "Docker"],
  "profilePicture": "https://example.com/profile.jpg",
  "social": {
    "github": "johndoe",
    "linkedin": "john-doe-dev",
    "twitter": "johndev"
  }
}
```

---

### 📝 Posts & Social Features (`/api/posts`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/` | Get personalized feed | ✅ |
| `GET` | `/me` | Get current user's posts | ✅ |
| `GET` | `/user/:userId` | Get public posts by user | ❌ |
| `GET` | `/:id` | Get single post details | ❌ |
| `POST` | `/` | Create new post | ✅ |
| `PUT` | `/:id` | Update own post | ✅ |
| `DELETE` | `/:id` | Delete own post | ✅ |
| `POST` | `/:id/like` | Toggle like on post | ✅ |
| `POST` | `/:id/comment` | Add comment to post | ✅ |
| `DELETE` | `/:id/comment/:commentId` | Remove comment | ✅ |
| `POST` | `/:id/pin` | Pin/unpin own post | ✅ |

#### Create New Post
```http
POST /api/posts
x-auth-token: your_jwt_token
Content-Type: application/json

{
  "content": "Just finished building an amazing React application! 🚀",
  "postType": "text",
  "tags": ["React", "JavaScript", "WebDev"],
  "visibility": "public",
  "link": "https://github.com/johndoe/amazing-app"
}
```

---

### 🚀 Project Management (`/api/projects`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/` | List all public projects | ❌ |
| `GET` | `/featured/all` | Get featured projects | ❌ |
| `GET` | `/me` | Get current user's projects | ✅ |
| `GET` | `/user/:userId` | Get projects by user | ❌ |
| `GET` | `/:id` | Get single project details | ❌ |
| `POST` | `/` | Create new project | ✅ |
| `PUT` | `/:id` | Update own project | ✅ |
| `DELETE` | `/:id` | Delete own project | ✅ |

#### Create New Project
```http
POST /api/projects
x-auth-token: your_jwt_token
Content-Type: application/json

{
  "title": "DevLink - Developer Networking Platform",
  "description": "A full-stack MERN application for developer networking and collaboration",
  "technologies": ["React", "Node.js", "MongoDB", "Express", "JWT"],
  "liveUrl": "https://devlink-demo.com",
  "githubUrl": "https://github.com/johndoe/devlink",
  "featured": true,
  "status": "completed",
  "startDate": "2024-01-15",
  "endDate": "2024-03-20"
}
```

---

### 💡 Skills Management (`/api/skills`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/me` | Get current user's skills | ✅ |
| `GET` | `/user/:userId` | Get skills by user | ❌ |
| `GET` | `/categories` | Get skill categories with counts | ✅ |
| `GET` | `/search` | Search skills across platform | ❌ |
| `POST` | `/` | Add new skill | ✅ |
| `PUT` | `/:id` | Update own skill | ✅ |
| `DELETE` | `/:id` | Delete own skill | ✅ |
| `POST` | `/:id/endorse` | Endorse another user's skill | ✅ |
| `DELETE` | `/:id/endorse` | Remove endorsement | ✅ |

---

### 🤝 Connections & Networking (`/api/connections`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/request` | Send connection request | ✅ |
| `GET` | `/requests/received` | Get received requests | ✅ |
| `GET` | `/requests/sent` | Get sent requests | ✅ |
| `PUT` | `/:id/accept` | Accept connection request | ✅ |
| `PUT` | `/:id/reject` | Reject connection request | ✅ |
| `GET` | `/` | List accepted connections | ✅ |
| `DELETE` | `/:id` | Remove connection | ✅ |
| `GET` | `/suggestions` | Get connection suggestions | ✅ |

---

### 🔔 Notifications System (`/api/notifications`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/` | Get paginated notifications | ✅ |
| `GET` | `/unread-count` | Get unread notification count | ✅ |
| `PUT` | `/mark-read` | Mark selected as read | ✅ |
| `PUT` | `/mark-all-read` | Mark all as read | ✅ |
| `DELETE` | `/:id` | Delete single notification | ✅ |
| `DELETE` | `/` | Delete all notifications | ✅ |

---

### 🔍 Search Functionality (`/api/search`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/users` | Search users by name/email | ✅ |
| `GET` | `/posts` | Search posts by content/tags | ✅ |
| `GET` | `/all` | Combined search results | ✅ |

#### Search Users
```http
GET /api/search/users?q=john&skills=react,nodejs
x-auth-token: your_jwt_token
```

---

### 📎 File Upload (`/api/upload`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/project-image` | Upload project image (≤5MB) | ✅ |
| `DELETE` | `/project-image/:filename` | Delete uploaded image | ✅ |

#### Upload Project Image
```http
POST /api/upload/project-image
x-auth-token: your_jwt_token
Content-Type: multipart/form-data

projectImage: [binary file data]
```

**Response:**
```json
{
  "imageUrl": "/uploads/projects/project-1234567890.jpg"
}
```

## 🗄️ Database Models

### User Model
```javascript
{
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: String,
  date: { type: Date, default: Date.now }
}
```

### Profile Model
```javascript
{
  user: { type: ObjectId, ref: 'User', required: true },
  bio: String,
  location: String,
  skills: [String],
  profilePicture: String,
  social: {
    github: String,
    linkedin: String,
    twitter: String
  },
  experience: [ExperienceSchema],
  education: [EducationSchema],
  date: { type: Date, default: Date.now }
}
```

### Post Model
```javascript
{
  user: { type: ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  postType: { type: String, enum: ['text', 'image', 'link', 'project'], default: 'text' },
  image: String,
  link: String,
  project: { type: ObjectId, ref: 'Project' },
  tags: [String],
  likes: [{ type: ObjectId, ref: 'User' }],
  comments: [CommentSchema],
  shares: [{ type: ObjectId, ref: 'User' }],
  visibility: { type: String, enum: ['public', 'connections'], default: 'public' },
  pinned: { type: Boolean, default: false },
  editHistory: [EditHistorySchema],
  date: { type: Date, default: Date.now }
}
```

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server with nodemon |
| `npm run server` | Alias for development server |
| `npm test` | Run test suite (if configured) |

## 🚀 Deployment Guide

### Environment Variables for Production
```env
NODE_ENV=production
MONGO_URI=mongodb+srv://user:pass@cluster/database
JWT_SECRET=production_jwt_secret_key
PORT=5000
CLIENT_URL=https://your-frontend-domain.com
```

### Deployment Platforms

#### **Render**
```bash
# Connect GitHub repository
# Set environment variables in dashboard
# Configure build command: npm install
# Configure start command: npm start
```

#### **Railway**
```bash
railway login
railway link
railway variables:set MONGO_URI=your_mongodb_uri
railway variables:set JWT_SECRET=your_jwt_secret
railway up
```

#### **Heroku**
```bash
heroku create devlink-backend-api
heroku config:set MONGO_URI=your_mongodb_uri
heroku config:set JWT_SECRET=your_jwt_secret
git push heroku main
```

## 🧪 Testing Examples

### Authentication Flow
```bash
# Register user
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}' \
  | jq -r '.token')

# Create profile
curl -X POST http://localhost:5000/api/profile \
  -H "Content-Type: application/json" \
  -H "x-auth-token: $TOKEN" \
  -d '{"bio":"Test developer","location":"Remote","skills":["JavaScript","React"]}'

# Create post
curl -X POST http://localhost:5000/api/posts \
  -H "Content-Type: application/json" \
  -H "x-auth-token: $TOKEN" \
  -d '{"content":"Hello DevLink community!","postType":"text","visibility":"public"}'
```

## 🔍 Troubleshooting

### Common Issues & Solutions

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| **401 Unauthorized** | Missing/invalid JWT token | Verify `x-auth-token` header is set correctly |
| **MongoDB connection failed** | Incorrect MONGO_URI | Check connection string and network access |
| **CORS blocked** | Frontend origin not allowed | Configure CORS middleware with correct origins |
| **File upload fails** | File too large or wrong type | Ensure image files are ≤5MB and valid format |
| **Port already in use** | Port 5000 is occupied | Change PORT in .env or kill existing process |

### Debug Tips
```bash
# Check if MongoDB is connected
curl http://localhost:5000/api/auth

# Test JWT token validity
curl -H "x-auth-token: YOUR_TOKEN" http://localhost:5000/api/auth/me

# Check upload directory permissions
ls -la uploads/projects/

# Monitor server logs
npm run dev  # Watch for console output
```

## 🤝 Contributing

We welcome contributions from the developer community! Here's how to get started:

### Development Setup
1. **Fork and clone the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/awesome-feature
   ```
3. **Make your changes**
   - Follow existing code patterns
   - Add proper error handling
   - Include JSDoc comments for new functions
   - Test your changes thoroughly

4. **Commit and push**
   ```bash
   git commit -m 'feat: add awesome feature'
   git push origin feature/awesome-feature
   ```

5. **Open a Pull Request**

### Development Guidelines
- **Code Style**: Follow existing patterns and use meaningful variable names
- **Error Handling**: Always include proper error handling and validation
- **Documentation**: Update API documentation for new endpoints
- **Testing**: Test all endpoints manually and include examples
- **Security**: Validate all inputs and protect against common vulnerabilities

### Reporting Issues
- Use the GitHub issue tracker
- Include detailed steps to reproduce
- Provide error messages and logs
- Specify your environment (Node.js version, OS, etc.)

## 📄 License

This project is part of the DevLink application suite. See the [LICENSE](LICENSE) file for details.

## 🔗 Related Projects

- **[DevLink Frontend](https://github.com/prince21241/devlink-frontend)** - React frontend application
- **DevLink Mobile** - React Native app (coming soon)
- **DevLink Chrome Extension** - Browser extension (planned)

## 👤 Author

**Prince Raval (prince21241)**
- GitHub: [@prince21241](https://github.com/prince21241)
- LinkedIn: [Prince Raval](https://www.linkedin.com/in/princeravaltech/)
- Email: princeraval36955@gmail.com

## 🙏 Acknowledgments

- **MERN Stack Community** - For the incredible ecosystem and resources
- **MongoDB Team** - For the flexible NoSQL database solution
- **Express.js Team** - For the minimal and fast web framework
- **JWT.io** - For secure authentication standards
- **Multer Contributors** - For seamless file upload handling
- **Open Source Community** - For continuous innovation and support

## 📈 Project Stats

- **Latest Version**: 1.0.0
- **Node.js**: 18+ required
- **Database**: MongoDB 4.4+
- **API Endpoints**: 40+ endpoints
- **File Support**: Image uploads up to 5MB
- **Authentication**: JWT-based stateless auth

---

<div align="center">

⭐ **Found DevLink Backend useful? Give it a star on GitHub!** ⭐

[🐛 Report Bug](https://github.com/prince21241/devlink-backend/issues) · [✨ Request Feature](https://github.com/prince21241/devlink-backend/issues) · [📖 Documentation](https://github.com/prince21241/devlink-backend/wiki) · [🚀 Frontend Repo](https://github.com/prince21241/devlink-frontend)

**Ready to build something amazing?** Check out the [DevLink Frontend](https://github.com/prince21241/devlink-frontend) to complete your full-stack experience!

</div>