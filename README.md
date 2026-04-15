# StudentAI

Full-stack AI study assistant, quiz generator, and email tool powered by RAG (Retrieval-Augmented Generation).

Upload study materials, ask questions about them, generate intelligent quizzes, and create context-aware emails — all backed by LLMs with semantic document search.

## Features

- **Document Upload** — Upload PDFs, TXT, and Markdown files. Text is extracted, chunked, embedded, and stored in a FAISS vector database per user.
- **RAG-based Q&A** — Ask questions about your uploaded materials. The system retrieves relevant chunks via similarity search and generates answers using an LLM.
- **Smart Quiz Generator** — Generate contextual quizzes from your study materials with MCQ, short answer, and true/false questions. Multi-tier grading (exact → fuzzy → LLM) with detailed feedback.
- **Email Generator** — Generate emails grounded in your document context. Choose from formal, friendly, or professional tone.
- **Gmail Integration** — Connect your Google account via OAuth 2.0 and send generated emails directly from the app. Tokens encrypted at rest.
- **JWT Auth with Redis Sessions** — Register/login with hashed passwords. Sessions stored in Redis with logout and logout-all-devices support.
- **Redis Caching** — LLM responses cached for 1 hour. Cache auto-invalidated when documents change.
- **Rate Limiting** — Redis-backed rate limits (100 req/15min API, 20 req/15min auth) that persist across restarts.
- **Dockerized** — Full docker-compose setup with health checks, restart policies, and persistent volumes.

## Architecture

```
React (TailwindCSS)  ──>  Express API (Node.js)
                             │  serves static frontend build
                             │  + API routes
                             │         │
                       LangChain    Zod validation
                       (LCEL chains)   JWT + bcrypt
                             │
               ┌─────────────┼─────────────┐
               ▼             ▼             ▼
            MongoDB        Redis         FAISS
           (users,       (cache,       (vector
            docs,        sessions,      embeddings,
            chats,       rate limits)   per-user)
            quizzes)
```

> **Note:** In Docker, the backend container builds the React frontend in a multi-stage build and serves both the static files and API on port 5000. A standalone nginx frontend container is also available on port 3002 for environments where separate serving is preferred.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 18, React Router, TailwindCSS, Axios |
| Backend | Node.js 20, Express, Mongoose, Multer, Zod |
| AI | LangChain (LCEL), OpenAI (GPT + embeddings), FAISS |
| Data | MongoDB 7, Redis 7, FAISS vector store |
| Infra | Docker Compose, nginx, Winston logging |

## Project Structure

```
StudentAI/
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/         # ChatInterface, DocumentUpload, EmailGenerator, Quiz components, PrivateRoute
│   │   ├── pages/              # Login, Dashboard
│   │   ├── hooks/              # useAuth (AuthContext + provider)
│   │   ├── services/           # api, auth, chat, documents, email, gmail, quiz
│   │   └── styles/             # TailwindCSS entry
│   └── package.json
│
├── server/                     # Express backend
│   ├── server.js               # Entry point
│   └── src/
│       ├── config/             # db.js, redis.js
│       ├── controllers/        # auth, chat, document, email, gmail, quiz
│       ├── middlewares/        # auth, error, rateLimiter, upload, validate
│       ├── models/             # User, Document, Chat, Quiz
│       ├── routes/             # auth, chat, document, email, gmail, quiz
│       ├── services/           # llm, rag, email, gmail, quiz (generator, evaluator), chunking, embedding, vectorStore
│       └── utils/              # logger, cache, session, encryption
│
├── worker/                     # Background job processor
│   └── pdfProcessor.js
│
├── docker/                     # Docker configuration
│   ├── docker-compose.yml
│   ├── Dockerfile.client       # Multi-stage: node build + nginx serve (standalone frontend)
│   ├── Dockerfile.server       # Multi-stage: builds frontend + backend together
│   └── nginx.conf              # SPA routing + API proxy (for standalone frontend)
│
├── .env.example
├── CLAUDE.md                   # AI coding instructions
├── INSTRUCTIONS.md             # Setup and run guide
└── README.md
```

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register with name, email, password |
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/auth/logout` | Revoke current session |
| POST | `/api/auth/logout-all` | Revoke all sessions |

### Documents
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/documents` | Upload file (multipart, field: `file`) |
| GET | `/api/documents` | List user's documents |
| DELETE | `/api/documents/:id` | Delete a document |

### Chat (RAG Q&A)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat/ask` | Ask a question (`{ question }`) |
| GET | `/api/chat/history` | Paginated history (`?page=1&limit=20`) |

### Email
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/email/generate` | Generate email (`{ prompt, tone }`) |

### Gmail
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/gmail/status` | Check Gmail connection status |
| GET | `/api/gmail/connect` | Get Google OAuth consent URL |
| GET | `/api/gmail/callback` | OAuth callback (no auth — Google redirect) |
| POST | `/api/gmail/send` | Send email (`{ to, cc?, subject, body }`) |
| POST | `/api/gmail/disconnect` | Disconnect Gmail account |

### Quiz
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/quiz/generate` | Generate quiz (`{ questionCount, difficulty, documentIds? }`) |
| POST | `/api/quiz/:id/submit` | Submit answers (`{ answers: [] }`) |
| GET | `/api/quiz/history` | Paginated history (`?page=1&limit=10&difficulty=medium`) |
| GET | `/api/quiz/:id` | Get single quiz (questions only if not submitted) |
| DELETE | `/api/quiz/:id` | Delete a quiz |

All endpoints except auth and `/api/gmail/callback` require a `Bearer` token in the `Authorization` header.

## Quick Start

See [INSTRUCTIONS.md](INSTRUCTIONS.md) for detailed setup steps.

```bash
# 1. Clone and configure
cp .env.example .env
# Edit .env — set JWT_SECRET and OPENAI_API_KEY

# 2. Start with Docker
cd docker && docker compose up -d

# 3. Open
# App (backend serves frontend): http://localhost:5000
# Standalone frontend (nginx):   http://localhost:3002
# API health check:              http://localhost:5000/api/health
```

> **VS Code / code-server users:** The frontend auto-detects proxy environments. Access the app via your code-server proxy URL (e.g., `/proxy/5000/`). API calls are routed through `/proxy/5000/api` automatically.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/studentai` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | Secret for signing JWTs | (required) |
| `OPENAI_API_KEY` | OpenAI API key | (required) |
| `LLM_MODEL` | Chat model | `gpt-3.5-turbo` |
| `EMBEDDING_MODEL` | Embedding model | `text-embedding-ada-002` |
| `SESSION_TTL` | Session lifetime in seconds | `604800` (7 days) |
| `LOG_LEVEL` | Winston log level | `info` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID (for Gmail) | (optional) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | (optional) |
| `GOOGLE_REDIRECT_URI` | OAuth redirect URI | `http://localhost:5000/api/gmail/callback` |
| `TOKEN_ENCRYPTION_KEY` | 64-char hex key for encrypting OAuth tokens | (optional) |

## License

MIT
