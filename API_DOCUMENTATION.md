# API Endpoints Documentation

## Base URL: `http://localhost:3000`

---

## 🔐 Authentication Endpoints (`/auth`)

### 1. **POST** `/auth/register`
**Description**: Register a new user account  
**Authentication**: None required  
**Request Body**:
```json
{
  "fullname": "string",
  "username": "string", 
  "email": "string",
  "address": {
    "street": "string", // optional
    "city": "string", // optional
    "state": "string", // optional
    "country": "string", // optional
    "zipCode": "string" // optional
  },
  "country": "string",
  "currency": "string",
  "phoneNumber": "string",
  "password": "string (min 6 chars)"
}
```
**Response**:
```json
{
  "message": "User registered successfully",
  "user": {
    "userId": "7-digit-string",
    "fullname": "string",
    "username": "string",
    "email": "string",
    "accountStatus": "pending"
  },
  "access_token": "jwt-token"
}
```

### 2. **POST** `/auth/login`
**Description**: Login with email and password  
**Authentication**: None required  
**Request Body**:
```json
{
  "email": "string",
  "password": "string (min 6 chars)"
}
```
**Response**:
```json
{
  "user": {
    "userId": "string",
    "fullname": "string", 
    "username": "string",
    "email": "string",
    "role": "user|admin"
  },
  "access_token": "jwt-token"
}
```

### 3. **POST** `/auth/profile`
**Description**: Get current user profile from token  
**Authentication**: JWT required  
**Request Body**: None  
**Response**:
```json
{
  "userId": "string",
  "fullname": "string",
  "username": "string", 
  "email": "string",
  "role": "user|admin"
}
```

---

## 👤 User Management Endpoints (`/users`)

### 4. **POST** `/users`
**Description**: Create a new user (alternative to register)  
**Authentication**: None required  
**Request Body**: Same as `/auth/register`  
**Response**: User object

### 5. **GET** `/users`
**Description**: Get all users (Admin only)  
**Authentication**: JWT + Admin role required  
**Query Parameters**: None  
**Response**:
```json
[
  {
    "userId": "string",
    "fullname": "string",
    "username": "string",
    "email": "string",
    "accountStatus": "string",
    "kycStatus": "string"
  }
]
```

### 6. **GET** `/users/profile`
**Description**: Get current user's profile  
**Authentication**: JWT required  
**Response**: Complete user profile object

### 7. **GET** `/users/:id`
**Description**: Get specific user by ID (Admin only)  
**Authentication**: JWT + Admin role required  
**Response**: Complete user profile object

### 8. **PATCH** `/users/profile`
**Description**: Update current user's profile  
**Authentication**: JWT required  
**Request Body**:
```json
{
  "fullname": "string", // optional
  "username": "string", // optional
  "phoneNumber": "string", // optional
  "address": { // optional
    "street": "string",
    "city": "string",
    "state": "string", 
    "country": "string",
    "zipCode": "string"
  }
}
```
**Response**: Updated user object

### 9. **POST** `/users/profile/upload-image`
**Description**: Upload profile image  
**Authentication**: JWT required  
**Request Body**: FormData with `file` field  
**Response**:
```json
{
  "message": "Profile image uploaded successfully",
  "user": "updated-user-object",
  "imageDetails": {
    "url": "string",
    "publicId": "string",
    "format": "string",
    "bytes": "number"
  }
}
```

### 10. **POST** `/users/kyc/upload`
**Description**: Upload single KYC document  
**Authentication**: JWT required  
**Request Body**: FormData with `file` field + KYC data
```json
{
  "documentType": "drivers_license|id_card|passport|utility_bill|bank_statement",
  "file": "uploaded-file"
}
```
**Response**:
```json
{
  "message": "KYC document uploaded successfully",
  "user": "updated-user-object",
  "documentDetails": {
    "url": "string",
    "publicId": "string", 
    "documentType": "string",
    "format": "string",
    "bytes": "number"
  }
}
```

