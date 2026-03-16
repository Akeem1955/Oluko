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
from livekit.plugins.aws.experimental.realtime import RealtimeModel

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

@function_tool(description="Use this to draw an interactive educational visualization on the user's whiteboard. Always provide both the concept prompt and a clear interactivity_description that specifies exactly what learners can click, drag, toggle, or step through.")
async def draw_canvas_code(
    ctx: RunContext,
    prompt_for_nova: str,
    interactivity_description: str,
) -> str:
    logger.info(
        "Tool called: draw_canvas_code with prompt=%s interactivity=%s",
        prompt_for_nova,
        interactivity_description,
    )

    room = ctx.session.room_io.room
    session = ctx.session

    # Notify frontend that generation is starting
    processing_payload = json.dumps({"type": "TOOL_PROCESSING", "message": "Generating visual code..."})
    await room.local_participant.publish_data(processing_payload.encode("utf-8"))

    async def run_canvas_generation() -> None:
        async with aiohttp.ClientSession() as http_session:
            try:
                async with http_session.post(
                    f"{BACKEND_URL}/api/v1/internal/tools/generate-canvas",
                    json={
                        "prompt": prompt_for_nova,
                        "interactivityDescription": interactivity_description,
                    },
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        generated_code = data.get("code", "")
                        walkthrough = data.get("walkthrough", "An interactive visualization is now on the whiteboard.")

                        success_payload = json.dumps({
                            "type": "TOOL_CALL_RESULT",
                            "action": "canvas",
                            "payload": generated_code,
                        })
                        await room.local_participant.publish_data(success_payload.encode("utf-8"))

                        session.generate_reply(
                            instructions=(
                                "A new interactive whiteboard visualization is now visible. "
                                "Explain what the student sees and guide interaction using this summary: "
                                f"{walkthrough}"
                            ),
                            tool_choice="none",
                        )
                    else:
                        logger.error(f"Backend returned {response.status} for canvas generation.")
                        error_payload = json.dumps({"type": "TOOL_ERROR", "message": "Failed to generate visual code."})
                        await room.local_participant.publish_data(error_payload.encode("utf-8"))
                        session.generate_reply(
                            instructions="Canvas generation failed. Briefly acknowledge it and continue teaching with a verbal explanation.",
                            tool_choice="none",
                        )
            except Exception as e:
                logger.error(f"Error calling Java backend for canvas: {e}")
                error_payload = json.dumps({"type": "TOOL_ERROR", "message": "Connection to backend failed."})
                await room.local_participant.publish_data(error_payload.encode("utf-8"))
                session.generate_reply(
                    instructions="Canvas generation backend is unreachable. Continue teaching verbally and ask the student to retry in a moment.",
                    tool_choice="none",
                )

    asyncio.create_task(run_canvas_generation())

    return (
        "Canvas generation started asynchronously. "
        "Continue speaking immediately while the whiteboard loads. "
        "When it appears, guide the student through the on-screen interaction."
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


# ==========================================
# 2. FETCH CONTEXT FROM JAVA BACKEND
# ==========================================
async def fetch_lesson_context(lesson_id: str) -> str:
    """Calls the Java Spring Boot API to get what Nova Sonic should teach."""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{BACKEND_URL}/api/v1/internal/lessons/{lesson_id}/prompt") as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get("systemPrompt", "You are a helpful AI tutor.")
                else:
                    return "You are NeuronFlow, an AI tutor. (Fallback prompt)"
    except Exception as e:
        logger.error(f"Failed to fetch from Java: {e}")
        return "You are NeuronFlow, an AI tutor. (Fallback prompt)"


# ==========================================
# 3. THE LIVEKIT WORKER ENTRYPOINT
# ==========================================
async def entrypoint(ctx: JobContext):
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    logger.info(f"Agent joined room: {ctx.room.name}")

    # The room name IS the Lesson ID from Java
    lesson_id = ctx.room.name
    runtime_state = SessionRuntimeState(lesson_id=lesson_id)
    system_prompt = await fetch_lesson_context(lesson_id)

    # Build the Agent with Nova Sonic (speech-to-speech) + whiteboard tools
    agent = Agent(
        instructions=system_prompt,
        tools=[draw_canvas_code, insert_image, show_quiz_question, end_session],
    )

    # Create session with Nova Sonic RealtimeModel (handles STT+LLM+TTS in one pass)
    session = AgentSession(
        llm=RealtimeModel(),
        userdata=runtime_state,
    )

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