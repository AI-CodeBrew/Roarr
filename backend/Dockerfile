# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHON_FORCE_IPV4=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .
# Expose port
EXPOSE 5001

# Startup script (disable IPv6 before starting app)
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'exec python script.py' >> /app/start.sh && \
    chmod +x /app/start.sh

# Run application with IPv6 disabled
CMD ["/app/start.sh"]