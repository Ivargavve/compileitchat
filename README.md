# CompileIT Chat

A RAG chatbot that answers questions about compileit.com in Swedish.

## Tech Stack

**Backend:** Python, FastAPI, LangGraph, FAISS, OpenAI

**Frontend:** Next.js

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
* Sammanfatta sidan Om oss i tre punkter

## Why This Design

**FAISS over pgvector:** The website has around 350 chunks. FAISS loads everything into memory at startup which is fast and simple. No need for a database when the data fits in a few megabytes.

**LangGraph for orchestration:** The case required an orchestration framework with tool calling. LangGraph lets the LLM decide when to search rather than hardcoding the logic.

**Crawl4AI for scraping:** Open source, runs locally, outputs clean markdown. No API keys or rate limits.

**Streaming responses:** Better UX. Users see the answer as it generates instead of waiting for the full response.
