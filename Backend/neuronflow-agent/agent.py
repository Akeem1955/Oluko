import json
import logging
import aiohttp
import os
import asyncio
import time
from dataclasses import dataclass, field
from dotenv import load_dotenv

from livekit.agents import (
    Agent,
    AgentSession,
    AutoSubscribe,
    JobContext,
    RunContext,
    WorkerOptions,
    cli,
    function_tool,
)
from livekit.plugins.google import realtime
from livekit.plugins import silero, google, elevenlabs

load_dotenv()

logger = logging.getLogger("neuronflow-agent")

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8080")
WORKER_RESTART_DELAY_SECONDS = float(os.getenv("WORKER_RESTART_DELAY_SECONDS", "3"))


@dataclass
class SessionRuntimeState:
    lesson_id: str
    transcript_lines: list[str] = field(default_factory=list)
    transcript_sent: bool = False
    ended_by_agent: bool = False


def append_transcript_line(state: SessionRuntimeState, role: str, text: str) -> None:
    cleaned = (text or "").strip()
    if not cleaned:
        return

    line = f"{role}: {cleaned}"
    if state.transcript_lines and state.transcript_lines[-1] == line:
        return

    state.transcript_lines.append(line)


async def persist_session_transcript(
    state: SessionRuntimeState,
    *,
    ended_by_agent: bool,
    shutdown_reason: str = "",
) -> None:
    if state.transcript_sent:
        return

    transcript = "\n".join(state.transcript_lines).strip()
    if not transcript and not ended_by_agent:
        return

    payload = {
        "transcript": transcript,
        "endedByAgent": ended_by_agent,
        "shutdownReason": shutdown_reason,
    }

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{BACKEND_URL}/api/v1/internal/lessons/{state.lesson_id}/session-transcript",
                json=payload,
            ) as response:
                if response.status == 200:
                    state.transcript_sent = True
                else:
                    logger.error(
                        f"Failed to persist transcript. Status={response.status}"
                    )
    except Exception as e:
        logger.error(f"Error persisting transcript: {e}")


# ==========================================
# 1. WHITEBOARD TOOLS (standalone functions)
# ==========================================

@function_tool(description="Render a React component on the student's whiteboard. Provide a single, self-contained React functional component (JSX) called LessonVisualization. The component must use hooks as React.useState, React.useEffect, React.useRef. Do not include imports or exports. End the code string with: render(<LessonVisualization />);. Use Tailwind CSS for responsive styling, custom SVG shapes, animated transitions, or interactive panels to make the lesson clear. Keep it interactive and highly visual.")
async def whiteboard_draw(
    ctx: RunContext,
    react_code: str,
) -> str:
    logger.info(
        "Tool called: whiteboard_draw (react code length=%d)",
        len(react_code or ""),
    )

    room = ctx.session.room_io.room

    if not react_code or not react_code.strip():
        error_payload = json.dumps({"type": "TOOL_ERROR", "message": "Empty react code."})
        await room.local_participant.publish_data(error_payload.encode("utf-8"))
        return "Error: react_code was empty. Generate a valid React component and try again."

    success_payload = json.dumps({
        "type": "TOOL_CALL_RESULT",
        "action": "canvas",
        "payload": react_code,
    })
    await room.local_participant.publish_data(success_payload.encode("utf-8"))

    return (
        "The React visualization is now rendering on the student's whiteboard. "
        "Continue your verbal explanation and refer to what is visible on screen."
    )


