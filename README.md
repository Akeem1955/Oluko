

## Login Credentials (For Judges)

| Field | Value |
|---|---|
| **Username** | `oluko.admin@gmail.com` |
| **Password** | `Oluko@2026` |
| **Otp** | `12345678` |





# Olùkọ́

**Your AI teacher that speaks, draws, and never runs out of patience.**

---

## The Problem

Every year, millions of self-directed learners hit the same wall: they find a PDF, a YouTube video, or a topic they're curious about — and then they're on their own. No teacher to explain the hard parts. No whiteboard to visualize the concept. No one to quiz them and make sure it stuck.

Private tutoring costs $40–80/hour. Pre-recorded courses can't answer questions. Chatbots give walls of text but never *teach*.

**What if you could hand any material to an AI — and it taught it to you out loud, drawing on a whiteboard in real time, like a private instructor sitting right next to you?**

## The Solution

**Olùkọ́** (Yoruba for *"Teacher"*) is a voice-first AI learning platform powered by **Amazon Nova**. Upload a PDF, paste a video, or type any topic — Olùkọ́ instantly generates a structured curriculum, then teaches each lesson to you through a **live voice conversation** while drawing diagrams, rendering code, and projecting visuals on an interactive whiteboard.

It doesn't just *show* you information. It *speaks* to you, *listens* to your questions, *draws* what it's explaining, and *adapts* in real time.

### Why Amazon Nova Was Our Secret Sauce

| Model | Role |
|---|---|
| **Nova Sonic** | Real-time speech-to-speech — the AI voice that listens, thinks, and speaks with sub-second latency. The soul of every lesson. |
| **Nova Lite** | The "brain" — digests PDFs/videos/topics into structured syllabi, generates interactive React visualizations for the whiteboard, and builds quiz content. |
| **Nova Canvas** | On-demand image generation — the AI draws what it's teaching, projected live onto the student's whiteboard. |

No single model could do this. Nova Sonic gives us the **voice**. Nova Lite gives us the **mind**. Nova Canvas gives us the **eyes**. Together, they create something that feels less like software and more like a teacher.

---

## Demo

> **30-second hook:** Open Olùkọ́ → Type "Quantum Entanglement" → A 5-lesson course appears in seconds → Click Lesson 1 → An AI voice greets you, explains the concept, and draws a live diagram of entangled particles on the whiteboard — all while you ask questions with your microphone.

---

## Features

- **Curriculum Generation** — Upload a PDF (any size), a video (up to 25 MB), or type any topic. Olùkọ́ builds a structured multi-lesson course with objectives and logical progression in seconds.
- **Voice AI Tutor** — Join a live voice session with your AI instructor. It speaks, listens, explains concepts, and dynamically adapts to your pace — like a private tutor in your headphones.
- **Interactive Whiteboard** — While the AI teaches, it draws diagrams, renders interactive code visualizations, and projects AI-generated images on a shared whiteboard — just like a real classroom.
- **Concentration Mode** — Upload study material and let the AI quiz you on it through voice. A focused self-study mode designed to lock in understanding.
- **Per-lesson isolation** — Every lesson gets its own real-time voice room. Your sessions are private, persistent, and never cross with other users.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                 │
│  React 18 · TypeScript · Vite · Tailwind CSS 4 · Framer Motion │
│  LiveKit Components React · react-live (sandboxed JSX)          │
│                                                                 │
│  ┌──────────┐  ┌───────────────┐  ┌──────────────────────┐     │
│  │ Landing  │  │  Dashboard /  │  │   Lesson Room        │     │
│  │  Page    │  │  Classes      │  │  ┌────────────────┐  │     │
│  │         │  │               │  │  │  Whiteboard    │  │     │
│  │         │  │  Topic/PDF/   │  │  │  (react-live)  │  │     │
│  │         │  │  Video Setup  │  │  ├────────────────┤  │     │
│  │         │  │               │  │  │  Agent Voice   │  │     │
│  │         │  │               │  │  │  Visualizer    │  │     │
│  └──────────┘  └───────────────┘  └──────────────────────┘     │
│                        │                     │                  │
│                   REST API              WebRTC + Data           │
│                   (Axios)              (LiveKit SDK)            │
└────────────────────┬─────────────────────────┬──────────────────┘
                     │                         │
                     ▼                         ▼
