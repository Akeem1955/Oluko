


With exactly 10 days left for the hackathon, we need a ruthless, highly focused execution plan. We must tackle the highest-risk technical challenges (like the Bidirectional Audio Bridge) first, and leave the UI polish for the end.

Based on our agreed Two-Model Architecture (Amazon Nova 2 Lite as the "Brain" + Nova Sonic as the "Voice") over pure WebSockets, here is your **10-Day Phase Plan** detailing exactly what must be refactored in both repositories.

---

### 🗓️ Phase 1: The Core Audio Bridge & AWS Setup (Days 1 - 3)
**Goal:** Rip out Gemini/Google TTS and establish a real-time, low-latency voice connection between the browser microphone and Amazon Nova Sonic.
*This is the most critical phase. If this works, the hackathon is won.*

**Backend (`CognitoBackend`) Changes:**
1.  **Dependencies:** Add `aws-java-sdk-bedrockruntime` to `pom.xml`. Remove Google GenAI and Google TTS dependencies.
2.  **AWS Config:** Create `BedrockConfig.java` to initialize `BedrockRuntimeAsyncClient`.
3.  **Refactor `LessonSessionWsHandler.java`:**
    *   Remove the old synchronous Google TTS logic.
    *   On WebSocket connect, open an `InvokeModelWithResponseStreamRequest` to **Nova Sonic**.
    *   When receiving a `USER_AUDIO_CHUNK` from the frontend, push it into the active Nova Sonic stream.
    *   When Nova Sonic emits an audio chunk, push it down the WebSocket to the frontend as `AUDIO_CHUNK`.

**Frontend (`Cognito`) Changes:**
1.  **Microphone Capture:** Create a new `audio-worklet.js` file to capture 16-bit PCM audio from the user's mic.
2.  **Refactor `useAudioStreaming.ts` / `useLessonWebSocket.ts`:**
    *   Update `navigator.mediaDevices.getUserMedia` to strictly include `{ audio: { echoCancellation: true, noiseSuppression: true } }`.
    *   Stream the microphone chunks *up* the WebSocket as `{ type: "USER_AUDIO_CHUNK", data: "<base64>" }`.
    *   Ensure the existing playback queue smoothly plays the incoming `AUDIO_CHUNK` from Sonic.

---

### 🗓️ Phase 2: Multimodal Digestion & Concentration Mode (Days 4 - 5)
**Goal:** Implement the "Brain" (Nova 2 Lite). The backend must digest PDFs/Topics and structure them, and the frontend needs the UI for the new study modes.

**Backend (`CognitoBackend`) Changes:**
1.  **Refactor `CourseGenerationService`:**
    *   Replace Gemini calls with **Amazon Nova 2 Lite** calls via the Bedrock SDK.
    *   Update the prompt to accept a target language (Polyglot feature).
    *   Add logic to slice a PDF based on a `pageRange` parameter.
2.  **State Management:** Store the digested syllabus/quiz bank in the session state so Nova Sonic knows what to teach.
3.  **WebSocket Event:** Add a listener in `LessonSessionWsHandler` for `STUDY_COMPLETED`. When received, trigger Nova Sonic to begin the interactive voice quiz based on the digested context.

**Frontend (`Cognito`) Changes:**
1.  **Class Creation UI:** Add a "Spoken Language" dropdown.
2.  **Concentration Mode UI:**
    *   Add an input field for "Page Range" next to the PDF upload.
    *   Add a large **"I'm Done Studying"** button in the lesson view.
    *   Wire the button to send `{ type: "STUDY_COMPLETED" }` over the WebSocket.

---

### 🗓️ Phase 3: The Multi-Agent Whiteboard (Days 6 - 7)
**Goal:** Enable Nova Sonic to control the screen while talking, using Nova 2 Lite/Canvas as background workers.