@function_tool(description="Use this to generate and display an image on the user's whiteboard.")
async def insert_image(ctx: RunContext, image_description: str) -> str:
    logger.info(f"Tool called: insert_image -> {image_description}")

    room = ctx.session.room_io.room

    processing_payload = json.dumps({"type": "TOOL_PROCESSING", "message": "Generating image..."})
    await room.local_participant.publish_data(processing_payload.encode("utf-8"))

    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(
                f"{BACKEND_URL}/api/v1/internal/tools/generate-image",
                json={"prompt": image_description},
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    image_url = data.get("url", "")

                    success_payload = json.dumps({
                        "type": "TOOL_CALL_RESULT",
                        "action": "image",
                        "url": image_url,
                    })
                    await room.local_participant.publish_data(success_payload.encode("utf-8"))
                    return (
                        f"Success: An image is now displayed on the student's whiteboard. "
                        f"The image shows: {image_description}. "
                        f"Describe what the student should observe in the image and relate it to the lesson."
                    )
                else:
                    logger.error(f"Backend returned {response.status} for image generation.")
                    error_payload = json.dumps({"type": "TOOL_ERROR", "message": "Failed to generate image."})
                    await room.local_participant.publish_data(error_payload.encode("utf-8"))
                    return "Error: Failed to generate the image."
        except Exception as e:
            logger.error(f"Error calling Java backend for image: {e}")
            error_payload = json.dumps({"type": "TOOL_ERROR", "message": "Connection to backend failed."})
            await room.local_participant.publish_data(error_payload.encode("utf-8"))
            return "Error: Internal server connection failed."


@function_tool(description="Use this in concentration mode to display the current quiz question and answer options on the student's whiteboard. Call it before asking each quiz question.")
async def show_quiz_question(
    ctx: RunContext,
    question: str,
    option_a: str,
    option_b: str,
    option_c: str,
    option_d: str,
) -> str:
    logger.info("Tool called: show_quiz_question")

    room = ctx.session.room_io.room

    quiz_payload = json.dumps({
        "question": question,
        "options": {
            "A": option_a,
            "B": option_b,
            "C": option_c,
            "D": option_d,
        },
    })

    success_payload = json.dumps({
        "type": "TOOL_CALL_RESULT",
        "action": "quiz",
        "payload": quiz_payload,
    })

    async def publish_in_background() -> None:
        try:
            await room.local_participant.publish_data(success_payload.encode("utf-8"))
        except Exception as e:
            logger.error(f"Failed to publish quiz payload: {e}")

    asyncio.create_task(publish_in_background())

    return (
        "Quiz question displayed on whiteboard with options A to D. "
        "Now ask the question and wait for the student's answer."
    )


@function_tool(description="Use this when the lesson or quiz is fully complete and you want to end the current session for the student.")
async def end_session(ctx: RunContext, final_message: str = "Great work today.") -> str:
    logger.info("Tool called: end_session")

    room = ctx.session.room_io.room
    runtime_state = getattr(ctx.session, "userdata", None)

    payload = json.dumps({
        "type": "TOOL_CALL_RESULT",
        "action": "end_session",
        "message": final_message,
    })

    await room.local_participant.publish_data(payload.encode("utf-8"))

    if isinstance(runtime_state, SessionRuntimeState):
        runtime_state.ended_by_agent = True
        append_transcript_line(runtime_state, "ASSISTANT", final_message)
        await persist_session_transcript(
            runtime_state,
            ended_by_agent=True,
            shutdown_reason="agent_end_session",
        )

    return (
        f"Session end signal sent to the client. Closing note: {final_message} "
        "Wrap up briefly and end the conversation."
    )


@function_tool(description="Mute the student's microphone so they cannot speak or interrupt.")
async def mute_student(ctx: RunContext) -> str:
    logger.info("Tool called: mute_student")
    room = ctx.session.room_io.room
    payload = json.dumps({"type": "CONTROL_ACTION", "action": "mute"})
    await room.local_participant.publish_data(payload.encode("utf-8"))
    return "Success: The student has been muted."


@function_tool(description="Unmute the student's microphone so they are allowed to speak.")
async def unmute_student(ctx: RunContext) -> str:
    logger.info("Tool called: unmute_student")
    room = ctx.session.room_io.room
    payload = json.dumps({"type": "CONTROL_ACTION", "action": "unmute"})
    await room.local_participant.publish_data(payload.encode("utf-8"))
    return "Success: The student has been unmuted."


@function_tool(description="Resume playing the YouTube video for the student.")
async def play_video(ctx: RunContext) -> str:
    logger.info("Tool called: play_video")
    room = ctx.session.room_io.room
    payload = json.dumps({"type": "CONTROL_ACTION", "action": "play_video"})
    await room.local_participant.publish_data(payload.encode("utf-8"))
    return "Success: Video playback resumed."


@function_tool(description="Pause the YouTube video for the student.")
async def pause_video(ctx: RunContext) -> str:
    logger.info("Tool called: pause_video")
    room = ctx.session.room_io.room
    payload = json.dumps({"type": "CONTROL_ACTION", "action": "pause_video"})
    await room.local_participant.publish_data(payload.encode("utf-8"))
    return "Success: Video playback paused."


# ==========================================
# 2. FETCH CONTEXT FROM JAVA BACKEND
# ==========================================
async def fetch_lesson_context(lesson_id: str) -> dict:
    """Calls the Java Spring Boot API to get what Nova Sonic should teach."""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{BACKEND_URL}/api/v1/internal/lessons/{lesson_id}/prompt") as response:
                if response.status == 200:
                    return await response.json()
    except Exception as e:
        logger.error(f"Failed to fetch from Java: {e}")
    return {"systemPrompt": "You are NeuronFlow, an AI tutor. (Fallback prompt)", "isTeacherClass": "false", "voiceId": ""}


# ==========================================
# 3. THE LIVEKIT WORKER ENTRYPOINT
# ==========================================
async def entrypoint(ctx: JobContext):
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    logger.info(f"Agent joined room: {ctx.room.name}")

    # The room name IS the Lesson ID from Java
    lesson_id = ctx.room.name
    runtime_state = SessionRuntimeState(lesson_id=lesson_id)
    
    context = await fetch_lesson_context(lesson_id)
    system_prompt = context.get("systemPrompt", "You are NeuronFlow, an AI tutor. (Fallback prompt)")
    is_teacher_class = context.get("isTeacherClass", "false") == "true"
    voice_id = context.get("voiceId", "")

    # Build the Agent with whiteboard tools
    agent = Agent(
        instructions=system_prompt,
        tools=[whiteboard_draw, insert_image, show_quiz_question, end_session, mute_student, unmute_student, play_video, pause_video],
    )

    if is_teacher_class:
        logger.info(f"Initializing voice pipeline agent with ElevenLabs voice_id={voice_id}")
        session = AgentSession(
            # stt disabled as requested
            vad=silero.VAD.load(),
            llm=google.LLM(model="gemini-2.5-flash"),
            tts=elevenlabs.TTS(voice_id=voice_id),
            userdata=runtime_state,
        )
    else:
        # Create session with Gemini Live RealtimeModel
        session = AgentSession(
            llm=realtime.RealtimeModel(
                model="gemini-3.1-flash-live-preview"
            ),
            userdata=runtime_state,
        )

    @ctx.room.on("data_received")
    def _on_data_received(dp) -> None:
        try:
            payload = json.loads(dp.data.decode("utf-8"))
            if payload.get("type") == "SANDBOX_ERROR":
                error_msg = payload.get("message")
                logger.error(f"Sandbox error received: {error_msg}")
                asyncio.create_task(
                    session.generate_reply(
                        instructions=(
                            f"The React component you just rendered with whiteboard_draw failed with the following error:\n"
                            f"{error_msg}\n\n"
                            f"Please rewrite the React component (LessonVisualization) with correct syntax, hooks as React.useState etc., "
                            f"declare all variables, ensure no imports or exports, and call whiteboard_draw again with the fixed code. Do not speak the code."
                        )
                    )
                )
            elif payload.get("type") == "USER_ACTION" and payload.get("action") == "raise_hand":
                logger.info("Student raised hand")
                asyncio.create_task(
                    session.generate_reply(
                        instructions=(
                            "The student has just raised their hand. Acknowledge this verbally. "
                            "If you want to allow them to speak, you can call the unmute_student tool to unmute them."
                        )
                    )
                )
            elif payload.get("type") == "TEACHER_ACTION":
                action = payload.get("action")
                if action == "ask_question":
                    question = payload.get("question", "")
                    logger.info(f"Teacher asked to ask a question: {question}")
                    if question:
                        if not isinstance(session.llm, realtime.RealtimeModel):
                            asyncio.create_task(session.say(question))
                        else:
                            asyncio.create_task(
                                session.generate_reply(
                                    instructions=f"The teacher has directed you to ask the student this question: '{question}'. Ask it now."
                                )
                            )
                elif action == "end_class":
                    logger.info("Teacher requested to end the class")
                    asyncio.create_task(
                        end_session(ctx, final_message="The class has been ended by the teacher. Goodbye!")
                    )
            elif payload.get("type") == "VIDEO_EVENT" and payload.get("event") == "paused":
                timestamp = payload.get("timestamp", 0)
                logger.info(f"YouTube video paused at {timestamp}s")
                asyncio.create_task(
                    session.generate_reply(
                        instructions=(
                            f"The YouTube video has paused at {timestamp} seconds. "
                            f"Explain the concepts covered in this segment in the designated target language and personality. "
                            f"You can use the whiteboard_draw tool to illustrate your points. "
                            f"When you are done explaining, ask the student if they are ready to proceed, "
                            f"and call play_video to resume the video."
                        )
                    )
                )
        except Exception as e:
            logger.warning(f"Failed to process data packet: {e}")

    @session.on("user_input_transcribed")
    def _on_user_input_transcribed(event) -> None:
        if event.is_final and event.transcript:
            append_transcript_line(runtime_state, "USER", event.transcript)

    @session.on("conversation_item_added")
    def _on_conversation_item_added(event) -> None:
        item = event.item
        if getattr(item, "type", None) != "message":
            return

        if getattr(item, "role", None) != "assistant":
            return

        text = getattr(item, "text_content", None)
        if text:
            append_transcript_line(runtime_state, "ASSISTANT", text)

    @session.on("function_tools_executed")
    def _on_function_tools_executed(event) -> None:
        try:
            tool_names = [fc.name for fc in event.function_calls if fc is not None]
            logger.info("function_tools_executed: tools=%s has_tool_reply=%s", tool_names, getattr(event, "has_tool_reply", None))
        except Exception as e:
            logger.warning("Failed to log function_tools_executed event: %s", e)

    async def _on_shutdown(reason: str) -> None:
        if runtime_state.ended_by_agent:
            return

        try:
            shutdown_reason = str(reason or "abrupt_disconnect")
            await asyncio.wait_for(
                persist_session_transcript(
                    runtime_state,
                    ended_by_agent=False,
                    shutdown_reason=shutdown_reason[:120],
                ),
                timeout=5,
            )
        except Exception as e:
            logger.warning("Shutdown transcript persistence skipped: %s", e)

    ctx.add_shutdown_callback(_on_shutdown)

    await session.start(agent, room=ctx.room)

    # AI greets the user first (use generate_reply, not say — Nova Sonic is a realtime
    # speech-to-speech model with no separate TTS, so say() is unsupported)
    await session.generate_reply(
        instructions=(
            "Greet the user warmly, then immediately start the lesson with a whiteboard tool call. "
            "Create an initial visual before or while giving your first explanation."
        )
    )


def run_worker_forever() -> None:
    while True:
        try:
            logger.info("Starting LiveKit agent worker")
            cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
            logger.warning("LiveKit worker exited; restarting in %.1fs", WORKER_RESTART_DELAY_SECONDS)
        except KeyboardInterrupt:
            logger.info("KeyboardInterrupt received. Shutting down worker loop.")
            break
        except Exception as e:
            logger.exception("LiveKit worker crashed: %s", e)

        time.sleep(max(0.5, WORKER_RESTART_DELAY_SECONDS))


if __name__ == "__main__":
    run_worker_forever()