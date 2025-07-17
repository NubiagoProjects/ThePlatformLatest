# Nubiago E-commerce Backend API

A robust TypeScript-based backend API for the Nubiago e-commerce platform built with Express.js, Prisma, and PostgreSQL.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Database**: PostgreSQL with Prisma ORM
- **Security**: Helmet, CORS, Rate limiting, Input validation
- **TypeScript**: Full type safety and modern JavaScript features
- **Error Handling**: Centralized error handling with detailed logging
- **API Documentation**: RESTful API with proper response formats

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

## 🛠️ Installation

1. Clone the repository and navigate to backend:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Update `.env` with your database credentials and other settings.

5. Generate Prisma client:
```bash
npm run db:generate
```

6. Run database migrations:
```bash
npm run db:migrate
```

## 🏃‍♂️ Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## 📁 Project Structure

```
src/
├── controllers/     # Request handlers
├── middleware/      # Custom middleware functions
├── routes/         # API route definitions
├── services/       # Business logic layer
├── utils/          # Utility functions
├── prisma/         # Database schema
└── index.ts        # Application entry point
```

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create product (Supplier/Admin)

### Orders
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create order

### Users
- `GET /api/users` - Get all users (Admin only)

## 🔒 Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 🛡️ Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Prevents abuse
- **Input Validation**: Express-validator
- **Password Hashing**: Bcrypt with salt rounds

## 🗄️ Database Schema

The application uses PostgreSQL with the following main entities:
- Users (with roles: USER, SUPPLIER, ADMIN)
- Products
- Categories
- Orders
- Reviews
- Cart & Wishlist

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run migrations
- `npm run db:studio` - Open Prisma Studio

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License. 