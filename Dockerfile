# ==============================================================================
# Stage 1: Builder
# ==============================================================================
FROM python:3.12-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install dependencies first for layer caching
COPY requirements.txt pyproject.toml ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy source and install package
COPY . .
RUN pip install --no-cache-dir .

# ==============================================================================
# Stage 2: Runtime Image
# ==============================================================================
FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH"

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy virtualenv from builder
COPY --from=builder /opt/venv /opt/venv

# Create dedicated non-root user
RUN useradd --create-home --shell /bin/bash appuser \
    && mkdir -p /home/appuser/app \
                /home/appuser/.tradingagents \
                /home/appuser/app/data_cache \
                /home/appuser/app/generated_pdfs \
                /home/appuser/app/generated_reports \
                /home/appuser/app/obsidian \
    && chown -R appuser:appuser /home/appuser

WORKDIR /home/appuser/app

# Copy application source code
COPY --chown=appuser:appuser . .

# Ensure entrypoint is executable
RUN chmod +x /home/appuser/app/docker-entrypoint.sh

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/session/status || exit 1

ENTRYPOINT ["/home/appuser/app/docker-entrypoint.sh"]
CMD ["web"]
