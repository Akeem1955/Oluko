import json
import logging
import aiohttp
import os
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


# ==========================================
# 1. WHITEBOARD TOOLS (standalone functions)
# ==========================================

@function_tool(description="Use this to draw an interactive educational visualization on the user's whiteboard. For math/physics use animated Canvas 2D simulations. For coding/history use interactive React UI with buttons and state.")
async def draw_canvas_code(ctx: RunContext, prompt_for_nova_lite: str) -> str:
    logger.info(f"Tool called: draw_canvas_code with prompt: {prompt_for_nova_lite}")

    room = ctx.session.room_io.room

    # Notify frontend that generation is starting
    processing_payload = json.dumps({"type": "TOOL_PROCESSING", "message": "Generating visual code..."})
    await room.local_participant.publish_data(processing_payload.encode("utf-8"))

    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(
                f"{BACKEND_URL}/api/v1/internal/tools/generate-canvas",
                json={"prompt": prompt_for_nova_lite},
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

                    # Return the walkthrough to Nova Sonic so it speaks in sync with the whiteboard
                    return (
                        f"Success: The visualization is now on the student's whiteboard. "
                        f"Here is what is displayed and how the student should interact with it: {walkthrough} "
                        f"Guide the student through this visualization naturally. Reference the buttons and controls you see described above."
                    )
                else:
                    logger.error(f"Backend returned {response.status} for canvas generation.")
                    error_payload = json.dumps({"type": "TOOL_ERROR", "message": "Failed to generate visual code."})
                    await room.local_participant.publish_data(error_payload.encode("utf-8"))
                    return "Error: Failed to generate the canvas code."
        except Exception as e:
            logger.error(f"Error calling Java backend for canvas: {e}")
            error_payload = json.dumps({"type": "TOOL_ERROR", "message": "Connection to backend failed."})
            await room.local_participant.publish_data(error_payload.encode("utf-8"))
            return "Error: Internal server connection failed."


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
    system_prompt = await fetch_lesson_context(lesson_id)

    # Build the Agent with Nova Sonic (speech-to-speech) + whiteboard tools
    agent = Agent(
        instructions=system_prompt,
        tools=[draw_canvas_code, insert_image],
    )

    # Create session with Nova Sonic RealtimeModel (handles STT+LLM+TTS in one pass)
    session = AgentSession(
        llm=RealtimeModel(),
    )
    await session.start(agent, room=ctx.room)

    # AI greets the user first (use generate_reply, not say — Nova Sonic is a realtime
    # speech-to-speech model with no separate TTS, so say() is unsupported)
    await session.generate_reply(
        instructions="Greet the user warmly and tell them you are ready to begin the lesson."
    )


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))