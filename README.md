# StudyMind

AI-powered study notes web application. Upload `.txt` and `.pdf` notes, then ask questions using hybrid local retrieval (BM25 + cosine similarity).

## Features

- **Authentication** — Register, login, logout with JWT
- **Notes** — Upload, list, search, and delete study materials
- **AI Q&A** — Hybrid retrieval scoring: `0.5 × BM25 + 0.5 × cosine similarity`
- **UI** — Modern dashboard, sidebar navigation, dark mode, mobile responsive

## Tech Stack

| Layer    | Technologies                                      |
|----------|---------------------------------------------------|
| Backend  | Python, FastAPI, SQLAlchemy, SQLite, Pydantic   |
| Frontend | React, Vite, Tailwind CSS, Axios, React Router   |
| AI       | sentence-transformers, rank-bm25                  |

## Project Structure

```
studymind/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── config.py            # Settings from .env
│   │   ├── database.py          # SQLAlchemy setup
│   │   ├── dependencies.py      # Auth middleware
│   │   ├── models/              # users, notes, chat_history
│   │   ├── schemas/             # Pydantic validation
│   │   ├── routers/             # API endpoints
│   │   └── services/            # Auth, extraction, retrieval
│   ├── sample_data/             # Sample study notes
│   ├── tests/                   # API tests
│   ├── seed.py                  # Test accounts & sample data
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/          # Layout, Sidebar, etc.
│   │   ├── context/             # Auth & theme providers
│   │   ├── pages/               # Dashboard, Notes, Chat
│   │   └── services/api.js      # Axios client
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml
└── README.md
```

## Quick Start (Local Development)

### Prerequisites

- Python 3.11+
- Node.js 18+
- npm or yarn

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate        # Linux/macOS
# .venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and set a strong SECRET_KEY

# Seed test accounts and sample notes
python seed.py

# Start API server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs: http://localhost:8000/docs

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Start dev server
npm run dev
```

App: http://localhost:5173

### Test Accounts

| Email                   | Password    |
|-------------------------|-------------|
| demo@studymind.app      | demo1234    |
| student@studymind.app   | student123  |

## API Endpoints

| Method | Endpoint           | Description              |
|--------|--------------------|--------------------------|
| POST   | `/auth/register`   | Create account           |
| POST   | `/auth/login`      | Get JWT token            |
| POST   | `/auth/logout`     | Logout (client-side)     |
| GET    | `/auth/me`         | Current user             |
| POST   | `/notes/upload`    | Upload .txt or .pdf      |
| GET    | `/notes/list`      | List/search notes        |
| DELETE | `/notes/delete/{id}` | Delete a note          |
| POST   | `/chat/ask`        | Ask a question           |
| GET    | `/chat/history`    | Chat history             |
| GET    | `/health`          | Health check             |

## Docker

### Run with Docker Compose

```bash
# From project root
docker compose up --build

# Seed data (first time)
docker compose exec backend python seed.py
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000

### Stop

```bash
docker compose down
```

## Testing

```bash
cd backend
source .venv/bin/activate
pytest tests/ -v
```

## Deployment Guide

### Backend (Production)

1. **Use a production ASGI server** with multiple workers:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
   ```

2. **Environment variables** — Set in your hosting platform:
   - `SECRET_KEY` — Long random string (required)
   - `DATABASE_URL` — Consider PostgreSQL for production
   - `CORS_ORIGINS` — Your frontend domain(s)

3. **Reverse proxy** — Put Nginx or Caddy in front for HTTPS:
   ```nginx
   location / {
       proxy_pass http://127.0.0.1:8000;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
   }
   ```

4. **Recommended platforms**: Railway, Render, Fly.io, AWS ECS, Google Cloud Run

### Frontend (Production)

1. Build with your API URL:
   ```bash
   VITE_API_URL=https://api.yourdomain.com npm run build
   ```

2. Deploy `dist/` to static hosting: Vercel, Netlify, Cloudflare Pages, or S3 + CloudFront

3. Ensure CORS on the backend includes your frontend origin

### Database Migration (SQLite → PostgreSQL)

For production scale, switch `DATABASE_URL` to PostgreSQL:
```
DATABASE_URL=postgresql://user:pass@host:5432/studymind
```
Add `psycopg2-binary` to requirements.txt. SQLAlchemy models work unchanged.

### Security Checklist

- [ ] Set a strong `SECRET_KEY`
- [ ] Enable HTTPS everywhere
- [ ] Restrict `CORS_ORIGINS` to your domain
- [ ] Set upload size limits (`MAX_UPLOAD_SIZE_MB`)
- [ ] Use PostgreSQL for concurrent writes
- [ ] Back up database and uploads regularly

## How Retrieval Works

1. **Upload** — Text is extracted from `.txt` or `.pdf`
2. **Chunk** — Content split into ~500 char overlapping segments
3. **Embed** — Each chunk gets a local sentence-transformer embedding
4. **Query** — Question scored with hybrid retrieval:
   - BM25 keyword relevance (normalized)
   - Cosine similarity on embeddings (normalized)
   - Combined: `score = 0.5 × BM25 + 0.5 × cosine`
5. **Answer** — Top chunks returned with confidence score

## License

MIT
