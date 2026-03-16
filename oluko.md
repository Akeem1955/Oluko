# Olùkọ́

> **Olùkọ́** (Yoruba for *"Teacher"*) — A voice-first AI learning platform that transforms any learning material into a live, interactive voice tutoring session with real-time whiteboard visualizations.

---

## Inspiration

The inspiration for **Olùkọ́** was born out of my own deep frustration with modern e-learning. Today's digital learning landscape often feels incredibly isolating. Staring at endless walls of AI-generated text is uninspiring, and slogging through dry PDFs literally puts me to sleep. Even worse are the long, pre-recorded video lectures—if you get stuck, you can't raise your hand to ask a question. You leave a comment hoping for clarity, only to be ignored and left feeling completely on your own.

When I discovered the Amazon Nova Hackathon, a lightbulb went off: *What if we could make learning genuinely fun again?* I envisioned a platform that is deeply personalized, highly engaging, and, most importantly, creates a safe space where students can ask anything without the fear of being judged. That core desire to bring the human touch back to digital education is exactly what brought Olùkọ́ into existence.

---

## What It Does

Olùkọ́ solves a fundamental problem in self-directed learning: the absence of a patient, adaptive teacher. Traditional tools give you content — Olùkọ́ gives you a **live AI tutor** that speaks, listens, draws, and quizzes.

| Capability | Description |
|---|---|
| **Curriculum Generation** | Upload a PDF, a video (≤25 MB), or type any topic → AI generates a structured multi-lesson course in seconds |
| **Voice AI Tutoring** | Live speech-to-speech conversation with an AI instructor that explains, adapts, and responds to questions in real time |
| **Interactive Whiteboard** | Real-time AI-generated diagrams, interactive React visualizations, and images projected during lessons |
| **Concentration Mode** | Voice-driven quizzes generated from study material to lock in understanding |
| **Lesson Resume** | AI-evaluated session transcripts allow mid-lesson pickup on return |
| **Study Analytics** | AI-scored mastery, clarity, retention, and quiz accuracy after each session |

---

## How We Built It

Olùkọ́ is built as a **three-tier architecture** — a React frontend, a Java Spring Boot backend, and a Python voice agent — all orchestrated through **LiveKit Cloud** for real-time WebRTC communication and **AWS Bedrock** for AI model inference.

### Architecture Overview

**Frontend (React 18 SPA)** → communicates via REST API → **Java Backend (Spring Boot 3.5)** → stores data in → **PostgreSQL 17 + Redis**

**Frontend** ↔ connects via WebRTC ↔ **LiveKit Cloud** ↔ connects via WebRTC ↔ **Python Voice Agent**

**Python Voice Agent** → calls tool endpoints on → **Java Backend** → invokes models on → **AWS Bedrock**

---

### Tier 1 — Frontend (React 18 + Vite + TypeScript)

The frontend is a single-page application built with **React 18**, **TypeScript**, and **Vite 5**, styled with **Tailwind CSS 4** and animated with **Framer Motion**.

**Key Libraries:**

| Library | Purpose |
|---|---|
| `react-router-dom v6` | Client-side routing with public/protected/guest-only guards |
| `@tanstack/react-query` | Server state management, polling, and cache |
| `zustand` | Client state stores (auth, toast, whiteboard) |
| `@livekit/components-react` | WebRTC room connection, audio rendering, data channels |
| `react-live` | Sandboxed execution of AI-generated React JSX on the whiteboard |
| `framer-motion` | Page transitions and landing animations |
| `axios` | HTTP client for REST API calls |

**Key Components:**

| Component | Responsibility |
|---|---|
| **LessonRoom** | Fetches LiveKit token → mounts `LiveKitRoom` → renders whiteboard + agent visualizer side-by-side |
| **InteractiveWhiteboard** | Listens on LiveKit data channel → routes incoming payloads to the canvas renderer, image display, or quiz UI |
| **CanvasRenderer** | Sanitizes AI-generated JSX (strips imports/exports, normalizes quotes) → renders it live via `react-live` sandbox |
| **AgentVisualizer** | Animated visual indicator showing AI speaking/listening state |

---

### Tier 2 — Java Backend (Spring Boot 3.5)

The backend is a **Spring Boot 3.5** application running on **Java 17**, serving as the central orchestrator for authentication, course generation, AI model invocation, and data persistence.

**REST API Surface — `/api/v1/*`:**