**Backend (`CognitoBackend`) Changes:**
1.  **Tool Configuration:** In `LessonSessionWsHandler`, attach a `ToolConfiguration` to the Nova Sonic stream defining `draw_canvas_code`, `insert_image`, and `insert_video`.
2.  **Tool Interceptor Logic:**
    *   When Sonic emits a `ToolUse` event, do NOT send it to the frontend immediately.
    *   Spawn an async thread: Call **Nova 2 Lite** (for React Canvas Code) or **Nova Canvas** (for images).
    *   When the background model finishes, send `{ type: "TOOL_CALL", action: "canvas", payload: "<code>" }` to the frontend via WebSocket.

**Frontend (`Cognito`) Changes:**
1.  **Zustand Store:** Update the whiteboard state store to listen for `TOOL_CALL` WebSocket events.
2.  **Whiteboard Component:**
    *   Implement a safe React component (like `react-live` or a sandboxed `iframe`/`eval` alternative) to dynamically render the Canvas Code sent by the backend.
    *   Add UI overlays to display AI-generated images/videos asynchronously without interrupting the audio playback.

---

### 🗓️ Phase 4: Live Translation Mode (Video Dubbing) (Days 8 - 9)
**Goal:** The hardest feature. Mute an uploaded video and have Sonic dub it perfectly in sync.

**Backend (`CognitoBackend`) Changes:**
1.  **Video Pre-processing Service:**
    *   Extract audio from uploaded MP4s (using FFmpeg or standard Java libs).
    *   Send audio to **Amazon Transcribe** (or Nova Pro) to get a timestamped, translated transcript.
2.  **WebSocket Sync:** Listen for `VIDEO_TIMESTAMP_SYNC` events. When the frontend says "We are at 00:05", grab the translated text for that timestamp and feed it into the active Nova Sonic stream to generate the dubbing voice.

**Frontend (`Cognito`) Changes:**
1.  **Video Player UI:** Add a custom HTML5 Video Player component.
2.  **Sync Logic:** Mute the `<video>` tag (`muted={true}`). Add an `onTimeUpdate` event listener that fires a WebSocket message to the backend every second: `{ type: "VIDEO_TIMESTAMP_SYNC", currentTime: 5.2 }`.

---

### 🗓️ Phase 5: Debug, Polish & Hackathon Recording (Day 10)
**Goal:** Ensure the app doesn't crash during the demo.
1.  **Frontend:** Polish loading spinners (e.g., "Nova 2 Lite is digesting your material...").
2.  **Backend:** Add error handling for AWS Bedrock rate limits or WebSocket disconnects.
3.  **Final Test:** Record the 3-minute hackathon submission video showing off all 4 modes perfectly.

---







Thank you for catching that! You are absolutely right, and I appreciate the correction. Looking closely at `CognitoBackend`, I see exactly how the curriculum generation works now.

In Cognito, the backend doesn't just "chat" about a file; it acts as an **Instructional Designer**. It takes the input, breaks it down into a structured **Course Syllabus** (Modules, Lessons, Steps), and then the WebSocket steps the user through that specific curriculum (`NEXT_STEP`).

Here are the **Updated Agile User Stories**, perfectly separated to match your Cognito backend logic and upgraded with the Amazon Nova architecture:

---

### 📖 Epic 1: The Core Learning Modes (Curriculum Generation)

#### 1. User Story: Topic Mode (Text-to-Course)
**As a** curious learner,
**I want to** type in a specific subject (e.g., "How Black Holes Work") and select my preferred language,
**So that** the AI can instantly generate a structured, step-by-step course and teach it to me via live voice in my chosen language.
*   **Architecture:**
    *   **Nova 2 Lite:** Takes the text topic, acts as the curriculum designer, and generates a structured JSON syllabus (modules and steps).
    *   **Nova Sonic:** Takes the current `step` of the syllabus and teaches it to the user via real-time WebSocket voice.

