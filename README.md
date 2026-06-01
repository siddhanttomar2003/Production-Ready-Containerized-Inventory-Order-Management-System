# LogiTrack: Production-Ready Inventory & Order Management System

LogiTrack is a modern, full-stack, containerized Inventory & Order Management System. It features a premium, responsive glassmorphism web dashboard on the frontend, backed by a scalable Flask API and a PostgreSQL database.

## Demo Video

[Demo Video](https://drive.google.com/file/d/1oehhe7H9xPjdZNlZyPSkKvNGDPm5dZyC/view?usp=sharing)

---

## 🚀 Key Features

* **Premium Dashboard**: Curated sales summaries, interactive stock reports, quick action shortcuts, fast-moving items tracker, and dynamic activity timelines.
* **User Authentication**: Secure Sign-in/Sign-up flow with pbkdf2/scrypt password hashing, session token persistence in `localStorage`, and route guarding.
* **Database Integrations**: Dynamic CRUD pages for **Inventory (Products)**, **Suppliers**, **Customers**, and **Orders** backed by PostgreSQL.
* **Strict Schema Validations**: 
  * Strict 10-digit phone number validations for Customers (both client-side and server-side).
  * Standardized Product SKU formats (e.g. `LAP-1001`, uppercase alphanumeric separated by hyphens).
* **Automated Seeding**: Auto-populates mock suppliers and products upon first launch if the database is blank.
* **Containerization**: Standardized developer workflow and production builds utilizing Docker and Docker Compose.

---

## 🛠️ Tech Stack

* **Frontend**: React 19, Vite, Vanilla CSS (Premium custom UI).
* **Backend**: Flask, SQLAlchemy ORM (PostgreSQL), Marshmallow (Schema Validation), Flask-Migrate (Alembic), Gunicorn (WSGI Server).
* **Database**: PostgreSQL 16.
* **Containerization & Hosting**: Docker, Docker Compose, Nginx (SPA Server), Render (Backend/PostgreSQL), Vercel (Frontend).

---

## 📁 Repository Structure

```text
├── backend/
│   ├── app/
│   │   ├── models/        # SQLAlchemy Models (User, Product, Order, etc.)
│   │   ├── routes/        # Blueprint Controllers (Auth, Customers, Dashboard, etc.)
│   │   ├── schemas/       # Marshmallow Validation Schemas
│   │   ├── services/      # Business logic services
│   │   └── config.py      # Flask Configuration Profiles
│   ├── migrations/        # Database migration files (Alembic versions)
│   ├── Dockerfile         # Python slim production runner
│   └── requirements.txt   # Python packages
│
├── frontend/
│   ├── public/            # Static assets and icons
│   ├── src/
│   │   ├── components/    # Reusable UI widgets (Navbar, Sidebar)
│   │   ├── layouts/       # Main Grid Dashboard Layout
│   │   ├── pages/         # Page Views (Dashboard, Inventory, Customers, etc.)
│   │   ├── routes/        # Session protection and routing
│   │   └── services/      # Fetch services to communicate with backend
│   ├── Dockerfile         # Multi-stage container build (Node.js & Nginx)
│   ├── nginx.conf         # Nginx SPA router redirect settings
│   └── vercel.json        # Vercel SPA routing rewrite configurations
│
└── docker-compose.yml     # Multi-container orchestration (db, backend, frontend)
```

---

## 💻 Local Setup (Development)

### Option A: Run via Docker (Recommended)
Make sure you have [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

1. **Clone the repository**:
   ```bash
   git clone https://github.com/siddhanttomar2003/Production-Ready-Containerized-Inventory-Order-Management-System.git
   cd Production-Ready-Containerized-Inventory-Order-Management-System
   ```

2. **Boot the complete stack**:
   ```bash
   docker compose up --build -d
   ```
   *This builds the Node.js/Nginx frontend on port `3000`, the Flask backend on port `5000`, and provisions the PostgreSQL database on port `5432`.*

3. **Access the application**:
   * **Frontend**: `http://localhost:3000`
   * **Backend API**: `http://localhost:5000`

---

### Option B: Run Locally (Without Docker)

#### 1. Start PostgreSQL
Ensure you have a PostgreSQL server running locally on port `5432` and create a database named `ethara`.

#### 2. Run Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # macOS/Linux:
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run migrations and start the Flask server:
   ```bash
   flask db upgrade
   python run.py
   ```

#### 3. Run Frontend
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Boot the Vite dev server:
   ```bash
   npm run dev
   ```
   *Open your browser to `http://localhost:3000`.*

---

## 🌐 Production Deployment

### Backend & Database (Render)
1. Provision a new **PostgreSQL Database** on Render. Copy its **External Connection String**.
2. Create a new **Web Service** on Render linked to your repository.
   * **Language**: `Docker`
   * **Root Directory**: `backend`
   * **Dockerfile Path**: `backend/Dockerfile`
3. Add the following **Environment Variables**:
   * `DATABASE_URL`: *(Your Render PostgreSQL connection string)*
   * `FLASK_ENV`: `production`
   * `SECRET_KEY`: *(A random secure string)*
   * `FRONTEND_ORIGIN`: *(Your Vercel URL)*

### Frontend (Vercel)
1. Create a new project on Vercel linked to your repository.
2. Select **`frontend`** as the root directory (Vercel automatically detects the **Vite** preset).
3. Add the following **Environment Variable**:
   * `VITE_API_URL`: *(Your live Render backend URL)*
4. Click **Deploy**.

---

## 🛠️ Database Maintenance & CLI Commands

To manage database updates or inspect table records locally:

* **Apply pending migrations**:
  ```bash
  docker compose exec backend flask db upgrade
  ```
* **Create a new database migration script**:
  ```bash
  docker compose exec backend flask db migrate -m "Description of changes"
  ```
* **Query the PostgreSQL database directly**:
  ```bash
  docker exec -it ethara-postgres psql -U postgres -d ethara
  ```
  *(Inside psql, run `\dt` to list tables and `SELECT * FROM users;` to inspect entries).*
