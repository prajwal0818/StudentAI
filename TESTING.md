# Testing Guide — StudentAI

This guide explains how to test all features of the StudentAI application using the provided sample data files.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Starting the Application](#2-starting-the-application)
3. [Sample Data Files](#3-sample-data-files)
4. [Testing Document Upload](#4-testing-document-upload)
5. [Testing RAG Question & Answer](#5-testing-rag-question--answer)
6. [Testing Email Generation](#6-testing-email-generation)
7. [Testing Quiz Generation & Grading](#7-testing-quiz-generation--grading)
8. [Testing Cache Behavior](#8-testing-cache-behavior)
9. [Testing Document Deletion](#9-testing-document-deletion)
10. [Feature Test Matrix](#10-feature-test-matrix)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Prerequisites

Before testing, ensure the following are set up:

- **Node.js** (v18 or later) and **npm** installed
- **Docker** and **Docker Compose** installed (for containerized setup)
- **MongoDB** running (local or Atlas)
- **Redis** running (local or cloud)
- A valid **OpenAI API key** (or other LLM provider key)
- Environment variables configured (copy `.env.example` to `.env` and fill in values)

```bash
cp .env.example .env
# Edit .env with your API keys and database connection strings
```

---

## 2. Starting the Application

### Option A: Docker Compose (Recommended)

```bash
cd docker
docker-compose up --build
```

This starts:
- Backend + Frontend on **port 5000** (primary access point)
- MongoDB on **port 27017**
- Redis on **port 6379**


Open **http://localhost:5000** in your browser.

### Option B: Manual Setup

**Terminal 1 — Backend:**
```bash
cd server
npm install
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd client
npm install
npm start
```

The backend runs on **port 5000** and the frontend dev server on **port 3000**.

---

## 3. Sample Data Files

The `samples/` directory contains four test documents covering different formats, topics, and lengths:

| File | Format | Topic | Approx. Words | Best For Testing |
|------|--------|-------|---------------|------------------|
| `machine_learning_notes.md` | Markdown | ML/AI concepts | ~4,000 | Technical Q&A, sectioned content |
| `world_history_lecture.txt` | Plain text | World history | ~3,500 | Multi-topic retrieval, cross-section Q&A |
| `project_guidelines.md` | Markdown | Software project mgmt | ~2,500 | Email generation, professional context |
| `data_structures_reference.txt` | Plain text | CS data structures | ~5,000 | Dense technical chunking, comparison Q&A |

---

## 4. Testing Document Upload

### Steps

1. Log in or register an account
2. Navigate to the upload section
3. Upload each sample file one at a time
4. Verify the upload succeeds and the document appears in your document list

### What to Verify

- [ ] File is accepted (no format or size errors)
- [ ] Upload progress indicator works
- [ ] Document appears in the document list after upload
- [ ] Document metadata is displayed (name, size, upload date)
- [ ] Uploading a duplicate file is handled gracefully (error or overwrite)

### Edge Cases

- Try uploading a very small file (a few words)
- Try uploading without being logged in (should be rejected)
- Try uploading an unsupported file type (e.g., `.exe`) — should be rejected

---

## 5. Testing RAG Question & Answer

Upload the sample files first, then test Q&A with the questions below. Answers should be grounded in the uploaded document content.

### Machine Learning Notes — Sample Questions

| # | Question | Expected Behavior |
|---|----------|-------------------|
| 1 | "What is gradient descent?" | Should explain gradient descent, mention variants (batch, SGD, mini-batch), learning rate |
| 2 | "Compare supervised and unsupervised learning" | Should describe both paradigms with examples, mention classification/regression vs clustering/dimensionality reduction |
| 3 | "What is overfitting and how do you prevent it?" | Should define overfitting, mention regularization, cross-validation, early stopping, dropout |
| 4 | "Explain the bias-variance tradeoff" | Should explain bias, variance, total error decomposition, and the tradeoff |
| 5 | "What are the evaluation metrics for classification?" | Should list accuracy, precision, recall, F1, ROC/AUC, confusion matrix |

### World History Lecture — Sample Questions

| # | Question | Expected Behavior |
|---|----------|-------------------|
| 1 | "What caused World War I?" | Should mention alliance system, militarism, nationalism, imperialism, assassination of Franz Ferdinand |
| 2 | "What was the Renaissance?" | Should describe the cultural rebirth, mention Florence, key figures (da Vinci, Michelangelo), humanism |
| 3 | "What were the social effects of the Industrial Revolution?" | Should discuss urbanization, factory conditions, labor movements, Marx |
| 4 | "Who were the major Enlightenment thinkers?" | Should list Locke, Voltaire, Rousseau, Montesquieu, Kant, Diderot |
| 5 | "How did World War II end?" | Should mention D-Day, Eastern Front advance, atomic bombs on Hiroshima/Nagasaki, V-E Day |

### Data Structures Reference — Sample Questions

| # | Question | Expected Behavior |
|---|----------|-------------------|
| 1 | "What is the time complexity of hash table operations?" | Should state O(1) average, O(n) worst case for insert/search/delete |
| 2 | "When should I use a linked list instead of an array?" | Should compare trade-offs: dynamic size, insertion/deletion efficiency vs random access |
| 3 | "Explain how a binary search tree works" | Should describe the ordering property, search/insert/delete operations, O(log n) average |
| 4 | "What is the difference between BFS and DFS?" | Should explain level-by-level vs depth-first exploration, queue vs stack, use cases |
| 5 | "What are the types of self-balancing BSTs?" | Should mention AVL trees, Red-Black trees, and B-trees with key differences |

### Cross-Document Questions (if multiple documents uploaded)

| # | Question | Expected Behavior |
|---|----------|-------------------|
| 1 | "How are trees used in machine learning?" | May pull from both ML notes (decision trees) and DS reference (tree structures) |
| 2 | "What role did technology play in World War I?" | Should pull from history lecture (machine guns, tanks, aircraft, gas) |

### What to Verify

- [ ] Answers are relevant to the uploaded document content
- [ ] Answers cite or reference specific information from the documents
- [ ] Response time is reasonable (under 10 seconds for most questions)
- [ ] Questions about content NOT in any document are handled gracefully (the AI admits it doesn't have that information or gives a general answer with a caveat)
- [ ] Asking the same question twice returns consistent answers

---

## 6. Testing Email Generation

Upload `project_guidelines.md` first, as it provides the best context for professional email scenarios.

### Sample Email Prompts

#### Prompt 1 — Deadline Extension Request
> **Prompt:** "Write an email to the project manager requesting a one-week extension for the Phase 2 milestone"
>
> **Tones to test:**
> - **Formal:** Should use professional language, reference project timeline specifics
> - **Friendly:** Should be warm but professional, less rigid structure
> - **Professional:** Should be direct and business-appropriate

**Verify:** The email should reference real details from the project guidelines (Phase 2, Sarah Mitchell, sync engine work, April–June timeline).

#### Prompt 2 — Bug Report Escalation
> **Prompt:** "Write an email escalating a critical P0 bug that is blocking the release"
>
> **Tones to test:**
> - **Formal:** Should follow escalation process from the document
> - **Professional:** Should be urgent but structured

**Verify:** Should reference the P0 priority level, escalation process, or relevant team members from the guidelines.

#### Prompt 3 — Team Update
> **Prompt:** "Draft a weekly status update email for the frontend squad"
>
> **Tones to test:**
> - **Friendly:** Should be casual team communication
> - **Professional:** Should be structured with clear sections

**Verify:** Should reference frontend squad context, sprint structure, or standup process.

#### Prompt 4 — Meeting Request
> **Prompt:** "Write an email inviting the security team to review the authentication module before the code freeze"
>
> **Tone:** Formal
>
> **Verify:** Should reference the Security and Compliance Squad, code review requirements, or James Okafor.

#### Prompt 5 — Without Document Context (General)
> **Prompt:** "Write a thank-you email to a professor for writing a recommendation letter"
>
> **Tone:** Friendly
>
> **Verify:** Should generate a reasonable email even without specific document context.

### What to Verify

- [ ] Generated emails have proper structure (greeting, body, closing)
- [ ] Tone matches the selected option (formal, friendly, professional)
- [ ] Document context is incorporated when relevant
- [ ] Email is coherent and grammatically correct
- [ ] Different tones for the same prompt produce noticeably different outputs
- [ ] Email generation works even without uploaded documents

---

## 7. Testing Quiz Generation & Grading

Upload sample files first (recommend `machine_learning_notes.md` or `data_structures_reference.txt` for technical quizzes).

### Quiz Generation Tests

#### Test 1 — Basic Quiz Generation
1. Go to **Quizzes** tab → "Generate New Quiz"
2. Select difficulty: **Medium**
3. Set question count: **10**
4. Leave documents unselected (uses all documents)
5. Click "Generate Quiz"

**Verify:**
- [ ] Quiz generates successfully within 30 seconds
- [ ] Mix of MCQ, short answer, and true/false questions
- [ ] Questions are relevant to uploaded document content
- [ ] Correct answers are NOT visible before submission

#### Test 2 — Difficulty Levels
Generate 3 quizzes with the same documents but different difficulties:
- **Easy:** Questions should test recall and definitions
- **Medium:** Questions should test understanding and application
- **Hard:** Questions should test analysis and synthesis

**Verify:**
- [ ] Easy questions are noticeably simpler than hard questions
- [ ] Questions appropriately match difficulty level

#### Test 3 — Question Count Range
- Generate quiz with **5 questions** (minimum)
- Generate quiz with **20 questions** (maximum)
- Try generating with invalid count (e.g., 25 or 3) — should be rejected

**Verify:**
- [ ] Minimum and maximum counts work
- [ ] Invalid counts show error message

#### Test 4 — Document Selection
1. Upload multiple sample files
2. Generate quiz with only one document selected
3. Questions should only come from that document's content

**Verify:**
- [ ] Questions are constrained to selected document(s)
- [ ] Selecting no documents uses all uploaded documents

### Quiz Taking Tests

#### Test 5 — Answer Recording
1. Generate a quiz
2. Answer some questions (mix of correct and incorrect)
3. Navigate between questions using Previous/Next
4. Refresh the page (auto-save should restore answers)

**Verify:**
- [ ] Answers are saved when navigating between questions
- [ ] Auto-save to localStorage works (answers persist after refresh)
- [ ] Current question index is preserved

#### Test 6 — Question Types
Test each question type:
- **MCQ:** Select an option, verify it's highlighted
- **True/False:** Click True or False button
- **Short Answer:** Type a free-text response

**Verify:**
- [ ] Each question type renders correctly
- [ ] User can change their answer before submitting
- [ ] Progress bar updates correctly

### Grading Tests

#### Test 7 — MCQ Grading
1. Generate a quiz
2. For MCQ questions, select:
   - Some correct answers
   - Some incorrect answers
3. Submit the quiz

**Verify:**
- [ ] Correct answers marked as correct (green)
- [ ] Incorrect answers marked as incorrect (red)
- [ ] Explanation shown for each question

#### Test 8 — Short Answer Grading (Multi-tier)
For short answer questions, test these scenarios:

| Answer Type | Test Case | Expected Result |
|-------------|-----------|-----------------|
| **Exact match** | Type the exact correct answer | Marked correct immediately |
| **Fuzzy match** | Type answer with minor typos or different wording | Marked correct (80%+ similarity) |
| **Semantically correct** | Paraphrase the answer correctly | LLM evaluates as correct |
| **Incorrect** | Give wrong answer | Marked incorrect with explanation |

**Verify:**
- [ ] Exact matches are recognized
- [ ] Fuzzy matching works for slight variations
- [ ] LLM evaluation provides feedback for partial answers
- [ ] Multi-tier system minimizes unnecessary LLM calls

#### Test 9 — True/False Grading
Test various input formats:
- Type "true", "True", "t", "yes", "1"
- Type "false", "False", "f", "no", "0"

**Verify:**
- [ ] All true variants are recognized
- [ ] All false variants are recognized
- [ ] Invalid inputs handled gracefully

#### Test 10 — Scoring
1. Generate a 10-question quiz
2. Answer exactly 7 correctly, 3 incorrectly
3. Submit

**Verify:**
- [ ] Score is calculated as 70%
- [ ] Pass/Fail status shown (60% threshold)
- [ ] Points earned vs total points displayed correctly

### Quiz History Tests

#### Test 11 — History Display
1. Generate and submit multiple quizzes
2. Go to "Quiz History" tab

**Verify:**
- [ ] All submitted quizzes appear in history
- [ ] Non-submitted quizzes (abandoned) do not appear or are marked differently
- [ ] Each card shows: difficulty, question count, score, date

#### Test 12 — Pagination
1. Generate 15+ quizzes
2. Navigate through history pages

**Verify:**
- [ ] Pagination controls appear
- [ ] 10 quizzes per page (default)
- [ ] Page navigation works correctly

#### Test 13 — Filtering
1. Generate quizzes with different difficulties
2. Use difficulty filter dropdown

**Verify:**
- [ ] Filter by Easy/Medium/Hard works
- [ ] "All Difficulties" shows everything
- [ ] Filtered results update immediately

#### Test 14 — Quiz Review
1. Click "View Results" on a submitted quiz
2. Review the results page

**Verify:**
- [ ] Score displayed prominently
- [ ] Questions expandable/collapsible (accordion)
- [ ] Each question shows: user's answer, correct answer, explanation
- [ ] Color coding (green = correct, red = incorrect)

#### Test 15 — Quiz Deletion
1. Delete a quiz from history
2. Confirm deletion

**Verify:**
- [ ] Confirmation modal appears
- [ ] Quiz removed from history after confirmation
- [ ] Cannot delete other users' quizzes

### Cache Tests for Quizzes

#### Test 16 — Quiz Generation Caching
1. Generate a quiz with specific settings (e.g., 10 questions, medium difficulty)
2. Generate another quiz with the **exact same settings**
3. Second generation should be instant (from cache)

**Verify:**
- [ ] Cached quiz returns in <1 second
- [ ] Different settings generate new quiz (no cache hit)

#### Test 17 — Cache Invalidation
1. Generate a quiz
2. Upload a new document
3. Generate quiz again with same settings

**Verify:**
- [ ] Cache is invalidated after document upload
- [ ] New quiz generated (not served from cache)
- [ ] Questions reflect content from newly uploaded document

### Edge Cases

#### Test 18 — No Documents
1. Without uploading any documents, try to generate a quiz

**Verify:**
- [ ] Error message: "No documents found. Please upload study materials first."
- [ ] User is prompted to upload documents

#### Test 19 — Incomplete Submission
1. Generate a quiz
2. Answer only some questions (leave others blank)
3. Submit

**Verify:**
- [ ] Submission warning shows: "X of Y questions unanswered"
- [ ] Unanswered questions marked as incorrect
- [ ] Score calculated correctly

#### Test 20 — Re-submission Prevention
1. Submit a quiz
2. Try to submit the same quiz again

**Verify:**
- [ ] Error: "Quiz already submitted"
- [ ] Cannot change answers after submission

---

## 8. Testing Cache Behavior

Redis caching should reduce response time for repeated queries.

### Steps

1. Ask a question about an uploaded document and note the response time
2. Ask the **exact same question** again
3. The second response should be noticeably faster (served from cache)

### What to Verify

- [ ] First query takes normal time (LLM processing)
- [ ] Repeated identical query is faster (cache hit)
- [ ] After uploading a new document or deleting one, cache is invalidated appropriately
- [ ] Slightly rephrased questions are NOT cached (they should trigger a new LLM call)

---

## 8. Testing Document Deletion

### Steps

1. Upload a sample document
2. Ask a question about its content — verify a relevant answer
3. Delete the document
4. Ask the same question again

### What to Verify

- [ ] Document disappears from the document list after deletion
- [ ] After deletion, Q&A no longer returns answers from the deleted document's content
- [ ] Deleting a document does not affect other uploaded documents
- [ ] Cached responses for the deleted document are invalidated

---

## 10. Feature Test Matrix

Use this checklist to track comprehensive testing across all features:

| Feature | Test | Status |
|---------|------|--------|
| **Auth** | Register new account | |
| **Auth** | Login with valid credentials | |
| **Auth** | Login with invalid credentials (rejected) | |
| **Auth** | Access protected route without login (redirected) | |
| **Upload** | Upload `.md` file | |
| **Upload** | Upload `.txt` file | |
| **Upload** | Upload `.pdf` file | |
| **Upload** | Reject unsupported file type | |
| **Upload** | Large file handling | |
| **Q&A** | Question with single document context | |
| **Q&A** | Question across multiple documents | |
| **Q&A** | Question with no relevant context | |
| **Q&A** | Technical/dense content retrieval | |
| **Q&A** | Multi-topic document retrieval | |
| **Email** | Generate formal email | |
| **Email** | Generate friendly email | |
| **Email** | Generate professional email | |
| **Email** | Email with document context | |
| **Email** | Email without document context | |
| **Quiz** | Generate quiz with 10 questions | |
| **Quiz** | Generate easy/medium/hard quizzes | |
| **Quiz** | Take quiz and submit answers | |
| **Quiz** | MCQ grading works correctly | |
| **Quiz** | Short answer multi-tier grading | |
| **Quiz** | True/False answer variants recognized | |
| **Quiz** | Score calculation is accurate | |
| **Quiz** | View quiz history with pagination | |
| **Quiz** | Filter history by difficulty | |
| **Quiz** | Review submitted quiz results | |
| **Quiz** | Delete quiz from history | |
| **Quiz** | Auto-save during quiz taking | |
| **Quiz** | Quiz generation cached (same settings) | |
| **Quiz** | Cache invalidated on document change | |
| **Cache** | Repeated query is faster (cache hit) | |
| **Cache** | Cache invalidation on document change | |
| **Delete** | Delete document removes from list | |
| **Delete** | Deleted document content no longer in Q&A | |
| **UI** | Responsive layout on mobile | |
| **UI** | Loading states display correctly | |
| **UI** | Error messages display correctly | |

---

## 11. Troubleshooting

### Application won't start

- **Docker:** Check that Docker daemon is running: `docker info`
- **Ports in use:** Ensure ports 5000, 27017, and 6379 are free: `lsof -i :5000`
- **Environment variables:** Verify `.env` file exists and contains valid values
- **Dependencies:** Run `npm install` in both `client/` and `server/` directories

### Upload fails

- Check file size limits in the backend configuration (Multer settings)
- Verify MongoDB is running and accessible
- Check server logs for error messages: `docker-compose logs backend`

### Q&A returns irrelevant answers

- Ensure the document was fully processed (check for processing status in the UI)
- The vector database may need time to index embeddings after upload
- Try more specific questions that match the document's terminology
- Check that the vector DB (FAISS/Pinecone) is running and accessible

### Email generation fails

- Verify the LLM API key is valid and has sufficient credits
- Check that the API key environment variable is correctly set
- Look for rate-limiting errors in the server logs

### Redis/cache issues

- Verify Redis is running: `redis-cli ping` (should return `PONG`)
- Check Redis connection string in `.env`
- Clear Redis cache if stale: `redis-cli FLUSHALL` (caution: clears all data)

### Slow responses

- First query after startup may be slow (cold start)
- Check network latency to the LLM provider
- Large documents may take longer to process for embeddings
- Monitor Redis for cache hit/miss ratio

### Docker-specific issues

- Rebuild containers after code changes: `docker-compose up --build`
- View logs: `docker-compose logs -f [service-name]`
- Reset everything: `docker-compose down -v && docker-compose up --build`
- Check container health: `docker-compose ps`
