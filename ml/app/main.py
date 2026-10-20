"""PawRescue ML service.

POST /analyze  photos + description -> species, injury probability, explainable severity, image embedding
POST /species  one photo -> species suggestion (used to pre-fill the report form)
GET  /health
"""

from __future__ import annotations

import time
from contextlib import asynccontextmanager
from typing import Annotated

import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile

from .config import MAX_IMAGE_BYTES, MAX_IMAGES
from .severity import score_severity

state: dict = {"model": None, "error": None}


def load_model():
    from .model import ClipModel

    return ClipModel()


@asynccontextmanager
async def lifespan(app: FastAPI):
    t = time.perf_counter()
    state["model"], state["error"] = None, None
    try:
        state["model"] = load_model()
        print(f"CLIP model ready in {time.perf_counter() - t:.1f}s on {state['model'].device}")
    except Exception as exc:  # keep serving /health so the API can fall back gracefully
        state["error"] = repr(exc)
        print("Model failed to load:", exc)
    yield


app = FastAPI(title="PawRescue ML", version="1.0", lifespan=lifespan)


def get_model():
    if state["model"] is None:
        raise HTTPException(503, f"Model not loaded: {state['error'] or 'starting'}")
    return state["model"]


async def read_images(images: list[UploadFile]) -> list[bytes]:
    out = []
    for f in images[:MAX_IMAGES]:
        data = await f.read()
        if len(data) > MAX_IMAGE_BYTES:
            raise HTTPException(413, "Image too large")
        out.append(data)
    if not out:
        raise HTTPException(400, "At least one image is required")
    return out


def top(species: dict[str, float], n: int = 3):
    ranked = sorted(species.items(), key=lambda kv: kv[1], reverse=True)[:n]
    return [{"label": k, "confidence": round(v, 4)} for k, v in ranked]


@app.get("/health")
def health():
    m = state["model"]
    return {"status": "ok" if m else "degraded", "model": getattr(m, "name", None), "device": getattr(m, "device", None), "error": state["error"]}


@app.post("/species")
async def species(image: Annotated[UploadFile, File()]):
    model = get_model()
    [data] = await read_images([image])
    try:
        result = model.analyze(data)
    except Exception as exc:
        raise HTTPException(422, f"Could not read image: {exc}") from exc
    return {"top": top(result.species)}


@app.post("/analyze")
async def analyze(
    images: Annotated[list[UploadFile], File()],
    description: Annotated[str, Form()] = "",
    is_emergency: Annotated[bool, Form()] = False,
):
    model = get_model()
    started = time.perf_counter()
    try:
        results = [model.analyze(b) for b in await read_images(images)]
    except Exception as exc:
        raise HTTPException(422, f"Could not read image: {exc}") from exc

    # Aggregate across photos: average species probs, worst-case injury, mean embedding
    labels = list(results[0].species)
    species_avg = {k: float(np.mean([r.species[k] for r in results])) for k in labels}
    injury = max(r.injury_probability for r in results)
    emb = np.mean([r.embedding for r in results], axis=0)
    emb = emb / (np.linalg.norm(emb) or 1.0)

    sev = score_severity(description, injury, is_emergency)
    best = top(species_avg, 3)
    return {
        "species": {"label": best[0]["label"], "confidence": best[0]["confidence"], "top": best},
        "injury": {"probability": round(injury, 4)},
        "severity": {"level": sev.level, "score": sev.score, "reasons": sev.reasons},
        "embedding": [round(float(x), 5) for x in emb],
        "model": model.name,
        "ms": round((time.perf_counter() - started) * 1000),
    }