### 11. **POST** `/users/kyc/upload-multiple`
**Description**: Upload multiple KYC documents (e.g., ID card front and back)  
**Authentication**: JWT required  
**Request Body**: FormData with `files` field (max 10 files) + KYC data
```json
{
  "documentType": "drivers_license|id_card|passport|utility_bill|bank_statement",
  "files": "uploaded-files"
}
```
**Response**:
```json
{
  "message": "X KYC documents uploaded successfully",
  "user": "updated-user-object",
  "documentDetails": [
    {
      "url": "string",
      "publicId": "string", 
      "documentType": "string",
      "format": "string",
      "bytes": "number"
    }
  ]
}
```

### 12. **PATCH** `/users/:id`
**Description**: Update specific user (Admin only)  
**Authentication**: JWT + Admin role required  
**Request Body**: Same as profile update  
**Response**: Updated user object

### 13. **DELETE** `/users/:id`
**Description**: Delete user (Admin only)  
**Authentication**: JWT + Admin role required  
**Response**: Success message

---

## 💰 Transaction Endpoints (`/transactions`)

### 14. **POST** `/transactions`
**Description**: Create a new transaction  
**Authentication**: JWT required  
**Request Body**:
```json
{
  "amount": "number",
  "transactionType": "deposit|credit|top-up|withdrawal",
  "transactionAction": "funding|trade|transfer|payment",
  "paymentMethod": "string", // optional
  "description": "string", // optional
  "wallet": "wallet-id", // optional
  "reference": "string" // optional
}
```
**Response**: Transaction object

### 15. **GET** `/transactions/all`
**Description**: Get all transactions (Admin only)  
**Authentication**: JWT + Admin role required  
**Query Parameters**:
- `page`: number (default: 1)
- `limit`: number (default: 10) 
- `type`: TransactionType (optional)
- `status`: TransactionStatus (optional)

**Response**:
```json
{
  "transactions": [/* transaction objects */],
  "total": "number",
  "page": "number", 
  "totalPages": "number"
}
```

### 16. **GET** `/transactions`
**Description**: Get current user's transactions  
**Authentication**: JWT required  
**Query Parameters**: Same as above  
**Response**: Paginated transactions

### 17. **GET** `/transactions/stats`
**Description**: Get user's transaction statistics  
**Authentication**: JWT required  
**Response**:
```json
{
  "statusStats": [
    {
      "_id": "pending|successful|failed",
      "count": "number",
      "totalAmount": "number"
    }
  ],
  "typeStats": [
    {
      "_id": "deposit|credit|withdrawal|top-up",
      "count": "number", 
      "totalAmount": "number"
    }
  ]
}
```

### 18. **GET** `/transactions/:id`
**Description**: Get specific transaction  
**Authentication**: JWT required  
**Response**: Transaction object

### 19. **PATCH** `/transactions/:id`
**Description**: Update transaction  
**Authentication**: JWT required  
**Request Body**:
```json
{
  "amount": "number", // optional
  "status": "pending|successful|failed", // optional
  "description": "string" // optional
}
```
**Response**: Updated transaction

### 20. **PATCH** `/transactions/:id/status`
**Description**: Update transaction status (Admin only)  
**Authentication**: JWT + Admin role required  
**Request Body**:
```json
{
  "status": "pending|successful|failed"
}
```
**Response**: Updated transaction

### 21. **DELETE** `/transactions/:id`
**Description**: Delete transaction (Admin only)  
**Authentication**: JWT + Admin role required  
**Response**: Success message

---

## 💳 Wallet Endpoints (`/wallets`)

### 22. **GET** `/wallets/my-wallet`
**Description**: Get current user's wallet  
**Authentication**: JWT required  
**Response**:
```json
{
  "id": "string",
  "user": "user-id",
  "totalBalance": "number",
  "availableBalance": "number", 
  "profitBalance": "number",
  "bonusBalance": "number",
  "pendingWithdrawal": "number",
  "userDetails": {/* user info */},
  "transactions": [/* recent transactions */]
}
```

