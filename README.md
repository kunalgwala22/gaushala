# Shree Sawariya Seth Gaushala Management System

A production-ready MERN Stack application for managing a Cow Shelter (Gaushala) trust organization. This system helps manage Donors, Donations, Receipts (with professional landscape A5 PDF generation), Reports (PDF/CSV exports), Cow inventory profiles (with photo uploads), Cow Sponsorship/Adoption programs, and Admin/Staff accounts.

---

## 🛠 Tech Stack

**Frontend:**
* React 19 (TypeScript)
* Vite (Dev Server)
* Tailwind CSS v3
* Framer Motion (Transitions & Micro-animations)
* TanStack Query v5 (React Query)
* React Hook Form & Zod (Input validation)
* Recharts (Interactive SVG Charts)
* Axios (HTTP Client)
* Lucide React (Icon System)

**Backend:**
* Node.js & Express.js (TypeScript)
* MongoDB & Mongoose (Database & ODM)
* JWT Authentication (Access + Refresh Token rotation)
* crypto (AES-256-GCM encryption for Aadhaar numbers at rest)
* PDFKit (On-the-fly landscape A5 receipt layout compiling)
* Multer (Multipart photo uploads)
* Nodemailer (Email templates & reset password links)
* express-rate-limit & Helmet (Security headers and rate limiting)

---

## 📁 Project Structure

```text
gaushala/
├── backend/
│   ├── src/
│   │   ├── config/          # DB connection & JWT settings
│   │   ├── controllers/     # Route business logic handlers
│   │   ├── middleware/      # Auth, uploads, errors, rate limits
│   │   ├── models/          # Mongoose database models
│   │   ├── routes/          # Express API path definitions
│   │   ├── services/        # PDF generation using PDFKit
│   │   ├── utils/           # Mailer, number to words converters, AES encryption
│   │   ├── validators/      # Zod validation schemas
│   │   └── app.ts           # Server initialization
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/      # Shared components
│   │   ├── context/         # Authentication context provider
│   │   ├── layouts/         # Glassmorphic page layouts (Auth/Dashboard)
│   │   ├── pages/           # Page views (Dashboard, Donors, Cows, etc.)
│   │   ├── routes/          # Router index mapping
│   │   ├── services/        # Axios API client
│   │   ├── types/           # TypeScript interfaces
│   │   └── main.tsx         # DOM Mounting
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
└── README.md                # System documentation
```

---

## 🚀 Running Locally

### Prerequisites
* **Node.js** (v18+)
* **NPM** or **Yarn**
* **Docker** (to spin up a local MongoDB instance easily)

### 1. Set Up Database (Docker)
To run a local MongoDB instance in the background on port `27017`, run:
```bash
docker run -d --name gaushala-mongo -p 27017:27017 mongo:latest
```

### 2. Set Up & Run Backend
1. Go to the `backend` folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the database seed script (creates 1 admin, 1 staff, 1 donor, 100 donors, 50 cows, 500 historical donations, and 20 sponsorships):
   ```bash
   npm run seed
   ```
4. Start the backend server in development mode (runs on port `5001`):
   ```bash
   npm run dev
   ```

