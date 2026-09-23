# ⚡ PulseChat — Production-Grade Real-Time Chat Platform

PulseChat is a modern, production-quality, real-time messaging application ("Slack/Discord-lite") engineered from scratch with a focus on real-time reliability, security, multi-device sync, and horizontal scalability.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph Clients["Web Clients (Multi-Tab / Multi-Device)"]
        ClientA["Client A (Alice)\nReact 18 + Zustand"]
        ClientB["Client B (Bob)\nReact 18 + Zustand"]
    end

    subgraph LoadBalancer["Reverse Proxy & Routing"]
        Nginx["Nginx (Reverse Proxy & SPA Static Server)\nPort 80 / 8080"]
    end

    subgraph BackendCluster["Node.js Application Cluster"]
        Server1["Server Instance 1\nExpress + Socket.IO\n(Port 4000)"]
        Server2["Server Instance 2\nExpress + Socket.IO\n(Port 4001)"]
    end

    subgraph RedisPubSub["Redis 7 Cluster / Store"]
        RedisBus["Redis Pub/Sub (Socket.IO Adapter)\nCross-Instance Broadcasts"]
        RedisPresence["Redis Sets & Keys\nHeartbeats & Multi-Socket Presence"]
        RedisRateLimit["Redis / Memory Sliding Window\nAuth & Socket Rate Limiting"]
    end

    subgraph PrimaryDB["PostgreSQL 16 Database"]
        PGCore["Prisma ORM\nUsers, Messages, Conversations, Memberships"]
        PGSearch["Full-Text Search Engine\ntsvector + GIN Index + Headline Extraction"]
    end

    subgraph ObjectStorage["Object Storage (S3 / MinIO)"]
        S3Storage["MinIO / AWS S3\nEncrypted File Attachments & Thumbnails"]
    end

    ClientA -->|HTTP / REST & WebSocket| Nginx
    ClientB -->|HTTP / REST & WebSocket| Nginx
    Nginx -->|Proxy API & WS Upgrade| Server1
    Nginx -->|Proxy API & WS Upgrade| Server2

    Server1 <-->|Pub/Sub Packet Relays| RedisBus
    Server2 <-->|Pub/Sub Packet Relays| RedisBus
    Server1 <-->|Heartbeats (30s TTL 60s)| RedisPresence
    Server2 <-->|Heartbeats (30s TTL 60s)| RedisPresence

    Server1 -->|Queries & Transactions| PGCore
    Server2 -->|Queries & Transactions| PGCore
    Server1 -->|tsvector Full-Text Search| PGSearch
    Server2 -->|tsvector Full-Text Search| PGSearch

    Server1 -->|Magic-byte sniff & Stream| S3Storage
    Server2 -->|Magic-byte sniff & Stream| S3Storage
```

---

## ✨ Core Features

| Category | Features Included |
| :--- | :--- |
| **Messaging** | Channel messaging (public & private), 1:1 Direct Messages, monotonic ULID ordering, client-side idempotency (`clientMessageId`), Markdown formatting with XSS sanitization, message editing, soft deletion, and quoted reply previews. |
| **Real-Time Layer** | Socket.IO with WebSocket transport, reconnection catch-up sync with message gap filling, multi-instance cross-server routing via Redis Adapter. |
| **Presence & Typing** | Ephemeral typing indicators with auto-stop and 5s server fallback, multi-socket presence tracking per user across multiple open tabs, and 30s heartbeat pings with 60s Redis TTL expiration. |
| **Reactions & Reads** | Optimistic emoji reaction toggling with per-user reaction state, per-conversation last-read pointer updates (`conversation:read`), and dynamic browser tab unread badges `(N) PulseChat — #channel`. |
| **Media & Attachments**| 25MB attachment upload, magic-byte MIME sniffing with `file-type` to detect disguised binaries, blocklist for dangerous extensions (`.exe`, `.bat`, `.sh`, etc.), local disk fallback for tests, and secure download headers (`nosniff`, `Content-Disposition`, CSP). |
| **Search & Discovery** | Global Quick Switcher modal (`Ctrl+K` / `Cmd+K`) for switching between channels, DMs, and searching messages across all conversations with PostgreSQL `tsvector` + GIN full-text search and highlighted match snippets. |
| **Channel Moderation** | Role-based hierarchy (`OWNER` > `ADMIN` > `MEMBER`). Channel owners and admins can mute members for 15m, 1h, 24h, unmute, or kick members with instant real-time socket ejection. |
| **Security & Auth** | Argon2 password hashing, short-lived JWT access tokens (15m), rotating refresh tokens in `httpOnly` secure cookies with token family reuse detection (revokes family upon reuse), Express rate limiting, and socket message flood control. |

