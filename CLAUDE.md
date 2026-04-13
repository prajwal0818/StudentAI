# StudentAI (Full-Stack AI Study + Email Assistant)

StudentAI is a production-ready full-stack AI application that helps students understand study materials and generate intelligent emails using LLMs with Retrieval-Augmented Generation (RAG).

---

# 🚀 Project Overview

StudentAI allows users to:

- Upload study materials (PDFs, notes, documents)
- Ask questions about uploaded content using AI (RAG-based Q&A)
- Generate emails based on:
  - User prompts
  - Uploaded document context
- Choose tone: formal, friendly, professional

---

# 🧠 Core Architecture

Frontend (React + TailwindCSS)
        ↓
Backend API (Node.js + Express)
  (also serves frontend static build in Docker)
        ↓
AI Orchestration Layer (LangChain)
        ↓
LLM Provider (OpenAI / other models)
        ↓
----------------------------------------
MongoDB (database)
Redis (cache + queues + sessions)
Vector DB (FAISS / Pinecone)
----------------------------------------

---

# 🧱 Tech Stack

## Frontend
- React (recommended: Next.js)
- TailwindCSS
- Axios

## Backend
- Node.js + Express
- JWT Authentication
- Multer (file uploads)
- Input validation (Zod/Joi)

## AI Layer
- LangChain (LLM orchestration)
- RAG pipeline

## Databases
- MongoDB (users, chats, metadata)
- Vector DB (embeddings + semantic search)
- Redis (caching, sessions, queues)

## Infrastructure
- Docker (containerization)
- Vercel (frontend deployment)
- Render / VPS (backend deployment)

---

# 🧠 AI SYSTEM DESIGN

## Document Processing
- Upload PDF/text
- Split into chunks
- Generate embeddings
- Store in vector DB

## RAG Pipeline
- Convert user query into embedding
- Retrieve relevant chunks
- Send context to LLM
- Generate response

## Email Generation
- Combine:
  - user prompt
  - retrieved context
- Generate structured email using LLM

---

# ⚡ REDIS USAGE

- Cache LLM responses (reduce cost)
- Store sessions (fast auth/state)
- Queue system for heavy jobs (PDF processing)
- Rate limiting to prevent abuse

---

# 🧩 VECTOR DATABASE

Purpose:
- Store embeddings of documents
- Perform semantic search

Options:
- FAISS (local development)
- Pinecone (production scalable)

---

# 🗂️ PROJECT STRUCTURE

StudentAI/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── utils/
│   │   └── styles/
│   ├── package.json
│
├── server/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   │   ├── llm.service.js
│   │   │   ├── rag.service.js
│   │   │   ├── email.service.js
│   │   ├── models/
│   │   ├── middlewares/
│   │   ├── utils/
│   │   └── config/
│   ├── server.js
│   ├── package.json
│
├── worker/
│   └── pdfProcessor.js
│
├── docker/
│   ├── docker-compose.yml
│   ├── Dockerfile.client       # Standalone frontend: node build + nginx serve
│   ├── Dockerfile.server       # Multi-stage: builds frontend + backend together
│   └── nginx.conf              # SPA routing + API proxy (for standalone frontend)
│
├── .env.example
├── README.md
├── INSTRUCTIONS.md
└── CLAUDE.md

---

# 🔄 WORKFLOWS

## Upload Flow
1. User uploads file
2. Backend extracts text
3. Split into chunks
4. Generate embeddings
5. Store in vector DB
6. Save metadata in MongoDB

---

## Question Answering Flow
1. User asks question
2. Convert query → embedding
3. Retrieve relevant chunks
4. Send to LLM via LangChain
5. Return answer
6. Cache response in Redis

---

## Email Generation Flow
1. User enters prompt
2. Retrieve relevant context
3. Build prompt using LangChain
4. Generate email using LLM
5. Return response

---

# 🐳 DOCKER STRATEGY

Services:
- backend (server) — multi-stage build that also builds and serves the React frontend on port 5000
- frontend (client) — standalone nginx container on port 3002 (optional, for separate frontend serving)
- redis
- mongo

The backend Dockerfile.server builds the frontend in a first stage, copies the build output into the backend container, and Express serves the static files with SPA fallback. This means port 5000 is the primary access point for both the UI and API.

The frontend API client (`client/src/services/api.js`) auto-detects VS Code code-server proxy environments and routes API calls through `/proxy/5000/api` when needed.

Use docker-compose for local development.

---

# 🔐 SECURITY

- Use environment variables for secrets
- JWT authentication
- Input validation
- Rate limiting via Redis
- File size/type restrictions

---

# 📈 PRODUCTION FEATURES

- Response caching (Redis)
- Streaming responses
- Retry handling for LLM failures
- Logging system (Winston/Pino)
- Error tracking (Sentry)

---

# 🚀 DEPLOYMENT

Frontend:
- Vercel

Backend:
- Render or VPS (Hostinger)

Database:
- MongoDB Atlas
- Redis Cloud (Upstash)
- Pinecone (optional)

---

# 💡 FUTURE IMPROVEMENTS

- Voice assistant (speech-to-text)
- Gmail integration
- Multi-user collaboration
- Multi-agent workflows (LangGraph upgrade)
- PDF annotation system

---

# 🎯 GOAL

StudentAI demonstrates:

- Full-stack MERN development
- Production-grade LLM integration
- RAG-based AI systems
- Scalable backend architecture
- Deployment-ready SaaS design
