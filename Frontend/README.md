# Cognito

An AI-powered educational platform for self-directed learners, featuring interactive learning modes, an AI tutor named Ajibade, and comprehensive progress tracking.

App Preview:
![App Preview](./public/opengraph-image.png)

## ✨ Features

### 🎓 Learning Modes

- **Topic Tutor** - AI generates personalized lessons on any topic you want to learn
- **YouTube Tutor** - Transform any YouTube video into an interactive learning experience with AI-guided explanations
- **PDF Tutor** - Upload documents and get AI-powered summaries, explanations, and interactive lessons

### 🤖 AI-Powered Learning

- **Ajibade AI Tutor** - Your personal AI learning assistant available during lessons
- **Real-time Clarifications** - Ask questions during lessons and get instant AI responses
- **Interactive Whiteboard** - Visual learning with AI-generated content
- **Adaptive Quizzes** - AI-generated quizzes tailored to your learning progress

### 📊 Progress Tracking

- **Learning Streaks** - Track your daily learning consistency
- **Time Analytics** - Monitor total minutes spent learning
- **Completion Tracking** - See your progress across all classes
- **Global Ranking** - Compare your progress with other learners
- **Weekly Goals** - Set and track weekly learning hour targets

### 🎨 User Experience

- **Theme System** - Light, Dark, and System-adaptive themes
- **Responsive Design** - Seamless experience across all devices
- **Real-time Updates** - WebSocket-powered live lesson sessions
- **Toast Notifications** - Elegant feedback for all actions

## 🛠️ Tech Stack

### Frontend

- **React 19** + **TypeScript** - Modern React with full type safety
- **Vite 5** - Lightning-fast build tool and dev server
- **Tailwind CSS 4** - Utility-first CSS framework with Lightning CSS engine
- **Framer Motion 11** - Smooth animations and transitions

### State Management & Data

- **Zustand** - Lightweight state management
- **@tanstack/react-query** - Server state management and caching
- **Zod** - Runtime type validation
- **js-cookie** - Cookie management for authentication

### Routing & Navigation

- **React Router 6** - Client-side routing

### UI & Icons

- **Lucide React** - Beautiful, consistent icon set
- **tailwindcss-animate** - Pre-built animation utilities

### Communication

- **Axios** - HTTP client with request/response interceptors for JWT injection
- **WebSocket** - Real-time bidirectional communication for live lesson sessions
- **Audio Streaming** - OGG/Opus chunk-based streaming for instant AI tutor voice feedback

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd Cognito

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API URLs
```

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=https://your-backend-url.com/cognito/api/v1
VITE_WS_URL=wss://your-backend-url.com/ws/lesson/
```

### Development

```bash
# Start development server (runs on http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/              # Atomic UI components (Button, Card, Input, etc.)
│   ├── layout/          # Layout components (Header, AuthMiddleware)
│   ├── features/        # Business-heavy components (LessonSession, AjibadeChat)
│   └── providers/       # Context providers (ThemeProvider)
├── config/              # Centralized route & app configuration
├── lib/
│   ├── services/        # Infrastructure layer (apiClient, authService)
│   ├── store/           # Zustand state management
│   ├── hooks/           # Extracted business logic
│   │   ├── activity/    # WebSocket & Audio streaming orchestrators
│   │   └── theme/       # UI preference logic
│   ├── validation/      # Zod schemas for data integrity
│   └── utils/           # Shared utility functions (youtube.ts)
├── pages/               # Route-level components (Lazy-loaded)
└── styles/              # Global CSS & Tailwind configuration

```

## 🗺️ Routes

All routes are centrally configured in `src/config/routes.tsx` with lazy loading for optimal performance.

| Path                           | Description           | Auth Required |
| ------------------------------ | --------------------- | ------------- |
| `/`                            | Landing page          | No            |
| `/login`                       | User login            | No            |
| `/signup`                      | User registration     | No            |
| `/verify-otp`                  | OTP verification      | No            |
| `/forgot-password`             | Password reset        | No            |
| `/dashboard`                   | Main dashboard        | Yes           |
| `/classes`                     | All classes           | Yes           |
| `/teach-me`                    | Create topic class    | Yes           |
| `/teach-me/class/units`        | View class units      | Yes           |
| `/teach-me/session/:sessionId` | Active lesson session | Yes           |
| `*`                            | 404 Not Found page    | No            |
| `/settings`                    | User settings         | Yes           |

## 🔐 Authentication Flow

1. **Signup** → Email verification with OTP → Auto-login
2. **Login** → Email verification with OTP → Dashboard
3. **Password Reset** → OTP verification → Set new password → Login

All authentication uses JWT tokens stored in HTTP-only cookies.