### 22. **POST** `/wallets/top-up`
**Description**: Request wallet top-up (creates pending transaction)  
**Authentication**: JWT required  
**Request Body**:
```json
{
  "amount": "number (min 0.01)",
  "paymentMethod": "string", // optional
  "description": "string" // optional
}
```
**Response**:
```json
{
  "wallet": "updated-wallet-object",
  "transaction": "created-transaction-object"
}
```

### 23. **POST** `/wallets/withdraw`
**Description**: Request withdrawal (creates pending transaction)  
**Authentication**: JWT required  
**Request Body**:
```json
{
  "amount": "number (min 0.01)",
  "paymentMethod": "string", // optional
  "description": "string" // optional
}
```
**Response**:
```json
{
  "wallet": "updated-wallet-object",
  "transaction": "created-transaction-object"
}
```

### 24. **POST** `/wallets/card/add`
**Description**: Add credit/debit card to wallet (uploads front & back images)  
**Authentication**: JWT required  
**Request Body**: FormData with 2 files + card data
```json
{
  "cardHolderName": "string",
  "cardNumber": "string (last 4 digits only)", 
  "expiryDate": "string (MM/YY format)",
  "cvv": "string (3-4 digits)",
  "files": "2 uploaded files (front and back of card)"
}
```
**Response**:
```json
{
  "message": "Card added successfully",
  "wallet": "updated-wallet-object",
  "cardImages": {
    "front": {
      "url": "string",
      "publicId": "string"
    },
    "back": {
      "url": "string", 
      "publicId": "string"
    }
  }
}
```

### 25. **GET** `/wallets/card/info`
**Description**: Get user's card information (masked for security)  
**Authentication**: JWT required  
**Response**:
```json
{
  "cardHolderName": "string",
  "cardNumber": "****-****-****-1234",
  "expiryDate": "MM/YY",
  "addedAt": "date",
  "isActive": "boolean",
  "hasCard": true
}
```

### 26. **DELETE** `/wallets/card/remove`
**Description**: Remove card from wallet  
**Authentication**: JWT required  
**Response**: Updated wallet object without card info

### 27. **GET** `/wallets/admin/all`
**Description**: Get all wallets (Admin only)  
**Authentication**: JWT + Admin role required  
**Query Parameters**:
- `page`: number (default: 1)
- `limit`: number (default: 10)

**Response**:
```json
{
  "wallets": [/* wallet objects */],
  "total": "number",
  "page": "number",
  "totalPages": "number"
}
```

### 25. **GET** `/wallets/admin/users`
**Description**: Get all users (Admin only)  
**Authentication**: JWT + Admin role required  
**Query Parameters**: Same pagination as above  
**Response**: Paginated users list

### 26. **GET** `/wallets/admin/user/:userId`
**Description**: Get specific user's wallet (Admin only)  
**Authentication**: JWT + Admin role required  
**Response**: Wallet object with user details

### 27. **PATCH** `/wallets/admin/user/:userId`
**Description**: Update user's wallet balances (Admin only)  
**Authentication**: JWT + Admin role required  
**Request Body**:
```json
{
  "totalBalance": "number", // optional
  "availableBalance": "number", // optional
  "profitBalance": "number", // optional
  "bonusBalance": "number", // optional
  "pendingWithdrawal": "number" // optional
}
```
**Response**: Updated wallet object

### 28. **POST** `/wallets/admin/credit`
**Description**: Admin credit user wallet directly  
**Authentication**: JWT + Admin role required  
**Request Body**:
```json
{
  "userId": "string",
  "amount": "number (min 0.01)",
  "transactionType": "deposit|credit|top-up",
  "transactionAction": "funding|trade|transfer|payment",
  "description": "string", // optional
  "reference": "string" // optional
}
```
**Response**:
```json
{
  "wallet": "updated-wallet-object",
  "transaction": "created-transaction-object"
}
```

### 29. **PATCH** `/wallets/admin/transaction/:transactionId/approve`
**Description**: Approve pending transaction  
**Authentication**: JWT + Admin role required  
**Response**:
```json
{
  "wallet": "updated-wallet-object",
  "transaction": "approved-transaction-object"
}
```