### 3. Set Up & Run Frontend
1. Go to the `frontend` folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server (runs on port `5174`):
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5174`.

### Default Login Credentials
* **Admin:** `admin@gaushala.com` / `admin123`
* **Staff:** `staff@gaushala.com` / `staff123`
* **Donor:** `donor@gaushala.com` / `donor123`

---

## 📑 API Documentation

All routes are prefixed with `/api`. Authenticated routes require the header `Authorization: Bearer <token>`.

### Authentication
* `POST /auth/register` - Register a new user. Guest registrations automatically create a Donor profile. Admins can create Staff/Admin accounts.
* `POST /auth/login` - Login with email & password. Returns JWT access & refresh tokens.
* `POST /auth/refresh` - Refresh access tokens using refresh token.
* `POST /auth/logout` - Clear refresh token from session.
* `POST /auth/forgot-password` - Requests password reset link. Logs URL link in dev terminal.
* `POST /auth/reset-password` - Resets password using token.
* `GET /auth/profile` - Fetches authenticated user profile & donor card (if applicable).
* `GET /auth/users` - Fetches all staff/admin accounts (Admin-only).

### Donor Management (Admin/Staff only)
* `GET /donors` - Get paginated & filtered donor list. (Aadhaar number is decrypted on the fly for authorized roles).
* `GET /donors/:id` - Get donor details by ID.
* `POST /donors` - Create a new donor profile. (PAN/Aadhaar validated, Aadhaar encrypted).
* `PUT /donors/:id` - Update donor profile.
* `DELETE /donors/:id` - Delete donor profile (Admin-only).

### Donation Management
* `GET /donations` - Get paginated & filtered donations. (Donors see only their own donations).
* `GET /donations/:id` - Get donation by ID.
* `POST /donations` - Record new donation. Generates receipt PDF on-the-fly, saves Receipt record, updates recurring donation schedules (Admin/Staff only).
* `PUT /donations/:id` - Update donation details (Admin/Staff only).
* `DELETE /donations/:id` - Delete donation & delete receipt PDF (Admin-only).

### Cow Management
* `GET /cows` - Get paginated & filtered cow inventory.
* `GET /cows/:id` - Get cow details.
* `POST /cows` - Add a cow. Supports multipart/form-data upload for cow photo (Admin-only).
* `PUT /cows/:id` - Update cow details and photos (Admin-only).
* `DELETE /cows/:id` - Delete cow and delete its photo from disk (Admin-only).

### Sponsorships
* `GET /sponsorships` - Get list of cow adoptions (filtered for Donors).
* `GET /sponsorships/:id` - Get sponsorship details.
* `POST /sponsorships` - Create cow adoption.
* `PUT /sponsorships/:id/status` - Modify status (ACTIVE/EXPIRED).
* `DELETE /sponsorships/:id` - Cancel sponsorship (Admin-only).

### Reports (Admin/Staff only)
* `GET /reports/donations` - Summary totals, category breakdowns, payment method breakdowns, and records list.
* `GET /reports/donations/csv` - Stream/download donation logs as a `.csv` spreadsheet.
* `GET /reports/donations/pdf` - Stream/download donation summary ledger as a formatted multi-page PDF document.
* `GET /reports/donors` - Active donors, new donors list, and top donor rankings.

### Dashboard (Admin only)
* `GET /dashboard/stats` - Total/monthly donations, cow counts, active adoptions, and charts datasets.

---

## ☁️ Deployment Guide

### Database (MongoDB Atlas)
1. Sign up on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a Free Shared Cluster.
3. Add a database user with read/write access.
4. Whitelist access from anywhere (`0.0.0.0/0`) or configure specific IP ranges.
5. Copy the MongoDB connection string to your backend `.env` as `MONGO_URI`.

### Storage (Cloudinary integration)
In a live production environment:
1. Register on [Cloudinary](https://cloudinary.com).
2. Update the helper in `backend/src/middleware/upload.ts` to use `multer-storage-cloudinary` instead of `diskStorage`.
3. Provide the variables `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`.

### Backend (Render)
1. Sign up on [Render](https://render.com).
2. Connect your Git repository.
3. Create a **Web Service**.
4. Configure Build Command: `npm install && npm run build` (make sure you do this in the `backend` folder subdirectory).
5. Configure Start Command: `npm start`.
6. Add Environment Variables:
   * `PORT=10000` (Render binds automatically)
   * `MONGO_URI=mongodb+srv://...`
   * `JWT_ACCESS_SECRET=your_jwt_access_secret`
   * `JWT_REFRESH_SECRET=your_jwt_refresh_secret`
   * `ENCRYPTION_KEY=your_aadhaar_encryption_secret_key`
   * `FRONTEND_URL=https://your-frontend-app.vercel.app`
   * `NODE_ENV=production`

### Frontend (Vercel)
1. Sign up on [Vercel](https://vercel.com).
2. Connect your Git repository.
3. Import the project and choose the `frontend` folder as the Root Directory.
4. Select Framework Preset: `Vite`.
5. Configure Environment Variables:
   * `VITE_API_URL=https://your-backend-app.onrender.com/api`
6. Click **Deploy**.

---

## 🔒 Production Checklist

- [ ] **Secrets Security**: Change all default JWT secrets and encryption keys to 256-bit cryptographically secure values in the production `.env`.
- [ ] **Rate Limiting**: Verify rate limit bounds match expected traffic peaks.
- [ ] **Database Indexes**: Verify MongoDB compound indexes are correctly created on fields: `date`, `receiptNumber`, `email`, and text searches on Donors.
- [ ] **SSL/HTTPS Enforcement**: Ensure all traffic is routed through HTTPS to protect authentication cookies/headers.
- [ ] **Aadhaar Encryption**: Verify Aadhaar data is encrypted in the database before storage (check MongoDB collections to ensure no raw 12-digit strings are present).
- [ ] **PDF Directory Permissions**: If using local upload fallbacks (e.g. VPS instead of Render/Vercel), verify the `uploads` directory has proper read/write permissions.
