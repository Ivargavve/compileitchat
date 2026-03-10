from typing import Annotated, AsyncGenerator
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from langchain_core.tools import tool
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, AIMessageChunk
from langchain_openai import ChatOpenAI
from pydantic import BaseModel

from .retriever import Retriever

# Single instance reused across requests to avoid reloading FAISS index
retriever = Retriever()


class State(BaseModel):
    # add_messages reducer appends new messages instead of replacing
    messages: Annotated[list, add_messages]


@tool
def search_compileit(query: str) -> str:
    """Search the CompileIT website. Use natural Swedish phrases as queries.

    Examples:
    - "vilka är ni" -> search "om oss företaget vision"
    - "vad gör ni" -> search "tjänster vi erbjuder"
    - "branscher" -> search "erfarenhet industrier kunder retail"
    - "kontakt" -> search "kontakt adress kontor"
    """
    results = retriever.search(query, k=8)

    if not results:
        return "Ingen relevant information hittades i sökningen."

    context_parts = []
    for r in results:
        context_parts.append(f"[{r['url']}]\n{r['text']}")

    return "KONTEXT FRÅN WEBBPLATSEN:\n\n" + "\n\n---\n\n".join(context_parts)


SYSTEM_PROMPT = """Du är en vänlig kundtjänstassistent för CompileIT.

HÄLSNINGAR (svara direkt, SÖK INTE):
- "hej/hallå/tjena" → "Hej! Vad kan jag hjälpa dig med?"
- "tack/hejdå" → "Varsågod! Ha en fin dag!"

FAKTAFRÅGOR (sök först, max 2 meningar):
- Använd search_compileit för frågor om tjänster, branscher, kontakt, teamet
- Lägg till länk endast vid detaljerade faktasvar

OFF-TOPIC / INGET SVAR:
- Om frågan inte handlar om CompileIT eller du inte hittar svar, säg vänligt:
  "Det har jag tyvärr inte info om. Jag kan hjälpa dig med frågor om CompileITs tjänster, branscher eller kontaktuppgifter!"

Svara alltid på svenska."""

tools = [search_compileit]
llm = ChatOpenAI(model="gpt-4o-mini", streaming=True)
llm_with_tools = llm.bind_tools(tools)


def chatbot(state: State):
    messages = [SystemMessage(content=SYSTEM_PROMPT)] + state.messages
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}


graph_builder = StateGraph(State)
graph_builder.add_node("chatbot", chatbot)
graph_builder.add_node("tools", ToolNode(tools))

graph_builder.add_edge(START, "chatbot")
# LLM decides: call tool → tools node, or respond directly → END
graph_builder.add_conditional_edges("chatbot", tools_condition)
graph_builder.add_edge("tools", "chatbot")

graph = graph_builder.compile()


async def stream_response(messages: list[dict]) -> AsyncGenerator[str, None]:
    langchain_messages = []
    for msg in messages:
        if msg["role"] == "user":
            langchain_messages.append(HumanMessage(content=msg["content"]))
        elif msg["role"] == "assistant":
            langchain_messages.append(AIMessage(content=msg["content"]))

    state = {"messages": langchain_messages}

    async for event in graph.astream_events(state, version="v2"):
        if event["event"] == "on_chat_model_stream":
            chunk = event["data"]["chunk"]
            if isinstance(chunk, AIMessageChunk) and chunk.content:
                yield chunk.content
