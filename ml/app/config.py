import os

MODEL_NAME = os.getenv("CLIP_MODEL", "openai/clip-vit-base-patch32")
MAX_IMAGES = int(os.getenv("ML_MAX_IMAGES", "3"))
MAX_IMAGE_BYTES = 6 * 1024 * 1024