┌────────────────────────────┐   ┌────────────────────────────────┐
│     JAVA BACKEND           │   │     LIVEKIT CLOUD              │
│  Spring Boot 3.5 · Java 17│   │  (WebRTC Signaling + SFU)      │
│                            │   │                                │
│  • Auth (JWT + OTP email)  │   │  Room per Lesson (UUID)        │
│  • Course Generation API   │   │  ┌─────────┐  ┌────────────┐  │
│  • LiveKit Token Issuer    │   │  │ Student │◄►│  AI Agent  │  │
│  • Tool Endpoints:         │   │  │ (browser)│  │  (Python)  │  │
│    - /generate-canvas      │   │  └─────────┘  └────────────┘  │
│    - /generate-image       │   │       Audio ◄──► Audio        │
│    - /lesson prompt        │   │       Data  ◄──► Data         │
│  • PDF/Video Ingestion     │   └────────────────────────────────┘
│                            │                    │
│  PostgreSQL 17 · Redis     │                    │
└────────────┬───────────────┘                    │
             │                                    │
             ▼                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PYTHON VOICE AGENT                          │
│              LiveKit Agents SDK · Python 3.13                   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  Amazon Nova Sonic                       │    │
│  │          (Real-time STT + LLM + TTS in one stream)      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                          │                                      │
│              Tool Calls (during conversation):                  │
│              ┌─────────────────────┐                            │
│              │  draw_canvas_code   │──► Java Backend            │
│              │                     │    (Nova Lite generates     │
│              │                     │     interactive React JSX)  │
│              ├─────────────────────┤                            │
│              │  insert_image       │──► Java Backend            │
│              │                     │    (Nova Canvas generates   │
│              │                     │     educational images)     │
│              └─────────────────────┘                            │
│                          │                                      │
│              Results sent to Frontend via LiveKit Data Channel   │
└─────────────────────────────────────────────────────────────────┘
```

**How a lesson works, step by step:**

1. Student clicks a lesson → Frontend fetches a LiveKit token from Java backend
2. Frontend joins the LiveKit room via WebRTC
3. LiveKit Cloud dispatches the Python Voice Agent into the same room
4. Agent fetches the lesson's system prompt (syllabus, context) from Java backend
5. **Amazon Nova Sonic** begins teaching — streaming voice in real time
6. When the AI needs to *show* something, it calls `draw_canvas_code` or `insert_image`
7. Java backend calls **Nova Lite** (for interactive React code) or **Nova Canvas** (for images)
8. Results are pushed to the Frontend via LiveKit data channel → rendered on the whiteboard
9. Nova Sonic receives a walkthrough description of what's on screen → speaks in sync with the visuals
10. Student asks questions naturally via microphone → Nova Sonic responds instantly

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite 5, Tailwind CSS 4, Framer Motion, React Router v6, TanStack React Query, Zustand, react-live |
| **Voice/Realtime** | LiveKit Components React, livekit-client, WebRTC, LiveKit Cloud |
| **Backend** | Spring Boot 3.5, Java 17, PostgreSQL 17, Redis |
| **AI Agent** | Python 3.13, LiveKit Agents SDK, livekit-plugins-aws |
| **AI Models** | Amazon Nova Sonic (voice), Amazon Nova Lite (reasoning), Amazon Nova Canvas (images) |
| **Auth** | JWT + OTP email verification |
| **Infrastructure** | Docker Compose (Postgres + Redis), AWS Bedrock |

---

## Getting Started

### Prerequisites

- **Java 17+** and **Maven** (or use the included `mvnw` wrapper)
- **Python 3.13+** and **uv** (Python package manager)
- **Node.js 18+** and **npm**
- **Docker** (for PostgreSQL and Redis)
- **AWS credentials** with Bedrock access (Nova Sonic, Nova Lite, Nova Canvas) in `us-east-1`
- A free **[LiveKit Cloud](https://cloud.livekit.io)** account (API key + secret)

### 1. Clone the repo

```bash
git clone https://github.com/your-org/oluko.git
cd oluko
```

### 2. Start databases

```bash
cd Backend
docker compose up -d
```

This starts PostgreSQL (port 5433) and Redis (port 6380).

### 3. Configure the Java Backend

Edit `Backend/src/main/resources/application.properties`:

```properties
# AWS Bedrock
aws.bedrock.region=us-east-1

