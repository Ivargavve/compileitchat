from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv

# Load before imports so OpenAI client picks up API key
load_dotenv()

from .agent import stream_response

app = FastAPI(title="compileitchat API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[Message]


@app.post("/chat")
async def chat(request: ChatRequest):
    messages = [{"role": m.role, "content": m.content} for m in request.messages]

    async def generate():
        async for chunk in stream_response(messages):
            yield chunk

    # Stream tokens as they generate for better perceived latency
    return StreamingResponse(generate(), media_type="text/plain")
