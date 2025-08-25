# NestJS Server with Authentication, User Management, Transactions, and Cloudinary Integration

A comprehensive NestJS server application featuring user authentication, role-based authorization, transaction management, and Cloudinary integration for image uploads.

## Features

- **User Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (User, Admin, Moderator)
  - Password hashing with bcrypt
  - Local and JWT strategies

- **User Profile Management**
  - User registration and login
  - Profile updates
  - Profile image upload via Cloudinary
  - User roles and permissions

- **Transaction Management**
  - Create, read, update, delete transactions
  - Transaction types: deposit, withdrawal, transfer, purchase, sale
  - Transaction status tracking
  - User-specific transaction history
  - Admin transaction management

- **Image Upload & Management**
  - Cloudinary integration for image storage
  - Automatic image optimization
  - Secure image URLs
  - Profile image management

- **Database**
  - MongoDB with Mongoose ODM
  - Schema validation
  - Relationship management

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Cloudinary account

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd nestjs-server
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:
```
MONGODB_URI=mongodb://localhost:27017/nestjs-app
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
PORT=3000
```

4. Start MongoDB service on your local machine

5. Run the application:
```bash
# Development
npm run start:dev

# Production build
npm run build
npm run start:prod
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - User login
- `POST /auth/profile` - Get user profile (protected)

### Users
- `GET /users` - Get all users (Admin only)
- `GET /users/profile` - Get current user profile
- `PATCH /users/profile` - Update user profile
- `POST /users/profile/upload-image` - Upload profile image
- `GET /users/:id` - Get user by ID (Admin only)
- `PATCH /users/:id` - Update user by ID (Admin only)
- `DELETE /users/:id` - Delete user (Admin only)

### Transactions
- `POST /transactions` - Create new transaction
- `GET /transactions` - Get user's transactions
- `GET /transactions/all` - Get all transactions (Admin/Moderator)
- `GET /transactions/stats` - Get user transaction statistics
- `GET /transactions/:id` - Get transaction by ID
- `PATCH /transactions/:id` - Update transaction
- `PATCH /transactions/:id/status` - Update transaction status (Admin/Moderator)
- `DELETE /transactions/:id` - Delete transaction (Admin only)

## Data Models

### User Schema
```typescript
{
  email: string (unique, required)
  password: string (required)
  firstName: string (required)
  lastName: string (required)
  phone?: string
  profileImage?: string
  role: 'user' | 'admin' | 'moderator' (default: 'user')
  isActive: boolean (default: true)
  dateOfBirth?: Date
  address?: {
    street?: string
    city?: string
    state?: string
    country?: string
    zipCode?: string
  }
  isEmailVerified: boolean (default: false)
  timestamps: true
}
```

### Transaction Schema
```typescript
{
  userId: ObjectId (required, ref: 'User')
  type: 'deposit' | 'withdrawal' | 'transfer' | 'purchase' | 'sale' (required)
  amount: number (required)
  currency: string (default: 'USD')
  status: 'pending' | 'completed' | 'failed' | 'cancelled' (default: 'pending')
  description?: string
  reference?: string
  recipientId?: ObjectId (ref: 'User')
  metadata?: Record<string, any>
  fees?: number
  balanceAfter?: number
  balanceBefore?: number
  timestamps: true
}
```

## Authentication & Authorization

### JWT Token
Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### User Roles
- **User**: Basic user with access to own profile and transactions
- **Moderator**: Can view all transactions and update transaction status
- **Admin**: Full access to all endpoints including user management

## File Upload

Profile images are uploaded to Cloudinary with automatic optimization:
- Maximum size: 400x400 pixels
- Auto quality optimization
- Stored in `user-profiles` folder

## Development

### Project Structure
```
src/
├── auth/              # Authentication module
│   ├── dto/           # Data transfer objects
│   ├── guards/        # Auth guards
│   ├── strategies/    # Passport strategies
│   └── decorators/    # Custom decorators
├── users/             # Users module
│   ├── dto/           # User DTOs
│   └── schemas/       # User schema
├── transactions/      # Transactions module
│   ├── dto/           # Transaction DTOs
│   └── schemas/       # Transaction schema
├── cloudinary/        # Cloudinary integration
├── app.module.ts      # Main app module
└── main.ts           # Application entry point
```

### Scripts
- `npm run start:dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start:prod` - Start production server
- `npm run test` - Run tests
- `npm run lint` - Lint code

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based access control
- Input validation with class-validator
- CORS enabled
- Environment variable configuration

## Configuration

### MongoDB
Make sure MongoDB is running and accessible. Update the `MONGODB_URI` in your `.env` file.

### Cloudinary
1. Create a Cloudinary account
2. Get your cloud name, API key, and API secret
3. Update the Cloudinary configuration in your `.env` file

### JWT Secret
Generate a strong JWT secret for production:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
