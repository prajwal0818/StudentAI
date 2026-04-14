# StudentAI — Setup and Run Instructions

Two ways to run the project: **Docker** (recommended) or **local development**.

---

## Prerequisites

### For Docker setup
- Docker Engine 20+
- Docker Compose v2+
- An OpenAI API key

### For local development
- Node.js 20+
- npm 10+
- MongoDB 7 (running locally or Atlas)
- Redis 7 (running locally or cloud)
- An OpenAI API key

---

## 1. Environment Configuration

```bash
# From the project root
cp .env.example .env
```

Edit `.env` and set these two required values:

```env
JWT_SECRET=change_this_to_a_random_secret_string
OPENAI_API_KEY=sk-your-openai-api-key-here
```

All other values have working defaults. When using Docker, `MONGODB_URI` and `REDIS_URL` are overridden by docker-compose to point at the containerized services.

---

## 2a. Run with Docker (Recommended)

This starts all four services — frontend, backend, MongoDB, and Redis — in containers with health checks and persistent volumes. The backend container builds the React frontend in a multi-stage build and serves both static files and API on port 5000.

```bash
cd docker
docker compose up -d
```

Wait for all services to become healthy:

```bash
docker compose ps
```

Expected output:

```
NAME              STATUS                  PORTS
docker-backend    Up (healthy)            0.0.0.0:5000->5000/tcp
docker-frontend   Up (healthy)            0.0.0.0:3002->80/tcp
docker-mongo      Up (healthy)            0.0.0.0:27017->27017/tcp
docker-redis      Up (healthy)            0.0.0.0:6379->6379/tcp
```

Open the app:

| Service | URL |
|---------|-----|
| App (backend serves frontend + API) | http://localhost:5000 |
| Standalone frontend (nginx) | http://localhost:3002 |
| Backend health check | http://localhost:5000/api/health |

> **VS Code / code-server users:** If you're running in a web-based VS Code environment (code-server), access the app through the proxy URL: `https://<your-host>:<vscode-port>/proxy/5000/`. The frontend auto-detects the proxy and routes API calls through `/proxy/5000/api`.

### Docker management commands

```bash
# View logs
docker compose logs -f              # all services
docker compose logs -f backend      # backend only

# Restart a service
docker compose restart backend

# Rebuild after code changes
docker compose up -d --build

# Stop everything
docker compose down

# Stop and remove all data (volumes)
docker compose down -v
```

---

## 2b. Run Locally (Development)

### Start MongoDB and Redis

If you have them installed locally:

```bash
# Terminal 1 — MongoDB
mongod --dbpath /tmp/mongodata

# Terminal 2 — Redis
redis-server
```

Or use Docker for just the databases:

```bash
docker run -d --name studentai-mongo -p 27017:27017 mongo:7
docker run -d --name studentai-redis -p 6379:6379 redis:7-alpine
```

### Start the backend

```bash
cd server

# Create .env in server directory (or it reads from project root via dotenv)
cp ../.env .env

# Install dependencies
npm install --legacy-peer-deps

# Start in development mode (auto-restart on changes)
npm run dev
```

The backend starts at http://localhost:5000. Verify with:

```bash
curl http://localhost:5000/api/health
# {"status":"ok"}
```

### Start the frontend

```bash
cd client

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The frontend starts at http://localhost:3000. It proxies API calls to `http://localhost:5000/api` by default.

### Start the worker (optional)

The PDF worker processes documents from a Redis queue. The main server already handles document ingestion inline on upload, so the worker is optional for development.

```bash
cd worker
node pdfProcessor.js
```

---

## 3. Using the App

### Step 1: Create an account
Open http://localhost:5000 (or http://localhost:3002 for the standalone nginx frontend), click "Create one", fill in name/email/password, and register.

### Step 2: Upload study materials
Go to the **Documents** tab. Drag and drop a PDF, TXT, or MD file (max 10 MB). The file is processed — text extracted, chunked into ~1000 character pieces, embedded via OpenAI, and stored in your personal FAISS index.

