import json
import os
import pickle
import faiss
import numpy as np
from dotenv import load_dotenv
from openai import OpenAI
from langchain_text_splitters import RecursiveCharacterTextSplitter

load_dotenv("backend/.env")

DATA_PATH = "backend/data/knowledge.json"
INDEX_PATH = "backend/data/faiss.index"
CHUNKS_PATH = "backend/data/chunks.pkl"

EMBEDDING_MODEL = "text-embedding-3-small"
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50


def load_data():
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def chunk_documents(pages):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " ", ""],
    )

    chunks = []
    for page in pages:
        page_chunks = splitter.split_text(page["content"])
        for chunk in page_chunks:
            chunks.append({
                "text": chunk,
                "url": page["url"],
                "title": page["title"],
            })

    return chunks


def get_embeddings(texts: list[str], client: OpenAI) -> np.ndarray:
    response = client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=texts,
    )
    embeddings = [item.embedding for item in response.data]
    return np.array(embeddings, dtype=np.float32)


def build_index(chunks: list[dict], client: OpenAI):
    print(f"Generating embeddings for {len(chunks)} chunks...")

    batch_size = 100
    all_embeddings = []

    for i in range(0, len(chunks), batch_size):
        batch = chunks[i : i + batch_size]
        texts = [c["text"] for c in batch]
        embeddings = get_embeddings(texts, client)
        all_embeddings.append(embeddings)
        print(f"  Processed {min(i + batch_size, len(chunks))}/{len(chunks)}")

    embeddings_matrix = np.vstack(all_embeddings)

    dimension = embeddings_matrix.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings_matrix)

    return index


def main():
    client = OpenAI()

    print("Loading scraped data...")
    pages = load_data()
    print(f"  Loaded {len(pages)} pages")

    print("Chunking documents...")
    chunks = chunk_documents(pages)
    print(f"  Created {len(chunks)} chunks")

    index = build_index(chunks, client)

    print("Saving index and chunks...")
    faiss.write_index(index, INDEX_PATH)
    with open(CHUNKS_PATH, "wb") as f:
        pickle.dump(chunks, f)

    print(f"\nDone!")
    print(f"  Index: {INDEX_PATH}")
    print(f"  Chunks: {CHUNKS_PATH}")


if __name__ == "__main__":
    main()
