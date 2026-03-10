import pickle
import faiss
import numpy as np
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

# Pre-built offline to avoid embedding costs per request
INDEX_PATH = "data/faiss.index"
CHUNKS_PATH = "data/chunks.pkl"
EMBEDDING_MODEL = "text-embedding-3-small"


class Retriever:
    def __init__(self):
        self.index = faiss.read_index(INDEX_PATH)
        with open(CHUNKS_PATH, "rb") as f:
            self.chunks = pickle.load(f)
        self.client = OpenAI()

    def _embed(self, text: str) -> np.ndarray:
        response = self.client.embeddings.create(
            model=EMBEDDING_MODEL,
            input=[text],
        )
        return np.array([response.data[0].embedding], dtype=np.float32)

    def search(self, query: str, k: int = 5) -> list[dict]:
        query_embedding = self._embed(query)
        distances, indices = self.index.search(query_embedding, k)

        results = []
        for i, idx in enumerate(indices[0]):
            if idx < len(self.chunks):
                chunk = self.chunks[idx]
                results.append({
                    "text": chunk["text"],
                    "url": chunk["url"],
                    "title": chunk["title"],
                    "score": float(distances[0][i]),
                })

        return results