| Controller | Key Endpoints | Purpose |
|---|---|---|
| **OnboardingController** | `POST /signup` → `POST /verify-signup` → `POST /login` → `POST /verify-login` → `GET /me` | User registration, OTP-based 2FA authentication, profile management |
| **CourseGenerationController** | `POST /courses/generate` → `GET /courses/{id}/status` → `GET /courses/{id}/lessons` | Async course creation from PDF/video/topic, status polling, lesson retrieval |
| **LiveKitController** | `GET /livekit/token?lessonId=XYZ` | Generates signed LiveKit access tokens for lesson rooms |
| **InternalLessonController** | `GET /internal/lessons/{id}/prompt` → `POST /internal/lessons/{id}/session-transcript` | Serves system prompts to the Python agent; persists session transcripts |
| **InternalToolController** | `POST /internal/tools/generate-canvas` → `POST /internal/tools/generate-image` | AI-powered whiteboard code and image generation (called by the Python agent) |
| **MediaController** | `GET /media/image/{id}` | Serves Redis-cached generated images to the frontend |
| **StudyAnalyticsController** | `GET /analytics/overview` → `GET /analytics/lesson/{id}` | Returns AI-scored performance metrics and recommendations |

**Service Layer:**

| Service | What It Does |
|---|---|
| **OnboardingService** | Signup/login with OTP emails via Redis cache → bcrypt password hashing → JWT token generation |
| **CourseGenerationService** | Initializes course entities, enforces 10-course-per-user limit, delegates to async worker |
| **CourseGenerationAsyncWorker** | `@Async` background processing: digests uploaded material → generates syllabus via Nova Lite → persists lessons |
| **NovaSyllabusGenerator** | Calls Amazon Nova Lite to produce structured JSON syllabi from PDF text, video content, or topic descriptions |
| **DocumentExtractionService** | Apache Tika + PDFBox — extracts text from uploaded PDFs and video transcripts |
| **NovaToolService** | Generates interactive React JSX (Nova Premier) and educational images (Titan Image Generator v2), caches results in Redis |
| **LessonResumeService** | Uses Nova Pro to evaluate session transcripts → determines completion %, generates resume summary |
| **StudyAnalyticsService** | Uses Nova Pro to score sessions: mastery, clarity, retention, quiz accuracy → generates strengths/weaknesses/recommendations |
| **CourseProgressService** | Sequential lesson unlocking — marks lessons complete and unlocks the next one |

**Security:**

- **JWT Authentication** — HMAC-SHA tokens with 48-hour expiry (`jjwt 0.13`)
- **Per-request JWT Filter** — validates tokens on every protected endpoint
- **OTP 2FA** — 6-digit codes cached in Redis with 5-minute TTL, delivered via Gmail SMTP
- **Resilience4j** — circuit breaker + retry patterns on all AWS Bedrock API calls

---

### Tier 3 — Python Voice Agent (LiveKit Agents SDK)

The voice agent is a **Python 3.13** process using the **LiveKit Agents SDK**. It joins LiveKit rooms and conducts live voice lessons powered by **Amazon Nova Sonic**.

**Agent Lifecycle:**

1. **Room Join** — LiveKit Cloud dispatches the agent into a room whose name is the lesson UUID
2. **Context Fetch** — Agent calls `GET /internal/lessons/{id}/prompt` on the Java backend to retrieve the system prompt (lesson title, objective, source material, resume context)
3. **Session Start** — Agent starts a `RealtimeModel` session with Amazon Nova Sonic (STT → LLM → TTS in one bidirectional audio stream)
4. **Greeting** — Agent greets the student and immediately opens a whiteboard visualization
5. **Teaching Loop** — Nova Sonic processes student speech in real time and responds conversationally, invoking tools as needed:

**Tool Functions (called mid-conversation by Nova Sonic):**

| Tool | What Happens |
|---|---|
| `draw_canvas_code(prompt, interactivity)` | Agent → Java Backend (`POST /generate-canvas`) → **Nova Premier** generates interactive React JSX → result pushed to frontend via LiveKit Data Channel → **react-live** renders it on the whiteboard |
| `insert_image(description)` | Agent → Java Backend (`POST /generate-image`) → **Titan Image Generator v2** creates a 1024×1024 image → cached in Redis (2h TTL) → URL pushed to frontend via Data Channel |
| `show_quiz_question(question, A, B, C, D)` | Agent pushes quiz JSON directly to the frontend via Data Channel → quiz UI renders on the whiteboard |
| `end_session(final_message)` | End signal sent via Data Channel → transcript POSTed to backend → Nova Pro evaluates completion → lesson marked complete → next lesson unlocked |

