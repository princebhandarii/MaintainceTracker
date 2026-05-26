# 🏢 Society Maintenance Tracker

A full-stack web app for managing society maintenance payments across wings, flats, and months.

---

## 🚀 Tech Stack
- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express + MongoDB (Mongoose)
- **Auth**: JWT (Bearer token)

---

## ⚙️ Setup

### 1. Clone & Install

```bash
# Root
npm install

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Configure Environment

**backend/.env**
```
MONGO_URI=mongodb://localhost:27017/society-tracker
JWT_SECRET=your_super_secret_key
JWT_EXPIRE=7d
PORT=5002
FRONTEND_URL=http://localhost:5173
```

**frontend/.env**
```
VITE_API_URL=/api
```

### 3. Seed the Database

```bash
cd backend
npm run seed
```

This creates:
- **Super Admin**: `superadmin` / `Admin@123`
- **Wing Admins** (A–F): `winga` / `WingA@123`, `wingb` / `WingB@123`, …
- **288 flats** across 6 wings — owner names are **intentionally empty** (add them manually via dashboard)

### 4. Start the App

```bash
# Backend (port 5002)
cd backend && npm run dev

# Frontend (port 5173)
cd frontend && npm run dev
```

---

## ✨ Features

### Dashboard
- Monthly payment status grid (✓ Paid, ✗ Unpaid, ! Overdue, – No data)
- **Inline owner name editing** — click any owner cell or "Add name…" to type and save
- Search by flat number or owner name
- Filter by payment status
- Wing tabs for Super Admin

### PDF & Excel Export
- Click **📄 PDF** or **📊 Excel** in the dashboard header
- Downloads are auth-protected (JWT sent via axios — no broken `<a href>` links)
- PDF: formatted table with colour-coded status rows
- Excel: UTF-8 CSV with BOM (opens cleanly in Microsoft Excel)

### Admin Panel (`/admin` — Super Admin only)
- **Add User** form: only requires **Full Name**, **Username (ID)**, **Password**, **Wing**
- Users table shows **Seeded / Created** date for each account
- Reset password for any user
- Deactivate users (soft delete)

### Flat Detail Page
- Inline owner name editing in the flat header
- Month-by-month payment grid
- Summary cards (paid months, pending, collected)

---

## 📋 Login Credentials (after seed)

| Role        | Username    | Password     |
|-------------|-------------|--------------|
| Super Admin | superadmin  | Admin@123    |
| Wing A      | winga       | WingA@123    |
| Wing B      | wingb       | WingB@123    |
| Wing C      | wingc       | WingC@123    |
| Wing D      | wingd       | WingD@123    |
| Wing E      | winge       | WingE@123    |
| Wing F      | wingf       | WingF@123    |

---

## 🔒 Permissions

| Feature              | Super Admin | Wing Admin         |
|----------------------|-------------|--------------------|
| View all wings       | ✅           | ❌ (own wing only)  |
| Edit owner names     | ✅           | ✅ (own wing only)  |
| Add/manage users     | ✅           | ❌                  |
| Export PDF / Excel   | ✅ (any wing)| ✅ (own wing only)  |
| Record payments      | ✅           | ✅ (own wing only)  |
| Create / delete flats| ✅           | ❌                  |
