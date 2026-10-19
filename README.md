# Retain

Retain is a personal expense and budget tracker. Each person signs in, records their own spending, and sets one budget for the month. An admin can manage the shared categories and see how the whole platform is being used.

Live app: https://retain-app-1-l801.onrender.com

## Technologies used

- Frontend: React 19, TypeScript, and Vite
- Routing: React Router
- Sign-in state: React Context
- Expense search, filters, and sorting: Redux Toolkit. The filter choices live in Redux, and the API applies them in MongoDB
- Backend: Node.js and Express
- Database: MongoDB with Mongoose
- Passwords: bcrypt
- Sessions: JSON Web Tokens

## Main features

- Sign up, sign in, and sign out
- New accounts are always a normal user. The admin account is created only by the database seed
- Protected pages, with admin-only pages for insights and categories
- Create, view, update, and delete your own expenses
- Search by title or notes, and filter by category, payment method, and date
- Sort expenses by date or amount, with pagination
- One monthly budget per user, with a status of within budget, approaching budget (80% or more), over budget, or no budget set
- A dashboard for the signed-in user: spent, remaining, spending by category, and recent expenses
- Admin category create, rename, and delete. Deleting a category moves its expenses to Uncategorized. Uncategorized cannot be deleted
- Admin overview of users, expenses, totals, category use, recent transactions, and new accounts
- Users can only read and change their own expenses and budgets

## Setup

You need Node.js and a running MongoDB database.

1. Clone the repository and open it.

2. In `backend`, install the packages and create the environment file:

```powershell
cd backend
npm install
copy .env.example .env
```

3. `backend/.env.example` is already filled in for local use. The copy command creates a working `backend/.env`. You only need to change `MONGODB_URI` if MongoDB is not running on this computer.

The admin account in that file is:

- Name: Sonia Admin
- Email: soniaadmin@gmail.com
- Password: AdminSonia224

4. Create the admin account and the starting categories:

```powershell
npm run seed
```

Run this again any time you change `ADMIN_NAME`, `ADMIN_EMAIL`, or `ADMIN_PASSWORD`.

5. Start the API:

```powershell
npm run dev
```

The API listens on `http://localhost:5000`.

6. In a second terminal, start the website:

```powershell
cd frontend
npm install
npm run dev
```

`frontend/.env` should contain:

```text
VITE_API_URL=http://localhost:5000
```

7. Open the address Vite prints, usually `http://localhost:5173`.

Sign up creates a personal account. To open Admin and Categories, sign in with `soniaadmin@gmail.com` and `AdminSonia224` after `npm run seed`.

The live site is one Render web service. It serves the website and the API on the same address. On Render, set `MONGODB_URI` to the Atlas connection string and set `JWT_SECRET`. Do not set `VITE_API_URL` there. The live website calls `/api` on its own address.

## API

The base URL locally is `http://localhost:5000/api`.

Send `Content-Type: application/json`. After sign-in, send `Authorization: Bearer <token>` on every route except health, sign-up, and sign-in. The token lasts 7 days.

Amounts are numbers. Months use `YYYY-MM`. Dates use `YYYY-MM-DD`. Payment methods are `Cash`, `Card`, `Bank Transfer`, and `Mobile Money`.

| Method | Path | Who | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | Anyone | Check that the API is running |
| POST | `/auth/signup` | Anyone | Create a user account |
| POST | `/auth/signin` | Anyone | Sign in and receive a token |
| GET | `/auth/me` | Signed in | Read the current account |
| GET | `/expenses` | Signed in | List only that user's expenses |
| POST | `/expenses` | Signed in | Add an expense |
| GET | `/expenses/:id` | Signed in | Read one of that user's expenses |
| PUT | `/expenses/:id` | Signed in | Update one of that user's expenses |
| DELETE | `/expenses/:id` | Signed in | Delete one of that user's expenses |
| GET | `/budgets?month=YYYY-MM` | Signed in | Read that user's budget for the month |
| PUT | `/budgets` | Signed in | Save that user's budget. Body: `{ "month": "YYYY-MM", "amount": 200 }` |
| GET | `/categories` | Signed in | List categories |
| GET | `/dashboard?month=YYYY-MM` | Signed in | That user's month summary |
| GET | `/admin/insights?month=YYYY-MM` | Admin | Platform totals, category use, recent expenses, and recent users |
| POST | `/admin/categories` | Admin | Create a category. Body: `{ "name": "Food" }` |
| PUT | `/admin/categories/:id` | Admin | Rename a category. Body: `{ "name": "Groceries" }` |
| DELETE | `/admin/categories/:id` | Admin | Delete a category and move its expenses to Uncategorized |

`GET /expenses` accepts `search`, `category`, `paymentMethod`, `dateFrom`, `dateTo`, `minAmount`, `maxAmount`, `sortBy` (`date` or `amount`), `sortOrder` (`asc` or `desc`), `page`, and `limit`. `limit` defaults to 10 and cannot be more than 50.

An expense body looks like this:

```json
{
  "title": "Lunch",
  "amount": 15,
  "category": "category-id",
  "date": "2026-10-18",
  "paymentMethod": "Cash",
  "notes": "Campus lunch"
}
```

A missing or forbidden record returns 404. A bad id or body returns 400. A duplicate category name returns 409. A missing or invalid token returns 401.