6. **Transcript Capture** — All user and assistant speech is logged and persisted to the backend on session end

---

### AI Model Integration

All AI models are accessed through **AWS Bedrock (us-east-1)**:

| Model | Where It's Used | What It Does |
|---|---|---|
| **Amazon Nova Sonic** | Python Agent (RealtimeModel) | Real-time speech-to-speech tutoring — listens, thinks, responds with sub-second latency |
| **Amazon Nova Lite** | NovaSyllabusGenerator (Java) | Digests PDFs/videos/topics → produces structured JSON syllabi; generates topic reference material |
| **Amazon Nova Premier** | NovaToolService (Java) | Generates interactive, sandboxed React JSX code for the whiteboard |
| **Amazon Nova Pro** | LessonResumeService + StudyAnalyticsService (Java) | Evaluates transcripts for completion %, mastery, clarity, retention, strengths/weaknesses |
| **Amazon Titan Image Generator v2** | NovaToolService (Java) | Generates 1024×1024 educational images, cached in Redis with 2-hour TTL |

---

### Data Model

**Entities and Relationships:**

| Entity | Key Fields | Relationship |
|---|---|---|
| **Users** | `id`, `email` (unique), `password`, `full_name`, `profile_picture`, `available_token` | Has one `UserLearningStats`, has many `Course` |
| **UserLearningStats** | `current_streak`, `total_minutes_spent`, `lessons_completed`, `global_rank`, `weekly_goal_hours` | Belongs to one `Users` |
| **Course** | `id` (UUID), `user_id`, `title`, `learning_mode`, `target_language`, `status`, `source_material` | Has many `Lesson`, has one `CourseProgress` |
| **Lesson** | `id` (UUID), `course_id`, `order_index`, `title`, `objective` | Belongs to `Course`, has one `LessonResumeState`, has many `StudyAnalytics` |
| **CourseProgress** | `user_id`, `course_id`, `highest_completed_order` | Tracks which lessons are unlocked |
| **LessonResumeState** | `lesson_id`, `completion_percent`, `is_completed`, `resume_summary`, `last_transcript` | AI-generated resume context for mid-lesson pickup |
| **StudyAnalytics** | `lesson_id`, `user_id`, `analytics_type`, `mastery_score`, `clarity_score`, `retention_score`, `quiz_accuracy`, `strengths`, `weak_areas`, `recommendation` | AI-scored performance record per session |

**Key Enums:** `LearningMode` → TOPIC, DOCUMENT, VIDEO | `CourseStatus` → PENDING, GENERATING, READY, FAILED | `AnalyticsType` → LESSON, QUIZ

---

### Core Data Flows

#### Flow 1 — Course Generation

> Student uploads material → Olùkọ́ builds a full structured course asynchronously.

**Phase 1 — Instant Response (synchronous):**

1. Student uploads a PDF/video or types a topic on the frontend
2. Frontend sends `POST /api/v1/courses/generate` with the file, learning mode, and target language
3. **CourseGenerationService** validates the request (max 10 courses per user), creates a `Course` entity with `status = PENDING`, and saves it to PostgreSQL
4. Backend returns `202 Accepted` with the `courseId` immediately
5. Service fires off the **CourseGenerationAsyncWorker** on a separate `@Async` thread

**Phase 2 — Background Processing (asynchronous):**

6. Worker updates `status → GENERATING`
7. **Content Digestion** (depends on learning mode):
   - **DOCUMENT** → `DocumentExtractionService` uses Apache Tika to extract full text from the PDF
   - **VIDEO** → `NovaSyllabusGenerator` sends video bytes to **Nova Lite** for content analysis
   - **TOPIC** → `NovaSyllabusGenerator` sends the topic to **Nova Lite** to generate reference material
8. **Syllabus Generation** → `NovaSyllabusGenerator` sends the extracted context to **Nova Lite** → returns a structured JSON syllabus: `[{ "title": "...", "objective": "..." }, ...]`
9. Worker parses the JSON, creates `Lesson` entities ordered by index, saves them to PostgreSQL
10. Worker updates `status → READY`

**Phase 3 — Frontend Polling:**

