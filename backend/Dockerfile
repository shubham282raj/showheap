# -------- Build TGFS binary --------
FROM golang:1.25-alpine3.21 AS tgfs-builder

WORKDIR /build

COPY tgfs /build/tgfs
WORKDIR /build/tgfs

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -o /tgfs -ldflags="-w -s" ./cmd/fsb


# -------- Python backend runtime --------
FROM python:3.14-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1

# Install Python dependencies first (better caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY . .

# Copy tgfs binary
COPY --from=tgfs-builder /tgfs /usr/local/bin/tgfs

# Expose ports
EXPOSE 8000
EXPOSE 9000

# Run TGFS + Backend
CMD ["sh", "-c", "PORT=9000 tgfs run & exec uvicorn main:app --host 0.0.0.0 --port 8000"]