### Step 3: Ask questions
Switch to the **Chat** tab. Type a question about your uploaded materials. The system finds the most relevant chunks via similarity search, sends them as context to the LLM, and returns an answer with source citations.

### Step 4: Generate and take quizzes
Go to the **Quizzes** tab:
- **Generate Quiz**: Select difficulty (Easy/Medium/Hard/Mixed), choose number of questions (5-20), optionally filter specific documents, and click generate
- **Take Quiz**: Answer multiple choice, short answer, and true/false questions. Progress is auto-saved to localStorage every 30 seconds
- **Submit & Review**: Get instant grading with detailed feedback and explanations. Multi-tier grading ensures accuracy (exact match → fuzzy match → LLM evaluation)
- **View History**: Browse past quizzes, filter by difficulty, and review your performance

### Step 5: Generate emails
Go to the **Email** tab. Describe the email you need, pick a tone (professional, formal, or friendly), and click generate. The system pulls relevant context from your documents to make the email more specific.

### Step 6: Send emails via Gmail (optional)
To send generated emails directly from the app:

1. **Set up Google OAuth credentials** (one-time):
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a project (or use an existing one)
   - Enable the **Gmail API**
   - Go to **Credentials** → Create **OAuth 2.0 Client ID** (Web application)
   - Add `http://localhost:5000/api/gmail/callback` as an **Authorized redirect URI**
   - Copy the Client ID and Client Secret

2. **Add to `.env`**:
   ```env
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   GOOGLE_REDIRECT_URI=http://localhost:5000/api/gmail/callback
   TOKEN_ENCRYPTION_KEY=<generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
   ```

3. **Connect in the app**: On the Email tab, click **"Connect Gmail"**, authorize with Google, and you'll be redirected back. You can now click **"Send via Gmail"** on any generated email, fill in the recipient, and send.

---

## 4. Troubleshooting

### Backend won't start — "MongoDB connection error"
- Make sure MongoDB is running on port 27017
- Check `MONGODB_URI` in `.env`
- If using Docker, run `docker compose ps` to check mongo health

### "Redis not available, caching disabled" warning
- This is safe to ignore — the server works without Redis (caching and sessions degrade gracefully)
- To fix: make sure Redis is running on port 6379

### OpenAI errors on chat/email
- Verify `OPENAI_API_KEY` is set correctly in `.env`
- Check you have API credits at https://platform.openai.com/usage
- The default model is `gpt-3.5-turbo` — change `LLM_MODEL` in `.env` if needed

### Docker build fails for backend
- `faiss-node` and `bcrypt` need native compilation — the Dockerfile installs `python3`, `make`, `g++` for this
- If you hit memory issues, increase Docker's memory limit to 4 GB+

### Frontend shows blank page
- Check browser console for errors — the app has an ErrorBoundary that displays runtime errors on screen
- Ensure the backend is running and healthy (`curl http://localhost:5000/api/health`)
- **If using Docker**, prefer accessing port 5000 (backend serves the frontend) over port 3002
- **If using VS Code / code-server**, access via `/proxy/5000/` — the frontend auto-detects proxy environments for API routing
- If running locally, confirm `REACT_APP_API_URL` points to `http://localhost:5000/api`
- Try a hard refresh (`Ctrl+Shift+R`) to clear cached assets after rebuilds

### Rate limit errors (429)
- API: 100 requests per 15 minutes
- Auth: 20 requests per 15 minutes
- Wait 15 minutes or restart Redis to clear limits

---

## 5. Project Ports

| Service | Port | Purpose |
|---------|------|---------|
| Backend | 5000 | Express API + serves frontend static files (primary access point) |
| Frontend (nginx) | 3002 | Standalone React app via nginx (optional, separate container) |
| MongoDB | 27017 | Database |
| Redis | 6379 | Cache, sessions, rate limits |
