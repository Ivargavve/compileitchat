# CompileIT Chat

A RAG chatbot that answers questions about compileit.com in Swedish.

**Live demo:** https://compileitchat.netlify.app

## Tech Stack

**Backend:** Python, FastAPI, LangGraph, FAISS, OpenAI

**Frontend:** Next.js

## Run Locally

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create `.env` file:
```
OPENAI_API_KEY=your_key_here
```

Start the server:
```bash
uvicorn src.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

## How It Works

1. Scraped compileit.com using Crawl4AI
2. Split content into chunks and created embeddings with OpenAI
3. Stored embeddings in FAISS (in memory vector search)
4. LangGraph agent decides when to search and generates answers
5. Responses stream to the frontend in real time

## Example Questions

* Vad erbjuder ni för typer av AI tjänster?
* Vilka branscher jobbar ni med?
* Hur kontaktar man er, och var sitter ni?
* Har ni beskrivit hur ni jobbar med säkerhet/sekretess?
* Sammanfatta sidan Om oss i tre punkter

## Why This Design

**FAISS over pgvector:** The website has around 350 chunks. FAISS loads everything into memory at startup which is fast and simple. No need for a database when the data fits in a few megabytes.

**LangGraph for orchestration:** The case required an orchestration framework with tool calling. LangGraph lets the LLM decide when to search rather than hardcoding the logic.

**Crawl4AI for scraping:** Open source, runs locally, outputs clean markdown. No API keys or rate limits.

**Streaming responses:** Better UX. Users see the answer as it generates instead of waiting for the full response.

**Inline CSS for the widget:** Keeps the chat component standalone with no extra dependencies. For a larger project Tailwind would be preferred.
