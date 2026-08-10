FROM python:3.11-slim

# Install system tools needed for PDF OCR and Audio processing
RUN apt-get update && apt-get install -y \
    ffmpeg \
    tesseract-ocr \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install lightweight Python dependencies (No PyTorch!)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Start the FastAPI server on Render's default port 10000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "10000"]