# Hugging Face Spaces (Docker SDK) / any container host. Listens on 7860.
FROM python:3.12-slim
WORKDIR /app
ENV PIP_NO_CACHE_DIR=1 HF_HOME=/app/.cache
COPY requirements.txt .
RUN pip install --index-url https://download.pytorch.org/whl/cpu torch==2.5.1 \
 && grep -v '^torch' requirements.txt > req.txt && pip install -r req.txt
COPY app ./app
# Bake the CLIP weights into the image so cold starts don't download them
RUN python -c "from transformers import CLIPModel, CLIPProcessor as P; m='openai/clip-vit-base-patch32'; CLIPModel.from_pretrained(m); P.from_pretrained(m)"
EXPOSE 7860
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
