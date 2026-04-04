# Finance Dashboard Backend

A production-grade REST API for a finance dashboard system built with NestJS, TypeScript, PostgreSQL, and Prisma.

## Tech Stack

- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: class-validator & class-transformer
- **Password Hashing**: bcryptjs
- **API Documentation**: Swagger UI
- **Security**: Helmet, Rate Limiting, Account Lockout

## Features

- JWT Authentication with account lockout after 5 failed attempts
- Role based access control with 3 roles — VIEWER, ANALYST, ADMIN
- Full transaction CRUD with soft delete
- Filtering, pagination, and search on transactions
- Dashboard summary — total income, expenses, net balance
- Monthly and weekly trends
- Category wise breakdown and top 5 expense categories
- Admin can view any user's summary and transactions
- Audit logging — every create, update, delete tracked with who did it
- Helmet security headers
- Rate limiting — 10 requests per second, 100 per minute
- Environment variable validation on startup
- Global exception filter with consistent error responses
- Response interceptor — automatic response wrapping
- Swagger documentation with JWT authorization
- Seed file with 3 test accounts and 15 realistic transactions
- Soft delete preserves financial records for audit trail
- CORS configuration
- PostgreSQL with Prisma ORM and type safe queries

## Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL v14+

### Setup

**1. Clone the repository:**
```bash
git clone <repo-url>
cd finance-dashboard
```

**2. Install dependencies:**
```bash
npm install
```

**3. Create a `.env` file in the root:**
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/finance_dashboard"
JWT_SECRET="finance_dashboard_super_secret_key_2024"
JWT_EXPIRES_IN="7d"
ALLOWED_ORIGINS="*"
```

**4. Create the PostgreSQL database:**
```bash
psql -U postgres -c "CREATE DATABASE finance_dashboard;"
```

**5. Run migrations:**
```bash
npx prisma migrate dev
```

**6. Seed the database:**
```bash
npm run seed
```

**7. Start the server:**
```bash
npm run start:dev
```

Server runs at `http://localhost:3000/api`

Swagger docs at `http://localhost:3000/api/docs`

---

## Test Accounts

After seeding, these accounts are ready to use:

| Role    | Email                  | Password   |
|---------|------------------------|------------|
| ADMIN   | admin@finance.com      | admin123   |
| ANALYST | analyst@finance.com    | analyst123 |
| VIEWER  | viewer@finance.com     | viewer123  |

---

## Role Permissions

| Action                          | VIEWER | ANALYST | ADMIN |
|---------------------------------|--------|---------|-------|
| Login / Register                | ✅     | ✅      | ✅    |
| View transactions               | ✅     | ✅      | ✅    |
| View dashboard summary          | ✅     | ✅      | ✅    |
| Create transaction              | ❌     | ✅      | ✅    |
| Update transaction              | ❌     | ✅      | ✅    |
| Delete transaction              | ❌     | ❌      | ✅    |
| View category breakdown         | ❌     | ✅      | ✅    |
| View monthly trends             | ❌     | ✅      | ✅    |
| View weekly trends              | ❌     | ✅      | ✅    |
| View top categories             | ❌     | ✅      | ✅    |
| View any user summary           | ❌     | ❌      | ✅    |
| View any user transactions      | ❌     | ❌      | ✅    |
| Manage users                    | ❌     | ❌      | ✅    |
| Update user roles               | ❌     | ❌      | ✅    |
| Activate / deactivate users     | ❌     | ❌      | ✅    |
| View audit logs                 | ❌     | ❌      | ✅    |

---

## API Reference

### Auth

| Method | Endpoint           | Auth | Description                    |
|--------|--------------------|------|--------------------------------|
| POST   | /api/auth/register | No   | Register new user as VIEWER    |
| POST   | /api/auth/login    | No   | Login and get JWT token        |

**Register example:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Login example:**
```json
{
  "email": "admin@finance.com",
  "password": "admin123"
}
```

---

### Transactions

All endpoints require `Authorization: Bearer <token>` header.

| Method | Endpoint              | Role           | Description             |
|--------|-----------------------|----------------|-------------------------|
| GET    | /api/transactions     | ALL            | List with filters       |
| GET    | /api/transactions/:id | ALL            | Get single transaction  |
| POST   | /api/transactions     | ANALYST, ADMIN | Create transaction      |
| PATCH  | /api/transactions/:id | ANALYST, ADMIN | Update transaction      |
| DELETE | /api/transactions/:id | ADMIN          | Soft delete transaction |

**Query parameters for GET /api/transactions:**

| Param     | Type   | Description                  |
|-----------|--------|------------------------------|
| type      | string | INCOME or EXPENSE            |
| category  | string | Filter by category           |
| startDate | string | ISO date string              |
| endDate   | string | ISO date string              |
| search    | string | Search in category and notes |
| page      | number | Page number (default: 1)     |
| limit     | number | Items per page (default: 10) |

