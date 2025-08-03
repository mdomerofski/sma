# Social Media Automation Platform

A comprehensive social media automation platform that discovers content from RSS feeds, generates engaging posts using AI, and publishes them across multiple social media platforms.

## Features

### Backend Features
- **Node.js/Express** server with TypeScript
- **PostgreSQL** database with Prisma ORM
- **JWT authentication** for secure access
- **RSS feed crawler** that runs every hour
- **OpenAI integration** for intelligent post generation
- **Twitter API integration** for publishing
- **RESTful API endpoints** for all operations
- **Production-ready** with error handling and security

### Frontend Features
- **React app** with TypeScript and Tailwind CSS
- **Dashboard** showing discovered content overview
- **Approval queue** with post preview and editing
- **Post editor** with platform-specific previews
- **Content calendar** view (coming soon)
- **Settings page** for managing sources and accounts
- **Analytics tracking** (basic implementation)

### Core Functionality
- Add RSS feeds as content sources
- Auto-generate Twitter posts from discovered content
- Review and approve posts before publishing
- Schedule posts for later publication
- Basic analytics and performance tracking

## Tech Stack

### Backend
- Node.js with Express
- TypeScript
- PostgreSQL with Prisma ORM
- JWT for authentication
- OpenAI API for content generation
- Twitter API v2 for publishing
- RSS Parser for content discovery
- Cron jobs for scheduled tasks

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- React Query for state management
- React Hook Form for form handling
- React Router for navigation
- Axios for API calls

## Project Structure

```
social_media/
├── backend/                 # Node.js backend
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   ├── utils/          # Utility functions
│   │   └── types/          # TypeScript types
│   ├── prisma/             # Database schema
│   └── package.json
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   ├── utils/          # Utility functions
│   │   ├── types/          # TypeScript types
│   │   └── context/        # React context
│   └── package.json
└── package.json           # Root package.json
```

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- OpenAI API key
- Twitter API credentials

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd social_media
npm run install:all
```

### 2. Database Setup

1. Create a PostgreSQL database
2. Copy environment variables:

```bash
cd backend
cp .env.example .env
```

3. Update `.env` with your configuration:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/social_media_db"
JWT_SECRET="your-super-secret-jwt-key-here"
OPENAI_API_KEY="your-openai-api-key"
TWITTER_API_KEY="your-twitter-api-key"
TWITTER_API_SECRET="your-twitter-api-secret"
TWITTER_ACCESS_TOKEN="your-twitter-access-token"
TWITTER_ACCESS_SECRET="your-twitter-access-secret"
```

4. Run database migrations:

```bash
cd backend
npm run db:generate
npm run db:migrate
```

### 3. Start Development Servers

Run both frontend and backend:

```bash
npm run dev
```

Or run separately:

```bash
# Backend (runs on port 3001)
npm run dev:backend

# Frontend (runs on port 3000)
npm run dev:frontend
```

### 4. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Health Check: http://localhost:3001/health

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Content Sources
- `GET /api/content-sources` - List content sources
- `POST /api/content-sources` - Create content source
- `PUT /api/content-sources/:id` - Update content source
- `DELETE /api/content-sources/:id` - Delete content source
- `POST /api/content-sources/:id/crawl` - Manual crawl trigger

### Discovered Content
- `GET /api/discovered-content` - List discovered content
- `GET /api/discovered-content/:id` - Get specific content
- `PATCH /api/discovered-content/:id` - Update content status
- `DELETE /api/discovered-content/:id` - Delete content

### Social Accounts
- `GET /api/social-accounts` - List social accounts
- `POST /api/social-accounts` - Add social account
- `PUT /api/social-accounts/:id` - Update social account
- `DELETE /api/social-accounts/:id` - Delete social account

### Generated Posts
- `GET /api/generated-posts` - List posts
- `POST /api/generated-posts` - Create post
- `POST /api/generated-posts/generate` - AI generate post
- `PUT /api/generated-posts/:id` - Update post
- `POST /api/generated-posts/:id/publish` - Publish post
- `DELETE /api/generated-posts/:id` - Delete post

### Analytics
- `GET /api/analytics/overview` - Dashboard overview
- `GET /api/analytics/posts` - Post analytics
- `GET /api/analytics/content-sources` - Source analytics

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d
PORT=3001
OPENAI_API_KEY=your-openai-key
TWITTER_API_KEY=your-twitter-key
TWITTER_API_SECRET=your-twitter-secret
TWITTER_ACCESS_TOKEN=your-twitter-token
TWITTER_ACCESS_SECRET=your-twitter-token-secret
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

## Security Features

- JWT authentication with secure token handling
- Password hashing with bcrypt
- Input validation with Joi
- SQL injection prevention with Prisma
- CORS protection
- Rate limiting
- Helmet.js security headers
- Environment variable validation

## Production Deployment

### Backend Deployment
1. Set `NODE_ENV=production`
2. Configure production database
3. Set secure JWT secret
4. Enable HTTPS
5. Configure proper CORS origins
6. Set up process manager (PM2)

### Frontend Deployment
1. Build the React app: `npm run build`
2. Serve static files with nginx/Apache
3. Configure API proxy if needed
4. Set up SSL certificate

### Database
1. Use managed PostgreSQL service
2. Enable connection pooling
3. Set up regular backups
4. Configure monitoring

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please create an issue in the repository.
