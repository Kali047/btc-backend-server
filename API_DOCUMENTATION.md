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
  "pendingDeposit": "number",
  "cardInfo": {/* card information if added */},
  "userDetails": {/* user info */},
  "transactions": [/* recent transactions */]
}
```

### 22. **POST** `/wallets/top-up`
**Description**: Request wallet top-up (creates pending transaction)  
**Authentication**: JWT required  
**Account Status**: Account must be ACTIVE  
**Request Body**:
```json
{
  "amount": "number (min 0.01)",
  "paymentMethod": "string", // optional - defaults to CARD if card exists
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
**Error Responses**:
- `403 Forbidden`: If account status is not ACTIVE

### 23. **POST** `/wallets/withdraw`
**Description**: Request withdrawal (creates pending transaction)  
**Authentication**: JWT required  
**Account Status**: Account must be ACTIVE  
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
**Error Responses**:
- `400 Bad Request`: If insufficient balance
- `403 Forbidden`: If account status is not ACTIVE

### 24. **POST** `/wallets/card/add`
**Description**: Add credit/debit card to wallet (uploads front & back images)  
**Authentication**: JWT required  
**Account Status**: Account must be ACTIVE  
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
**Error Responses**:
- `400 Bad Request`: If card already exists
- `403 Forbidden`: If account status is not ACTIVE
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
**Account Status**: Account must be ACTIVE  
**Response**: Updated wallet object without card info  
**Error Responses**:
- `404 Not Found`: If no card information found
- `403 Forbidden`: If account status is not ACTIVE

---

## 🏛️ Bank Details Management

### 27. **POST** `/wallets/bank-details/add`
**Description**: Add bank details for withdrawals  
**Authentication**: JWT required  
**Request Body (USA)**:
```json
{
  "region": "USA",
  "usaDetails": {
    "recipientName": "John Doe",
    "bankName": "Chase Bank",
    "accountNumber": "123456789",
    "routingNumber": "021000021"
  }
}
```

**Request Body (Europe)**:
```json
{
  "region": "EUROPE",
  "europeDetails": {
    "recipientName": "John Doe",
    "accountNumber": "DE89370400440532013000",
    "iban": "DE89370400440532013000",
    "swiftCode": "DEUTDEFF"
  }
}
```

**Request Body (Others)**:
```json
{
  "region": "OTHERS",
  "othersDetails": {
    "description": "Bank Name: National Bank\\nAccount Holder: John Doe\\nAccount Number: 1234567890\\nBranch Code: 001\\nSwift Code: NATIXXXX\\nBank Address: 123 Main Street, City, Country",
    "documentUrl": "https://example.com/bank-document.pdf"
  }
}
```

**Response**: Updated wallet object with bank details  
**Error Responses**:
- `400 Bad Request`: If region-specific details are missing
- `404 Not Found`: If user or wallet not found

### 28. **PATCH** `/wallets/bank-details/update`
**Description**: Update existing bank details  
**Authentication**: JWT required  
**Request Body**: Same format as add, but all fields optional  
**Response**: Updated wallet object with modified bank details  
**Error Responses**:
- `404 Not Found`: If no existing bank details found

### 29. **GET** `/wallets/bank-details`
**Description**: Get user's bank details  
**Authentication**: JWT required  
**Response**:
```json
{
  "bankDetails": {
    "region": "USA",
    "usaDetails": {
      "recipientName": "John Doe",
      "bankName": "Chase Bank",
      "accountNumber": "123456789",
      "routingNumber": "021000021",
      "addedAt": "2025-09-05T00:00:00.000Z",
      "isActive": true
    },
    "europeDetails": null,
    "othersDetails": null,
    "createdAt": "2025-09-05T00:00:00.000Z",
    "updatedAt": "2025-09-05T00:00:00.000Z"
  },
  "hasBankDetails": true
}
```

### 30. **DELETE** `/wallets/bank-details/remove`
**Description**: Remove bank details from wallet  
**Authentication**: JWT required  
**Response**:
```json
{
  "message": "Bank details removed successfully"
}
```

---

## 💸 Withdrawal Management

### 31. **POST** `/wallets/withdrawal/request`
**Description**: Request withdrawal to bank account  
**Authentication**: JWT required  
**Account Status**: Account must be ACTIVE  
**Prerequisites**: Bank details must be added first  
**Request Body**:
```json
{
  "amount": "100.00",
  "description": "Withdrawal to bank account"
}
```

**Response**:
```json
{
  "message": "Withdrawal is Processing",
  "transactionRef": "TXN1725495123456ABC"
}
```

**Error Responses**:
- `400 Bad Request`: If bank details not found, insufficient balance, or invalid amount
- `403 Forbidden`: If account status is not ACTIVE
- `404 Not Found`: If user or wallet not found

**Process Flow**:
1. ✅ Validates user account is ACTIVE
2. ✅ Checks bank details exist
3. ✅ Validates sufficient available balance
4. ✅ Creates pending withdrawal transaction
5. ✅ Updates wallet pending withdrawal amount
6. ✅ Deducts amount from available balance
7. ✅ Returns processing confirmation

---

## 💳 Admin Wallet Management

### 32. **GET** `/wallets/admin/all`
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

### 33. **GET** `/wallets/admin/users`
**Description**: Get all users (Admin only)  
**Authentication**: JWT + Admin role required  
**Query Parameters**: Same pagination as above  
**Response**: Paginated users list

### 34. **GET** `/wallets/admin/user/:userId`
**Description**: Get specific user's wallet (Admin only)  
**Authentication**: JWT + Admin role required  
**Response**: Wallet object with user details

### 35. **PATCH** `/wallets/admin/user/:userId`
**Description**: Update user's wallet balances (Admin only)  
**Authentication**: JWT + Admin role required  
**Request Body**:
```json
{
  "availableBalance": "number", // optional
  "profitBalance": "number", // optional
  "bonusBalance": "number", // optional
  "pendingWithdrawal": "number", // optional
  "pendingDeposit": "number" // optional
}
```
**Response**: Updated wallet object

### 36. **POST** `/wallets/admin/credit`
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

### 37. **PATCH** `/wallets/admin/transaction/:transactionId/approve`
**Description**: Approve pending transaction  
**Authentication**: JWT + Admin role required  
**Response**:
```json
{
  "wallet": "updated-wallet-object",
  "transaction": "approved-transaction-object"
}
```

### 38. **PATCH** `/wallets/admin/transaction/:transactionId/reject`
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

### 39. **POST** `/wallets/admin/create/:userId`
**Description**: Create wallet for specific user (Admin only)  
**Authentication**: JWT + Admin role required  
**Request Body**: Wallet creation data (optional fields)  
**Response**: Created wallet object

### 40. **DELETE** `/wallets/admin/user/:userId`
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
2. **User Withdrawal (Bank)**: `POST /wallets/withdrawal/request` → Validates bank details → Creates pending transaction → Admin processes withdrawal
3. **User Withdrawal (Legacy)**: `POST /wallets/withdraw` → Creates pending transaction → Admin approves/rejects
4. **Crypto Payment**: `POST /payments/crypto/create` → Creates Plisio invoice → User pays → Webhook updates wallet
5. **Admin Credit**: `POST /wallets/admin/credit` → Directly credits wallet with completed transaction

## 💳 Bank Withdrawal Process

1. **Add Bank Details**: `POST /wallets/bank-details/add` → Choose region (USA/Europe/Others) → Fill required fields
2. **Request Withdrawal**: `POST /wallets/withdrawal/request` → System validates:
   - ✅ User account is ACTIVE
   - ✅ Bank details exist  
   - ✅ Sufficient available balance
3. **Processing**: Creates transaction with `BANK_WITHDRAWAL` action → Updates pending withdrawal → Returns "Withdrawal is Processing"
4. **Admin Review**: Admin processes withdrawal manually → Updates transaction status

## 🎯 Key Features

- **Role-based Access**: User vs Admin endpoints
- **Bank Details Management**: Support for USA, Europe, and Others regions with proper validation
- **Multi-Regional Withdrawals**: USA (Routing Number), Europe (IBAN/SWIFT), Others (Document Upload)
- **Account Status Validation**: Only ACTIVE accounts can perform withdrawals
- **Transaction Integration**: All wallet operations create corresponding transactions
- **Crypto Payments**: Plisio integration with real-time exchange rates
- **Pending State Management**: Top-ups and withdrawals require admin approval
- **Card Management**: Upload and store payment card information securely
- **Pagination**: Most list endpoints support pagination
- **File Uploads**: Profile images, KYC documents, and bank documents via Cloudinary
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
  "pendingWithdrawal": "number",
  "pendingDeposit": "number",
  "cardInfo": {
    "frontImageUrl": "string",
    "backImageUrl": "string", 
    "cvv": "string",
    "cardHolderName": "string",
    "cardNumber": "string", // Last 4 digits only
    "expiryDate": "string", // MM/YY format
    "addedAt": "date",
    "isActive": "boolean"
  },
  "bankDetails": {
    "region": "USA|EUROPE|OTHERS",
    "usaDetails": {
      "recipientName": "string",
      "bankName": "string", 
      "accountNumber": "string",
      "routingNumber": "string",
      "addedAt": "date",
      "isActive": "boolean"
    },
    "europeDetails": {
      "recipientName": "string",
      "accountNumber": "string",
      "iban": "string", 
      "swiftCode": "string",
      "addedAt": "date",
      "isActive": "boolean"
    },
    "othersDetails": {
      "description": "string", // Long form bank details
      "documentUrl": "string", // Optional uploaded document
      "addedAt": "date",
      "isActive": "boolean"
    },
    "createdAt": "date",
    "updatedAt": "date"
  }
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
  "action": "funding|trade|transfer|payment|crypto_payment|bank_withdrawal",
  "status": "pending|successful|failed",
  "paymentMethod": "string",
  "description": "string",
  "reference": "string",
  "date": "ISO Date",
  // Crypto payment fields (if action = crypto_payment)
  "cryptoInvoiceId": "string",
  "cryptoOrderNumber": "string", 
  "cryptoCurrency": "string",
  "cryptoAmount": "number",
  "cryptoWalletAddress": "string",
  "cryptoInvoiceUrl": "string",
  "cryptoExpiresAt": "date",
  "cryptoCompletedAt": "date",
  "plisioWebhookData": "object"
}
```

---

## � Crypto Payment Endpoints (`/payments`)

### 35. **POST** `/payments/crypto/create`
**Description**: Create crypto payment invoice using Plisio  
**Authentication**: JWT required  
**Account Status**: Account must be ACTIVE  
**Request Body**:
```json
{
  "amount": 50.00,
  "currency": "USD",
  "cryptoCurrency": "BTC",
  "description": "Wallet top-up",
  "orderName": "Crypto Payment"
}
```
**Response**:
```json
{
    "date": "2025-09-03T10:05:52.744Z",
    "amount": 50,
    "status": "pending",
    "paymentMethod": "Crypto - BTC",
    "reference": "CRYPTO1756893950937DLXK6H",
    "description": "Wallet top-up",
    "user": "68b43f26a868b02be1b0af7d",
    "action": "crypto_payment",
    "transactionType": "top-up",
    "cryptoInvoiceId": "68b812ffe107c7aad501449f",
    "cryptoOrderNumber": "CRYPTO1756893950937DLXK6H",
    "cryptoCurrency": "BTC",
    "cryptoAmount": 50,
    "cryptoInvoiceUrl": "https://plisio.net/invoice/68b812ffe107c7aad501449f",
    "cryptoExpiresAt": "2025-09-04T10:05:52.744Z",
    "plisioWebhookData": {
        "txn_id": "68b812ffe107c7aad501449f",
        "invoice_url": "https://plisio.net/invoice/68b812ffe107c7aad501449f",
        "invoice_total_sum": "50.00000000"
    },
    "createdAt": "2025-09-03T10:05:52.772Z",
    "updatedAt": "2025-09-03T10:05:52.772Z",
    "userDetails": {
        "userId": "3887737",
        "fullname": "josh",
        "email": "josh@gmail.com",
        "id": "68b43f26a868b02be1b0af7d"
    },
    "id": "68b81300d6c3f04eddb98e24"
}
```
**Error Responses**:
- `400 Bad Request`: Invalid payment data or Plisio API error
- `403 Forbidden`: Account not active

### 36. **GET** `/payments/crypto/{orderNumber}`
**Description**: Get crypto payment by order number  
**Authentication**: JWT required  
**Response**: Crypto payment object with transaction details

### 37. **GET** `/payments/crypto`
**Description**: Get user's crypto payment history  
**Authentication**: JWT required  
**Query Parameters**:
- `page`: number (default: 1)
- `limit`: number (default: 10)

**Response**:
```json
{
  "payments": [/* crypto payment objects */],
  "total": "number",
  "page": "number",
  "totalPages": "number"
}
```

### 38. **GET** `/payments/crypto/currencies`
**Description**: Get supported crypto currencies from Plisio  
**Authentication**: None required  
**Response**: Array of supported cryptocurrency objects

### 39. **POST** `/payments/webhook`
**Description**: Plisio webhook endpoint for payment status updates  
**Authentication**: None required (public endpoint)  
**Request Body**: Plisio webhook payload  
**Response**:
```json
{
  "status": "OK|ERROR",
  "message": "string"
}
```

### 40. **GET** `/payments/admin/crypto`
**Description**: Get all crypto payments (Admin only)  
**Authentication**: JWT + Admin role required  
**Query Parameters**:
- `page`: number (default: 1)
- `limit`: number (default: 10)

**Response**: Paginated crypto payments with user details

### 41. **GET** `/payments/admin/crypto/{orderNumber}`
**Description**: Get specific crypto payment (Admin only)  
**Authentication**: JWT + Admin role required  
**Response**: Complete crypto payment object with all details

---

## 🔄 Crypto Payment Flow

1. **Create Payment**: User calls `POST /payments/crypto/create`
2. **Get Payment URL**: Redirect user to `invoiceUrl` from response
3. **User Pays**: User sends crypto to provided wallet address
4. **Webhook Updates**: Plisio sends status updates to `/payments/webhook`
5. **Completion**: Successful payments update user's wallet balance

## 💎 Crypto Payment Statuses

| Status | Description |
|--------|-------------|
| `new` | Payment created, waiting for crypto |
| `pending` | Crypto received, waiting confirmations |
| `confirming` | Getting blockchain confirmations |
| `completed` | Payment confirmed and processed |
| `error` | Payment failed |
| `expired` | Payment expired (24 hours) |
| `cancelled` | Payment cancelled |

---

## �🚀 Getting Started

1. **Start the server**: `npm run start:dev`
2. **Register a user**: `POST /auth/register`
3. **Login**: `POST /auth/login`
4. **Use the JWT token** in Authorization header for protected endpoints
5. **Create/manage wallets** and **transactions** as needed
6. **Set up Plisio** following the `PLISIO_SETUP_GUIDE.md`

## 🔧 Environment Variables

Make sure to set up your `.env` file with:
```env
MONGODB_URI=mongodb://localhost:27017/nestjs-app
JWT_SECRET=your-jwt-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
PLISIO_API_KEY=your-plisio-secret-key
PLISIO_CALLBACK_URL=https://yourdomain.com/payments/webhook
```

## 📝 Notes

- All amounts are in decimal format
- Dates are in ISO format
- File uploads use Cloudinary for storage
- Crypto payments use Plisio for processing
- All responses include appropriate HTTP status codes
- Error responses follow consistent format with message and status code
