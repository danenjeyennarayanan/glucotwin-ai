FROM python:3.11-slim
WORKDIR /app

# Non-root user
RUN useradd -m -u 1000 mluser

# Install dependencies first (layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy service code
COPY ml_service.py .

# Copy pre-trained model artifacts (pkl files — primary path, no training needed)
COPY model/ ./model/

# Copy dataset as fallback — only used if pkl files are absent/corrupt and model needs retraining
COPY diabetes_prediction_dataset.csv .

RUN chown -R mluser:mluser /app
USER mluser

EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5001/health')" || exit 1

# Production: gunicorn with 2 workers, 120s timeout for SHAP
CMD ["gunicorn", "--workers=2", "--bind=0.0.0.0:5001", "--timeout=120", \
     "--access-logfile=-", "--error-logfile=-", "ml_service:app"]