---

## 🚀 Quickstart with Docker Compose

The easiest way to run the full platform (Postgres, Redis, MinIO, API Server, and Web Client) in a production-identical setup:

```bash
# 1. Clone the repository
git clone <repo-url>
cd realtime-chat

# 2. Start all services in the background
docker compose up --build -d

# 3. View status and health
docker compose ps
```

### Access URLs
- **Web App**: [http://localhost:80](http://localhost:80) (or [http://localhost:3000](http://localhost:3000))
- **API Server**: [http://localhost:4000](http://localhost:4000)
- **Health Check**: [http://localhost:4000/healthz](http://localhost:4000/healthz)
- **MinIO Console**: [http://localhost:9001](http://localhost:9001) (`minioadmin` / `minioadmin`)

---

## 🛠️ Local Development (Manual Setup)

### 1. Prerequisites
- **Node.js**: v20.x or v22+
- **PostgreSQL 16+** running on `localhost:5432`
- **Redis 7+** running on `localhost:6379`
- (Optional) **MinIO / S3** on `localhost:9000` (Server automatically falls back to local `./uploads` directory if S3 is unreachable)

### 2. Environment Variables
Copy `.env.example` in `apps/server/` or root:

```bash
cp .env.example apps/server/.env
```

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `4000` | HTTP port for the Express/Socket.IO backend server |
| `NODE_ENV` | `development` | Runtime environment (`development`, `production`, `test`) |
| `DATABASE_URL` | `postgresql://postgres:postgrespassword@localhost:5432/chatdb?schema=public` | PostgreSQL connection string |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection URL for presence and adapter pub/sub |
| `JWT_ACCESS_SECRET` | *(64-character secret)* | Secret key for signing short-lived access tokens |
| `JWT_REFRESH_SECRET` | *(64-character secret)* | Secret key for signing rotating refresh tokens |
| `ACCESS_TOKEN_EXPIRES_IN` | `15m` | Lifetime of access tokens |
| `REFRESH_TOKEN_EXPIRES_DAYS` | `7` | Lifetime of refresh token cookies |
| `CORS_ORIGIN` | `http://localhost:5173,http://localhost:3000,http://localhost:80` | Allowed CORS origins for browser fetch and sockets |
| `S3_ENDPOINT` | `http://localhost:9000` | S3 / MinIO API endpoint |
| `S3_BUCKET` | `chat-attachments` | Bucket name for uploaded attachments |
| `S3_ACCESS_KEY` | `minioadmin` | S3 Access Key |
| `S3_SECRET_KEY` | `minioadmin` | S3 Secret Key |
| `S3_FORCE_PATH_STYLE` | `true` | Required for MinIO path-style bucket routing |

### 3. Database Migration & Seeding

```bash
# Inside apps/server
cd apps/server
npx prisma generate
npx prisma migrate dev --name init
npx tsx prisma/seed.ts
```

The seed script creates default test users and channels:
- Users: `alice` (password: `Password123!`), `bob` (`Password123!`), `charlie` (`Password123!`)
- Channels: `#general`, `#engineering`, `#random`

### 4. Running the Applications

```bash
# Start backend server (from apps/server)
npm run dev

# In another terminal, start frontend (from apps/web)
npm run dev
```

The Vite dev server starts on [http://localhost:5173](http://localhost:5173).

---

## 🧪 Running Automated Tests

The codebase includes an extensive suite of unit and integration tests with **100% pass rate (40/40 tests)**:

```bash
# Run backend test suite
cd apps/server
npm test
```

### Test Suite Highlights
- `auth.service.test.ts`: Password hashing, token rotation, token family reuse detection (revoking compromised sessions).
- `auth.test.ts`: Supertest API authentication endpoints, cookie verification, validation schemas.
- `socket.test.ts`: Dual-client integration verifying message delivery, room isolation, reactions, typing indicators, read receipts, optimistic retries, and reconnect sync.
- `multi-instance.test.ts`: Spins up 2 distinct server instances with `@socket.io/redis-adapter` pub/sub and tests cross-node message routing between Client A and Client B.
- `presence.service.test.ts`: Multi-socket tracking (first socket connects -> online, last socket disconnects -> offline).
- `moderation.test.ts`: Channel mute enforcement (preventing muted members from sending messages) and role permission checks.
- `upload.service.test.ts`: Magic-byte MIME sniffing, rejection of executable binaries, and local storage fallback.
- `search.service.test.ts`: Full-text message queries with headline extraction.
- `app.test.ts`: Health endpoints (`/healthz`, `/readyz`) and Express rate limiting.

---

## 📡 Real-Time Socket Event Catalog

### Client to Server (`socket.emit(event, payload, callback)`)

| Event | Payload | Ack Response | Description |
| :--- | :--- | :--- | :--- |
| `message:send` | `{ conversationId, clientMessageId, body, replyToId?, attachmentIds? }` | `{ ok: true, data: MessageDto }` | Sends a message with optimistic idempotency. Enforces membership, rate limiting, and mute checks. |
| `message:edit` | `{ messageId, body }` | `{ ok: true, data: MessageDto }` | Edits an existing message (author only). |
| `message:delete` | `{ messageId }` | `{ ok: true, data: { messageId } }` | Soft-deletes a message (author or channel admin). |
| `reaction:toggle` | `{ messageId, emoji }` | `{ ok: true, data: { messageId, emoji, added } }` | Toggles an emoji reaction on a message. |
| `typing:start` | `{ conversationId }` | `{ ok: true }` | Broadcasts typing state to conversation room. |
| `typing:stop` | `{ conversationId }` | `{ ok: true }` | Stops typing indicator in conversation room. |
| `conversation:read`| `{ conversationId, messageId }` | `{ ok: true, data: { conversationId, lastReadMessageId, unreadCount } }` | Advances member's read pointer. |
| `conversation:join`| `{ conversationId }` | `{ ok: true }` | Joins a public channel. |
| `conversation:leave`| `{ conversationId }` | `{ ok: true }` | Leaves a channel. |
| `presence:heartbeat`| `()` | `{ ok: true }` | Refreshes user's 60s TTL presence in Redis. |
| `sync` | `{ lastMessageIds: Record<string, string> }` | `{ ok: true, data: { messages: ... } }` | Catch-up sync after reconnection. |

### Server to Client (`socket.on(event, payload)`)

| Event | Payload | Description |
| :--- | :--- | :--- |
| `message:created` | `MessageDto` | Broadcast when a new message is posted to a room. |
| `message:updated` | `MessageDto` | Broadcast when a message is edited. |
| `message:deleted` | `{ conversationId, messageId }` | Broadcast when a message is soft-deleted. |
| `reaction:updated` | `{ conversationId, messageId, emoji, userId, added }` | Real-time reaction update for all room members. |
| `typing:user` | `{ conversationId, userId, username, isTyping }` | Ephemeral typing indicator for other members. |
| `presence:updated` | `{ userId, status: 'online' \| 'offline', lastSeenAt? }` | Broadcast when a user transitions online or offline. |
| `conversation:read_updated` | `{ conversationId, userId, lastReadMessageId }` | Syncs read receipts across user's open tabs. |
| `conversation:member_kicked` | `{ conversationId, userId }` | Broadcast when a member is kicked from a channel. |

---

## 💡 Architectural Decisions & Trade-Offs

### 1. Monotonic ULID vs UUIDv4
- **Decision**: Primary keys for messages use ULIDs (Universally Unique Lexicographically Sortable Identifiers) generated via `ulidx`.
- **Rationale**: Standard UUIDv4 values cause index fragmentation in B-Tree indexes and require a separate `createdAt` column sort that can suffer from timestamp collisions. ULIDs embed millisecond timestamps in the most significant bits and are monotonically sortable, enabling efficient cursor pagination (`WHERE id < :cursor ORDER BY id DESC LIMIT 50`).

### 2. JWT Access Tokens + Rotating Refresh Tokens with Family Reuse Detection
- **Decision**: 15-minute access tokens delivered via JSON response paired with 7-day rotating refresh tokens in `httpOnly, SameSite=Strict` cookies.
- **Rationale**: If a refresh token is leaked or intercepted, any attempt by an attacker to reuse an already-rotated token triggers **Token Family Invalidation**, instantly revoking all active sessions for that user across all devices.

### 3. Presence Heartbeats with Redis Sets
- **Decision**: Client sends `presence:heartbeat` every 25 seconds; Redis sets store user socket IDs with a 60-second TTL.
- **Rationale**: Rather than updating PostgreSQL on every connection ping (which would overload the relational database), presence is kept strictly in Redis. When a user opens multiple tabs, their first connected socket emits `online`; only when their last open tab disconnects is `offline` broadcast.

### 4. Magic-Byte Sniffing & Storage Fallback
- **Decision**: Attachments uploaded to `/api/v1/uploads` are analyzed using `file-type` inspecting the binary buffer header rather than trusting client-supplied `Content-Type`.
- **Rationale**: Prevents malicious executable uploads disguised as `.png` or `.jpg`. For resilient local development and testing, an automated fallback stores files on local disk if MinIO/S3 is offline.

### 5. PostgreSQL Full-Text Search vs Elasticsearch
- **Decision**: PostgreSQL native `to_tsvector('english', body)` with a GIN index and headline extraction (`ts_headline`).
- **Rationale**: Eliminates the operational complexity of maintaining a separate search cluster (e.g. Elasticsearch/OpenSearch) and prevents sync discrepancies between the primary database and search index.

---

## ☁️ Production Cloud Deployment Guide

### Option 1: Railway / Render (Recommended for quick deployment)
1. **Provision Managed PostgreSQL & Redis**:
   - Create a PostgreSQL database and Redis instance in your Railway/Render project.
   - Attach storage bucket (AWS S3 or Cloudflare R2).
2. **Deploy Server**:
   - Point Git repository to `realtime-chat`.
   - Set Root Directory to `apps/server` or build via Dockerfile.
   - Configure environment variables (`DATABASE_URL`, `REDIS_URL`, `JWT_ACCESS_SECRET`, `S3_*`).
3. **Deploy Web**:
   - Set Root Directory to `apps/web`.
   - Set Build Command to `npm run build` and Publish Directory to `dist`.
   - Set `VITE_API_URL` to your backend server URL.

### Option 2: AWS ECS / Fargate (Enterprise)
1. Push Docker images (`apps/server/Dockerfile` and `apps/web/Dockerfile`) to AWS ECR.
2. Deploy PostgreSQL via Amazon RDS with Multi-AZ and Redis via Amazon ElastiCache.
3. Use Application Load Balancer (ALB) with sticky sessions enabled for WebSocket connections (`/socket.io/*`).
4. Attach S3 bucket with IAM role authentication (no hardcoded keys).

---

## 📝 Assumptions & Defaults
1. **Authentication**: Email or username is accepted for login; username must be alphanumeric (3-32 characters).
2. **Channel Types**: Public channels can be joined by any authenticated user; private channels require an explicit invite from an Owner or Admin.
3. **Mute Durations**: Preset options are 15 minutes, 1 hour, or 24 hours (or custom integer in minutes).
4. **Local Fallback**: If MinIO or S3 credentials are not configured, uploads save safely to `apps/server/uploads/` with full URL routing.