### 30. **PATCH** `/wallets/admin/transaction/:transactionId/reject`
**Description**: Reject pending transaction  
**Authentication**: JWT + Admin role required  
**Request Body**:
```json
{
  "reason": "string" // optional
}
```
**Response**:
```json
{
  "wallet": "updated-wallet-object",
  "transaction": "rejected-transaction-object"
}
```

### 31. **POST** `/wallets/admin/create/:userId`
**Description**: Create wallet for specific user (Admin only)  
**Authentication**: JWT + Admin role required  
**Request Body**: Wallet creation data (optional fields)  
**Response**: Created wallet object

### 32. **DELETE** `/wallets/admin/user/:userId`
**Description**: Delete user's wallet (Admin only)  
**Authentication**: JWT + Admin role required  
**Response**: Success message

---

## 🔑 Authentication Headers

For protected endpoints, include:
```
Authorization: Bearer <jwt-token>
```

## 📊 Transaction Flow

1. **User Top-up**: `POST /wallets/top-up` → Creates pending transaction → Admin approves via `PATCH /wallets/admin/transaction/:id/approve`
2. **User Withdrawal**: `POST /wallets/withdraw` → Creates pending transaction → Admin approves/rejects
3. **Admin Credit**: `POST /wallets/admin/credit` → Directly credits wallet with completed transaction

## 🎯 Key Features

- **Role-based Access**: User vs Admin endpoints
- **Transaction Integration**: All wallet operations create corresponding transactions
- **Pending State Management**: Top-ups and withdrawals require admin approval
- **Pagination**: Most list endpoints support pagination
- **File Uploads**: Profile images and KYC documents via Cloudinary
- **Search & Filtering**: Transactions can be filtered by type, status, etc.

## 📚 Data Models

### User Schema
```json
{
  "userId": "string (7 digits)",
  "fullname": "string",
  "username": "string",
  "email": "string",
  "address": {
    "street": "string", // optional
    "city": "string", // optional
    "state": "string", // optional
    "country": "string", // optional
    "zipCode": "string" // optional
  },
  "country": "string",
  "currency": "string",
  "phoneNumber": "string",
  "role": "user|admin",
  "accountStatus": "active|inactive|suspended|pending",
  "kycStatus": "not_submitted|pending|approved|rejected",
  "userLevel": "basic|pro",
  "referralCode": "string",
  "profilePhoto": "string (URL)",
  "kycDocuments": [
    {
      "documentType": "drivers_license|id_card|passport|utility_bill|bank_statement",
      "documentUrl": "string"
    }
  ]
}
```

### Wallet Schema
```json
{
  "id": "string",
  "user": "ObjectId",
  "totalBalance": "number",
  "availableBalance": "number",
  "profitBalance": "number",
  "bonusBalance": "number",
  "pendingWithdrawal": "number"
}
```

### Transaction Schema
```json
{
  "id": "string",
  "user": "ObjectId",
  "wallet": "ObjectId",
  "amount": "number",
  "transactionType": "deposit|credit|top-up|withdrawal",
  "transactionAction": "funding|trade|transfer|payment",
  "status": "pending|successful|failed",
  "paymentMethod": "string",
  "description": "string",
  "reference": "string",
  "date": "ISO Date"
}
```

## 🚀 Getting Started

1. **Start the server**: `npm run start:dev`
2. **Register a user**: `POST /auth/register`
3. **Login**: `POST /auth/login`
4. **Use the JWT token** in Authorization header for protected endpoints
5. **Create/manage wallets** and **transactions** as needed

## 🔧 Environment Variables

Make sure to set up your `.env` file with:
```env
MONGODB_URI=mongodb://localhost:27017/nestjs-app
JWT_SECRET=your-jwt-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## 📝 Notes

- All amounts are in decimal format
- Dates are in ISO format
- File uploads use Cloudinary for storage
- All responses include appropriate HTTP status codes
- Error responses follow consistent format with message and status code