# LiveKit (from your LiveKit Cloud dashboard)
livekit.api.key=YOUR_LIVEKIT_API_KEY
livekit.api.secret=YOUR_LIVEKIT_API_SECRET
livekit.url=wss://YOUR_PROJECT.livekit.cloud

# Email (for OTP auth)
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
```

Ensure your AWS credentials are configured (`~/.aws/credentials` or environment variables).

### 4. Run the Java Backend

```bash
cd Backend
./mvnw spring-boot:run
```

The API starts on `http://localhost:8080`.

### 5. Configure and run the Python Voice Agent

```bash
cd Backend/neuronflow-agent
```

Create a `.env` file:

```env
LIVEKIT_URL=wss://YOUR_PROJECT.livekit.cloud
LIVEKIT_API_KEY=YOUR_LIVEKIT_API_KEY
LIVEKIT_API_SECRET=YOUR_LIVEKIT_API_SECRET

AWS_ACCESS_KEY_ID=YOUR_AWS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET
AWS_DEFAULT_REGION=us-east-1
```

Install dependencies and start:

```bash
uv sync
uv run python agent.py dev
```

The agent registers with LiveKit Cloud and waits for students to join rooms.

### 6. Run the Frontend

```bash
cd Frontend
npm install
npm run dev
```

Opens on `http://localhost:5173`. Sign up, create a class, and start your first voice lesson.

---

## Project Structure

```
├── Frontend/                    # React SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── lesson/          # LessonRoom, Whiteboard, CanvasRenderer
│   │   │   ├── layout/          # Header, Landing sections
│   │   │   └── ui/              # Reusable UI components
│   │   ├── pages/               # Route pages (auth, dashboard, teach-me)
│   │   ├── lib/
│   │   │   ├── hooks/           # React Query hooks, LiveKit token
│   │   │   ├── services/        # API clients (auth, courses, livekit)
│   │   │   ├── store/           # Zustand stores (auth, toast, whiteboard)
│   │   │   └── types/           # TypeScript type definitions
│   │   └── styles/              # Tailwind globals
│   └── index.html
│
├── Backend/                     # Spring Boot API
│   ├── src/main/java/com/cm/neuronflow/
│   │   ├── controller/          # REST endpoints
│   │   ├── service/             # Business logic (course gen, tools)
│   │   ├── config/              # AWS Bedrock, Security, CORS
│   │   └── internal/            # Domain models, repositories
│   ├── neuronflow-agent/        # Python Voice Agent
│   │   ├── agent.py             # LiveKit agent + Nova Sonic + tool calls
│   │   └── pyproject.toml
│   └── docker-compose.yml       # PostgreSQL 17 + Redis
```

---

## How It's Different

| Traditional EdTech | Olùkọ́ |
|---|---|
| Pre-recorded videos you passively watch | Live voice AI that teaches, listens, and adapts |
| Static slides and textbooks | Real-time whiteboard with generated diagrams and code |
| Separate quiz apps | Voice-driven quizzes integrated into the lesson flow |
| One-size-fits-all courses | Curriculum generated on-the-fly from *your* material |
| Type your questions into a chatbox | Just speak — like talking to a real tutor |



## Team

Built for the **Amazon Nova AI Hackathon**.

---

## License

MIT