**Create transaction example:**
```json
{
  "amount": 50000,
  "type": "INCOME",
  "category": "Salary",
  "date": "2026-01-01",
  "notes": "Monthly salary"
}
```

---

### Dashboard

All endpoints require `Authorization: Bearer <token>` header.

| Method | Endpoint                       | Role           | Description                    |
|--------|--------------------------------|----------------|--------------------------------|
| GET    | /api/dashboard/summary         | ALL            | Totals and net balance         |
| GET    | /api/dashboard/categories      | ANALYST, ADMIN | Category wise breakdown        |
| GET    | /api/dashboard/trends          | ANALYST, ADMIN | Monthly income vs expense      |
| GET    | /api/dashboard/weekly-trends   | ANALYST, ADMIN | Weekly income vs expense       |
| GET    | /api/dashboard/top-categories  | ANALYST, ADMIN | Top 5 expense categories       |
| GET    | /api/dashboard/user/:userId    | ADMIN          | Summary for a specific user    |

---

### Users

All endpoints require ADMIN role.

| Method | Endpoint                   | Description                   |
|--------|----------------------------|-------------------------------|
| GET    | /api/users                 | List all users                |
| GET    | /api/users/:id             | Get single user               |
| GET    | /api/users/:id/transactions| Get all transactions for user |
| PATCH  | /api/users/:id/role        | Update user role              |
| PATCH  | /api/users/:id/status      | Activate or deactivate user   |

---

### Audit

All endpoints require ADMIN role.

| Method | Endpoint    | Description          |
|--------|-------------|----------------------|
| GET    | /api/audit  | Get last 100 audit logs |

---

## Response Format

**Success:**
```json
{
  "success": true,
  "message": "Transactions retrieved successfully",
  "data": {}
}
```

**Error:**
```json
{
  "success": false,
  "statusCode": 403,
  "timestamp": "2026-04-03T10:00:00.000Z",
  "path": "/api/transactions",
  "message": "Access denied. Required roles: ANALYST, ADMIN"
}
```

---

## Security Features

- **JWT Authentication** — stateless token based auth with 7 day expiry
- **Account Lockout** — account locked for 15 minutes after 5 failed login attempts
- **Helmet** — sets 14 secure HTTP response headers automatically
- **Rate Limiting** — 10 requests per second, 100 requests per minute per IP
- **CORS** — configurable allowed origins via environment variable
- **Password Hashing** — bcrypt with salt rounds of 10
- **Soft Delete** — financial records never permanently deleted
- **Audit Logging** — every data modification tracked with user identity

---

## Project Structure
```
src/
├── audit/
│   ├── audit.controller.ts
│   ├── audit.module.ts
│   └── audit.service.ts
├── auth/
│   ├── dto/
│   │   ├── register.dto.ts
│   │   └── login.dto.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   └── auth.service.ts
├── common/
│   ├── config/
│   │   └── env.validation.ts
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   └── roles.decorator.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── interceptors/
│   │   └── response.interceptor.ts
│   └── types.ts
├── dashboard/
│   ├── dashboard.controller.ts
│   ├── dashboard.module.ts
│   └── dashboard.service.ts
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── transactions/
│   ├── dto/
│   │   ├── create-transaction.dto.ts
│   │   ├── filter-transaction.dto.ts
│   │   └── update-transaction.dto.ts
│   ├── transactions.controller.ts
│   ├── transactions.module.ts
│   └── transactions.service.ts
├── users/
│   ├── dto/
│   │   ├── update-role.dto.ts
│   │   └── update-status.dto.ts
│   ├── users.controller.ts
│   ├── users.module.ts
│   └── users.service.ts
├── app.module.ts
└── main.ts
prisma/
├── migrations/
├── schema.prisma
└── seed.ts
```

---

## Assumptions

- Every newly registered user gets the VIEWER role by default. An admin must manually upgrade roles via `PATCH /api/users/:id/role`
- The first admin account is created via the seed file — not through the public API. This is standard practice in production systems
- Soft delete is used for transactions — deleted records are never permanently removed, preserving audit history for compliance
- Analysts can update only their own transactions. Admins can update any transaction
- JWT tokens expire in 7 days
- Account lockout lasts 15 minutes after 5 consecutive failed login attempts
- VIEWER role is intentionally read-only as per the assignment specification, reflecting real-world finance team structures where data entry is restricted to authorized personnel

---

## Tradeoffs

- Chose NestJS over Express for built-in support for modules, guards, pipes, and decorators — this maps directly to the assignment's requirements for structured access control and validation
- Chose Prisma over raw SQL for type safety, auto-completion, and easy migrations
- Chose PostgreSQL over SQLite for production realism — Zorvyn is a fintech company and PostgreSQL is the industry standard for financial data
- Monthly and weekly trends are computed in application code rather than raw SQL for readability and maintainability, with acceptable performance at this data scale
- Rate limiting uses in-memory store — sufficient for this scale, Redis would be used in a distributed production environment