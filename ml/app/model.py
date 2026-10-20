"""CLIP wrapper: zero-shot species + injury classification and image embeddings."""

from __future__ import annotations

import io
import threading
from dataclasses import dataclass

import numpy as np
from PIL import Image

from .config import MODEL_NAME
from .labels import INJURY_PROMPTS, SPECIES_PROMPTS


@dataclass
class ImageAnalysis:
    species: dict[str, float]  # label -> probability
    injury_probability: float
    embedding: np.ndarray  # L2-normalised


class ClipModel:
    def __init__(self, model_name: str = MODEL_NAME):
        import torch
        from transformers import CLIPModel, CLIPProcessor

        self.torch = torch
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.name = model_name
        self.model = CLIPModel.from_pretrained(model_name).to(self.device).eval()
        self.processor = CLIPProcessor.from_pretrained(model_name)
        self.lock = threading.Lock()
        self.species_labels, self.species_text = self._encode_prompt_sets(SPECIES_PROMPTS)
        self.injury_labels, self.injury_text = self._encode_prompt_sets(INJURY_PROMPTS)

    def _encode_prompt_sets(self, prompt_sets: dict[str, list[str]]):
        labels = list(prompt_sets)
        vectors = []
        with self.torch.no_grad():
            for label in labels:
                inputs = self.processor(text=prompt_sets[label], return_tensors="pt", padding=True).to(self.device)
                emb = self.model.get_text_features(**inputs)
                emb = emb / emb.norm(dim=-1, keepdim=True)
                mean = emb.mean(dim=0)
                vectors.append(mean / mean.norm())
        return labels, self.torch.stack(vectors)

    def analyze(self, image_bytes: bytes) -> ImageAnalysis:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        with self.lock, self.torch.no_grad():
            inputs = self.processor(images=image, return_tensors="pt").to(self.device)
            img = self.model.get_image_features(**inputs)
            img = img / img.norm(dim=-1, keepdim=True)
            scale = self.model.logit_scale.exp()
            species_p = (scale * img @ self.species_text.T).softmax(dim=-1)[0].cpu().numpy()
            injury_p = (scale * img @ self.injury_text.T).softmax(dim=-1)[0].cpu().numpy()
        return ImageAnalysis(
            species={label: float(p) for label, p in zip(self.species_labels, species_p)},
            injury_probability=float(injury_p[self.injury_labels.index("injured")]),
            embedding=img[0].cpu().numpy().astype(np.float32),
        )