## 🎓 Learning Flow

1. **Create Class** - Choose Topic, YouTube, or PDF mode
2. **View Curriculum** - See AI-generated lesson units
3. **Start Lesson** - Begin interactive learning session
4. **Interact with Ajibade** - Ask questions, get clarifications
5. **Complete Quizzes** - Test your understanding
6. **Track Progress** - Monitor your learning journey

The frontend integrates with a RESTful API and a dedicated WebSocket server:

- **REST API**: Handles high-level orchestration (Auth, Class Creation, Profiles).
- **WebSocket (Lesson Session)**:
  - **Handshake**: Initiated with `sessionId` and JWT.
  - **Message Flow**: Synchronized via `NEXT_STEP`, `STEP_COMPLETED`, and `USER_QUESTION`.
  - **Audio Delivery**: Streaming `AUDIO_CHUNK` messages (Base64 OGG) for low-latency voice synthesis.
  - **YouTube Sync**: Pause-point synchronization via `YOUTUBE_STEP`.

See [FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md) for full message schemas.

## 🧪 Validation

All API requests are validated using Zod schemas before sending to ensure type safety and data integrity.

See `src/lib/validation/schemas.ts` for all validation schemas.

## 🏗️ Core Module Deep-Dive

### 📡 The Orchestration Layer (`src/lib/hooks/activity`)

This is the "brain" of the frontend. It manages the complex lifecycle of a lesson session:

- **`useLessonWebSocket`**: Orchestrates the duplex communication with the server, handling event routing for lesson steps, questions, and sync points.
- **`useAudioStreaming`**: Manages the `AudioContext` and chunked buffer strategy for the OGG/Opus stream, ensuring seamless playback without blocking the UI.

### 🔐 Infrastructure & Services (`src/lib/services`)

A robust communication layer that abstracts the backend complexity:

- **`apiClient`**: A customized Axios instance with global interceptors for header injection and automated error handling (e.g., recursive logout on session expiration).
- **Service SDKs**: Strongly typed methods for Auth, Class management, and User stats, ensuring the UI remains decoupled from API endpoints.

### 🧠 State Management Foundation (`src/lib/store`)

Uses **Zustand** for high-performance, atomic state updates:

- **`authStore`**: Manages user session lifecycle, persistence, and hydration.
- **`toastStore`**: A centralized notification system for consistent user feedback across async operations.

### 🎨 Design System (`src/components/ui`)

A collection of atomic, highly reusable components built on top of **Tailwind CSS**. These components are "dumb"—they focus purely on presentation and accessibility, ensuring a consistent visual language across the entire application.

### 🚀 Feature Modules (`src/components/features`)

Where the business logic meets the UI. Modules like `ajibade/` and `lesson/` integrate state and hooks to create complex interactive experiences, such as the AI Chat interface and the synchronized YouTube player.

---

## 🚶 App Walkthrough

Experience Cognito's seamless journey from discovery to deep learning.

### 1. Onboarding & Security

Begin your journey at the **Landing Page**, showcasing the platform's core capabilities. Create an account or sign in to be greeted by our **OTP Verification** system, ensuring a secure and personalized environment for your learning data.

### 2. The Learning Command Center (Dashboard)

Your **Dashboard** is the pulse of your learning journey. Monitor your **Learning Streaks**, track your **Weekly Goals**, and see your **Global Ranking** in real-time. The "Recent Classes" section allows you to jump back into your studies with a single click.

### 3. Creating Your Custom Curriculum

Navigate to **"Teach Me"** to choose your learning source:

- **Topic**: Type any subject, and watch Cognito architect a structured syllabus.
- **YouTube**: Paste a URL and let AI partition the video into interactive lesson units.
- **PDF**: Upload complex documents for AI-guided ingestion and explanation.

### 4. Interactive Learning Sessions

Enter an active **Lesson Session** to experience the power of synchronized learning. As you progress through lesson units, **Ajibade**—your AI Tutor—is always present to provide voice-guided explanations and respond to real-time questions.

### 5. Mastery through Interaction

Test your knowledge with **AI-Generated Quizzes** integrated directly into the lesson flow. Use the **Interactive Whiteboard** to visualize complex concepts as Ajibade breaks them down for you.

---

## 👥 Contributors

Meet the engineers behind Cognito:

| Contributor              | GitHub Profile                                     |
| :----------------------- | :------------------------------------------------- |
| **Mosimiloluwa Adebisi** | [@A-Simie](https://github.com/A-Simie)             |
| **Amina**                | [@aminatukekere](https://github.com/aminatukekere) |
| **Rahmannugar**          | [@Rahmannugar](https://github.com/Rahmannugar)     |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT
