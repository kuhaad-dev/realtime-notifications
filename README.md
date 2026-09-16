# Event-Driven Real-Time Notification Service

[![CI](https://github.com/kuhaad-dev/realtime-notifications/actions/workflows/ci.yml/badge.svg)](https://github.com/kuhaad-dev/realtime-notifications/actions)
![NestJS](https://img.shields.io/badge/NestJS-11.x-E0234E?logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.0-336791?logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7.x-DC382D?logo=redis&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?logo=socketdotio&logoColor=white)
![BullMQ](https://img.shields.io/badge/BullMQ-5.x-orange)
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

A scalable, fault-tolerant **Event-Driven Notification Service** built with NestJS, PostgreSQL, Redis, Socket.IO, and BullMQ. Features secure **webhook ingestion with timing-safe HMAC-SHA256 signature verification**, **distributed Redis idempotency deduplication**, a **resilient BullMQ queue with exponential backoff retries**, and **horizontally scalable real-time WebSocket delivery via the Socket.IO Redis Streams adapter**.

---

## Architectural Highlights

- **Cryptographically Secure Webhook Ingestion**: Validates timing-safe HMAC-SHA256 signatures (`crypto.timingSafeEqual`) on raw body buffers with tolerance-window timestamp checks to prevent replay attacks.
- **Distributed Idempotency-Key Deduplication**: Uses atomic Redis lock predicates (`SETNX` with TTL) and response memoization to guarantee exactly-once processing across high-frequency duplicate requests.
- **Resilient BullMQ Job Queues**: Configured with exponential backoff retry policies (`attempts: 5`, initial delay: 2s) and Dead-Letter Queue (DLQ) retention for failed deliveries.
- **Horizontal WebSocket Scaling**: Uses `@socket.io/redis-adapter` to distribute room broadcasting across multiple Node.js cluster processes and Kubernetes pods, allowing clients connected to different server instances to receive real-time events without dropped packets.
- **Persistent Delivery Audit Trail**: PostgreSQL 16 schema capturing comprehensive event logs (`NotificationLog`, `WebhookEvent`, `DeviceSubscription`) with composite indexing for sub-millisecond retrieval.

---

## System Architecture

```mermaid
flowchart TD
    WebhookSource([External Webhooks: Stripe / GitHub]) --> Ingress[NestJS Ingress Controller]
    
    subgraph Security & Deduplication
        Ingress --> HMAC[HMAC-SHA256 Timing-Safe Guard]
        HMAC --> Idemp[Redis Idempotency Interceptor]
        Idemp -->|Atomic SETNX| RedisLock[(Redis Cache / Idempotency Locks)]
    end

    subgraph Asynchronous Queue Pipeline
        Idemp -->|Enqueue Delivery Job| BullQueue[(BullMQ Queue)]
        Idemp -->|Write Audit Log| PG[(PostgreSQL 16 Database)]
        BullQueue --> Worker[BullMQ Delivery Worker Pool]
        Worker -->|Update Status & Retry on Error| PG
    end

    subgraph Horizontally Scaled Real-Time Delivery
        Worker --> Gateway[Socket.IO Gateway]
        Gateway <-->|Redis Pub/Sub Adapter| RedisStream[(Redis Adapter Bus)]
        RedisStream <--> Node1[Node Server Instance 1]
        RedisStream <--> Node2[Node Server Instance 2]
        Node1 --> ClientA([Connected Web Client])
        Node2 --> ClientB([Connected Mobile Client])
    end
```

---

## Webhook Ingestion & Deduplication Flow

```mermaid
sequenceDiagram
    autonumber
    actor Webhook as External Webhook Provider
    participant Guard as HMAC Signature Guard
    participant Interceptor as Redis Idempotency Interceptor
    participant Queue as BullMQ Job Queue
    participant DB as PostgreSQL Database

    Webhook->>Guard: POST /notifications/webhook (x-signature, rawBody)
    Note over Guard: Compute HMAC-SHA256 & timingSafeEqual
    Guard-->>Interceptor: Signature Verified OK

    Interceptor->>Interceptor: Check Redis key: idempotency:{key}
    alt Key already exists (Duplicate Request)
        Interceptor-->>Webhook: 200 OK (Cached / Duplicate Acknowledged)
    else First Time Request
        Interceptor->>Interceptor: SET idempotency:{key} IN_FLIGHT EX 86400
        Interceptor->>DB: INSERT INTO webhook_events & notification_logs
        Interceptor->>Queue: Enqueue notification (attempts: 5, backoff: exp)
        Interceptor-->>Webhook: 202 Accepted (Enqueued)
    end
```

---

## REST & WebSocket API Reference

### HTTP Endpoints

| Method | Endpoint | Description | Headers |
|---|---|---|---|
| `POST` | `/notifications/webhook` | Ingest external webhook | `x-signature`, `x-timestamp` |
| `POST` | `/notifications/dispatch` | Manually dispatch notification | `Idempotency-Key` (optional) |
| `GET` | `/notifications/logs` | Fetch delivery audit logs | Query: `recipientId` |
| `GET` | `/notifications/metrics` | Real-time WebSocket connection count | None |

Interactive OpenAPI documentation is hosted at `http://localhost:3001/api/docs`.

### WebSocket Events (`/notifications` Namespace)

| Event | Direction | Payload | Description |
|---|---|---|---|
| `subscribe_channel` | Client -> Server | `{ "channel": "orders:123" }` | Join a specific pub/sub channel |
| `unsubscribe_channel`| Client -> Server | `{ "channel": "orders:123" }` | Leave a channel |
| `notification` | Server -> Client | `{ "notificationId", "title", "payload" }` | Real-time delivery payload |
| `[eventType]` | Server -> Client | Custom typed payload | Direct event-type specific payload |

---

## Local Setup & Quickstart

### Prerequisites
- Node.js 22+
- Docker & Docker Compose

### 1. Clone & Install
```bash
git clone https://github.com/kuhaad-dev/realtime-notifications.git
cd realtime-notifications
npm install
```

### 2. Start PostgreSQL & Redis
```bash
docker compose up -d postgres redis
```

### 3. Run Application
```bash
# Development mode
npm run start:dev

# Production build
npm run build
npm run start:prod
```

### 4. Run Automated Tests
```bash
# Unit test suite
npm run test

# End-to-end delivery & deduplication tests
npm run test:e2e
```

---

## Author

**Mayank Kuhaad**
- GitHub: [@kuhaad-dev](https://github.com/kuhaad-dev)
- Email: [mayankkuhaad@gmail.com](mailto:mayankkuhaad@gmail.com)
- LinkedIn: [linkedin.com/in/mayank-kuhaad](https://linkedin.com/in/mayank-kuhaad)