11. Meanwhile, the frontend polls `GET /courses/{id}/status` every 2 seconds
12. When status becomes `READY`, frontend fetches `GET /courses/{id}/lessons` and displays the syllabus

---

#### Flow 2 — Live Lesson (Voice + Whiteboard)

> Student enters a lesson → WebRTC voice session begins → AI teaches with speech and whiteboard in real time.

**Stage 1 — Session Setup:**

1. Student clicks a lesson on the frontend
2. Frontend requests `GET /api/v1/livekit/token?lessonId=XYZ`
3. **LiveKitController** verifies JWT, checks course ownership, confirms the lesson is unlocked, checks for resume state, and generates a signed LiveKit access token (room name = lesson UUID)
4. Frontend receives `{ token, roomName, livekitUrl, hasResume, resumeCompletionPercent }` and connects to the LiveKit room via WebRTC (audio enabled + data channel open)

**Stage 2 — Agent Initialization:**

5. LiveKit Cloud dispatches the **Python Voice Agent** into the same room
6. Agent reads `room.name` → `lesson_id = "XYZ"`
7. Agent calls `GET /internal/lessons/XYZ/prompt` on the Java backend
8. Backend builds and returns the system prompt: target language, lesson title + objective, source material, resume context (if returning student), whiteboard instructions
9. Agent constructs an `AgentSession` with the system prompt, tool functions, and a **Nova Sonic RealtimeModel**
10. Agent generates an initial greeting and calls the whiteboard tool to show an opening visualization

**Stage 3 — Live Teaching Loop:**

11. 🎤 Student speaks → WebRTC audio → **Nova Sonic** listens
12. 🧠 Nova Sonic processes (STT → LLM reasoning → TTS) in one stream
13. 🔊 AI responds → WebRTC audio → student hears
14. During conversation, Nova Sonic can invoke tools:
    - **Canvas visualization:** Agent → `POST /internal/tools/generate-canvas` → **Nova Premier** generates interactive React JSX → result sent via Data Channel → **react-live** renders it live on the whiteboard
    - **Image generation:** Agent → `POST /internal/tools/generate-image` → **Titan Image Generator v2** → image cached in Redis → URL sent via Data Channel → image displayed on whiteboard
    - **Quiz question:** Agent sends quiz JSON directly via Data Channel → quiz UI renders on whiteboard
15. All speech (student and AI) is captured as transcript lines

**Stage 4 — Session End:**

16. Agent calls `end_session(final_message)` → end signal sent to frontend via Data Channel → frontend navigates back to the syllabus
17. Agent POSTs the full transcript to `POST /internal/lessons/XYZ/session-transcript`
18. **LessonResumeService** sends the transcript to **Nova Pro** → determines completion %, generates a resume summary, saves `LessonResumeState`
19. **StudyAnalyticsService** sends the transcript to **Nova Pro** → scores mastery (0–100), clarity (0–100), retention (0–100), quiz accuracy (0–100), identifies strengths/weaknesses, generates a recommendation
20. **CourseProgressService** marks the lesson as completed and unlocks the next lesson in sequence

---

#### Flow 3 — Authentication (JWT + OTP)

**Signup:**
Student sends `POST /signup { email, password, fullName }` → backend checks email is available → generates a 6-digit OTP → caches the user object in Redis (keyed by OTP, 5-minute TTL) → sends OTP via email → student submits `POST /verify-signup?otp=123456&email=...` → backend retrieves cached user from Redis → hashes password with bcrypt → saves user to PostgreSQL → generates and returns a JWT token

**Login:**
Student sends `POST /login { email, password }` → backend verifies password hash against PostgreSQL → generates a 6-digit OTP → caches in Redis (5-minute TTL) → sends OTP via email → student submits `POST /verify-login?otp=789012&email=...` → backend retrieves cached data from Redis → re-verifies password → generates and returns a JWT token

---

### Infrastructure

| Service | Technology | Purpose |
|---|---|---|
| **Database** | PostgreSQL 17 (Docker, port 5433) | Persistent storage for users, courses, lessons, analytics |
| **Cache** | Redis (Docker, port 6380) | OTP storage (5-min TTL), generated image cache (2-hour TTL), session state |
| **Real-time** | LiveKit Cloud (WebRTC SFU) | Signaling, room management, bidirectional audio + data channels |
| **AI Models** | AWS Bedrock (us-east-1) | Nova Sonic, Nova Lite, Nova Premier, Nova Pro, Titan Image Generator v2 |
| **Email** | Spring Mail (Gmail SMTP) | OTP delivery for authentication |
| **Resilience** | Resilience4j | Circuit breaker + retry patterns on all external API calls |