#### 2. User Story: PDF Mode (Document-to-Course)
**As a** student with a textbook or document,
**I want to** upload my PDF and select my language,
**So that** the AI teaches me *strictly* based on the contents of that PDF, breaking it down into digestible lessons.
*   **Architecture:**
    *   **Nova 2 Lite (The Digester):** Ingests the PDF, extracts the text, and structures *only* that content into a custom course syllabus.
    *   **Nova Sonic (The Teacher):** Guides the user through the PDF's syllabus via voice, answering questions exclusively using the PDF as its ground truth.

#### 3. User Story: Video Mode (Video-to-Course)
**As a** visual learner,
**I want to** upload an educational video (under 25MB) and select my language,
**So that** the AI can watch the video, extract the core concepts, and build a step-by-step interactive course around what the video taught.
*   **Architecture:**
    *   **Nova 2 Lite:** Analyzes the video frames and audio transcript, digesting the knowledge into a course outline.
    *   **Nova Sonic:** Teaches the user the concepts from the video interactively over voice.

---

### 📖 Epic 2: The New "NeuronFlow" Hackathon Features

#### 4. User Story: Live Translation Mode (Video Dubbing)
**As a** user who found a great tutorial in a foreign language,
**I want to** upload a video file of *any size*, have the frontend mute the original audio, and hear the AI natively speak over the video in my language,
**So that** I can seamlessly watch and understand content without reading subtitles.
*   **Architecture:**
    *   **Java Backend:** Extracts the audio track and streams it for translation (using Amazon Transcribe or Nova 2 Lite).
    *   **Nova Sonic:** Acts as the live interpreter, taking the translated text and streaming highly expressive dubbing audio back to the frontend, synced with the video.

#### 5. User Story: Concentration Mode (Self-Study & Quizmaster)
**As a** focused learner preparing for an exam,
**I want to** upload a PDF, select specific pages (e.g., Pages 10-15) to read quietly by myself, and click a "Done" button when finished,
**So that** the AI can instantly launch an interactive voice quiz strictly based on those pages, gently correcting and re-explaining if I get a question wrong.
*   **Architecture:**
    *   **Nova 2 Lite:** Digests the exact page range, generating a hidden "Quiz Bank" and context summary in the background while the user reads.
    *   **Nova Sonic:** Triggered by the "Done" WebSocket event, Sonic takes the Quiz Bank, asks the user a question via voice, evaluates their spoken answer, and either praises them or re-explains the concept.

#### 6. User Story: Interactive Whiteboard (The AI Visual Teacher)
**As a** student learning a complex concept in *any* of the modes above,
**I want** the AI tutor to dynamically draw interactive diagrams, generate images, or insert videos onto my whiteboard while it explains things to me,
**So that** I have a visual aid that matches the AI's real-time voice explanation.
*   **Architecture (The Multi-Agent Flow):**
    *   **Nova Sonic:** While speaking, decides a visual is needed and emits a Tool Call (`draw_canvas_code`, `insert_image`, `insert_video`).
    *   **Nova 2 Lite / Canvas / Reel:** Intercepted by Spring Boot, these heavy-lifter models run in the background to actually write the React canvas code or generate the media.
    *   **Frontend:** Receives the generated code/media via WebSocket and updates the whiteboard asynchronously while Sonic is still talking.

---

### 🎯 Alignment Check
By restructuring it this way, we perfectly preserve your original `Cognito` logic (where the backend generates a course/syllabus first) while layering on the real-time, multi-agent magic of Amazon Nova.

Does this accurately reflect the exact system we are building? If yes, we are ready to open the IDE! **Where would you like to start the Java refactoring?** (e.g., Setting up the AWS Bedrock Client, adapting the `LessonSessionWsHandler`, or building the Nova 2 Lite Syllabus Generator?)




### 🚀 Let's Start Phase 1!
This timeline is aggressive but entirely possible because you already have a working WebSocket architecture in `Cognito`. We just need to replace the engine.

Since **Phase 1 (The Audio Bridge)** is the most important, **shall we begin by writing the `BedrockConfig.java` and updating the `pom.xml` in your Spring Boot backend to connect to Amazon Nova?**