---

### Key Design Decisions

| Decision | Rationale |
|---|---|
| **Async course generation** (`@Async`) | PDF/video ingestion + AI syllabus generation takes 10–30s; immediate HTTP response with polling prevents timeouts |
| **Room name = Lesson UUID** | Zero-coordination room routing — the Python agent reads `ctx.room.name` as the lesson ID directly |
| **react-live for whiteboard** | Sandboxed in-browser JSX execution; no server rendering needed; AI-generated code runs instantly in the client |
| **Redis for image cache** | Generated images are base64-encoded (~1–2 MB); Redis provides fast retrieval with automatic 2-hour TTL expiry |
| **OTP stored in Redis** | Ephemeral data with automatic 5-minute expiry; no database cleanup required |
| **Transcript-based resume** | AI (Nova Pro) evaluates session transcripts for completion %, enabling intelligent mid-lesson resume without manual checkpoints |
| **Async tool calls in agent** | `draw_canvas_code` runs as a background task (`asyncio.create_task`) so the agent continues speaking while generation happens |
| **Resilience4j on all Bedrock calls** | Circuit breaker + retry prevents cascading failures from transient AWS API issues |
| **Internal endpoints (no auth)** | `/api/v1/internal/*` endpoints are called by the Python agent within the trusted network — no JWT required |

---

## Challenges We Ran Into

Building this wasn't without its hurdles, especially since we joined the hackathon just **15 days before the deadline**. Operating under that intense time crunch was stressful enough, but we also faced significant friction with the Amazon Nova sandbox environment. Frequent timeouts severely slowed down our ability to test and iterate rapidly.

Beyond infrastructure, our biggest technical hurdle was mastering **prompt engineering**. Making a Large Language Model behave deterministically within a dynamic, real-time application is an art. We quickly learned the golden rule of AI: *garbage instructions yield garbage outputs*. I was forced to learn advanced prompt structuring on the fly to tame the LLM and get the precise JSON outputs our app needed. It was a deeply humbling, yet completely fascinating, trial by fire.

---

## Accomplishments That We're Proud Of

- **Built a fully functional, voice-first AI tutor in 15 days** — from zero to a working product with course generation, live voice interaction, an interactive whiteboard, and study analytics
- **Real-time whiteboard that executes AI-generated code** — the CanvasRenderer sanitizes and renders React JSX from Nova Premier live in the browser using react-live, creating truly interactive educational visualizations
- **Seamless speech-to-speech tutoring** — Amazon Nova Sonic delivers sub-second latency conversational AI that genuinely feels like talking to a human tutor
- **Intelligent lesson resume** — Nova Pro evaluates session transcripts to determine exactly where a student left off, enabling seamless continuation without manual checkpoints
- **End-to-end AI pipeline** — five different Amazon Nova models working in harmony: Sonic for voice, Lite for syllabus generation, Premier for code visualization, Pro for evaluation, and Titan for image generation
- **Async architecture that scales** — course generation runs on background threads with frontend polling, keeping the API responsive even during heavy AI processing

---

## What We Learned

This project fundamentally changed my perspective on the intersection of technology and education. I learned that **the absolute future of learning belongs to multimodal AI agents**. They have the unprecedented power to see, hear, and adapt to human beings in real-time.

Equally important, I realized that **prompt engineering is no longer just a buzzword—it is a mandatory survival skill**. In this new era of multimodal AI, you cannot just code the logic; you have to know how to effectively communicate with, and constrain, the intelligence powering your application.

---

## What's Next for Olùkọ́

- **Multi-language voice support** — expand beyond English to support real-time tutoring in Yoruba, French, Spanish, and more
- **Collaborative learning rooms** — allow multiple students to join the same lesson and learn together with the AI tutor
- **Mobile app** — native iOS/Android experience with push notifications for learning streaks and reminders
- **Custom knowledge bases** — allow educators to upload entire course libraries and generate institution-wide AI tutors
- **Advanced analytics dashboard** — longitudinal learning curves, spaced repetition recommendations, and adaptive lesson difficulty
- **Plugin marketplace** — let third-party developers build custom whiteboard tools, quiz formats, and visualization templates
