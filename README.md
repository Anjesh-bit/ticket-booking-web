# Ticket Booking System

A full-stack concert ticket booking application built with React + TypeScript (frontend) and Node.js + TypeScript (backend), backed by PostgreSQL and Redis. Built as a take-home assignment for CyberArrow.

---

## Repository Structure

This is a monorepo managed with npm workspaces. Both frontend and backend live in the same repository but are completely independent packages — each has its own `package.json`, `tsconfig.json`, ESLint config, and Docker setup.

```
ticket-booking/
  server/          Node.js + Express backend
  client/          React + Vite frontend
  scripts/         Git hook scripts (branch validation)
  .husky/          pre-commit, commit-msg, pre-push hooks
  .github/
    workflows/
      server.yml   CI triggers only on server/** changes
      client.yml   CI triggers only on client/** changes
  docker-compose.yml
  docker-compose.dev.yml
  docker-compose.prod.yml
  package.json     workspace root
```

### Why a monorepo

A single repository with shared commit history makes it easy to coordinate changes across frontend and backend. The GitHub Actions workflows use path filters so a change to `client/` only runs the client CI pipeline and server CI is untouched. This gives the isolation of a polyrepo without the overhead of managing multiple repositories for a two-package project.

### npm workspaces

Running `npm install` at the root installs dependencies for all packages. npm hoists shared packages to root `node_modules` to avoid duplication.

```bash
npm install       # installs root + server + client deps
npm run dev       # runs server and client concurrently
npm run build     # builds both packages
npm run lint      # lints both packages
```

---

## Tech Stack

| Layer          | Technology                              |
| -------------- | --------------------------------------- |
| Frontend       | React 19, TypeScript, Vite, CSS Modules |
| Backend        | Node.js, Express 5, TypeScript          |
| Database       | PostgreSQL 16                           |
| Cache          | Redis 7                                 |
| Infrastructure | Docker, Docker Compose                  |

---

## Getting Started

### Prerequisites

- Docker Desktop
- Node.js 20+
- npm 10+

### Run with Docker (recommended)

```bash
# 1. Clone the repo
git clone https://github.com/Anjesh-bit/ticket-booking-web.git
cd ticket-booking-web

# 2. Create root env file
cp .env.example .env

# 3. Install all dependencies
npm install

# 4. Build and start all services
npm run docker:dev:build
```

Open http://localhost:3000 and the app is ready.

### Run locally without Docker

You will need Postgres and Redis running locally, then:

```bash
npm install
npm run dev
```

### Environment files

| File                      | Purpose                                                       |
| ------------------------- | ------------------------------------------------------------- |
| `.env`                    | Postgres credentials for Docker Compose variable substitution |
| `server/.env.development` | Server runtime config (DATABASE_URL, Redis, port)             |
| `client/.env.development` | Client config (VITE_API_URL)                                  |

```bash
cp server/.env.example server/.env.development
cp client/.env.example client/.env.development
```

---

## Available Scripts

```bash
# Development
npm run dev                # server + client concurrently (local)
npm run dev:server         # server only
npm run dev:client         # client only

# Docker
npm run docker:dev         # start all services with watch mode
npm run docker:dev:build   # rebuild images and start
npm run docker:down        # stop all containers
npm run docker:clean       # stop containers and wipe volumes

# Code quality
npm run build              # build both packages
npm run lint               # lint both packages
npm run type-check         # type check server
```

---

## API Endpoints

### Concerts

```
GET  /api/concerts        all concerts with tiers (cached 5 minutes)
GET  /api/concerts/:id    single concert with tiers (cached 5 minutes)
```

### Bookings

```
POST /api/bookings        create a booking
GET  /api/bookings/:id    get booking by ID
```

**POST /api/bookings request body**

```json
{
  "tier_id": "uuid",
  "quantity": 2,
  "idempotency_key": "client-generated-uuid",
  "user_identifier": "optional"
}
```

**Tier pricing**

| Tier              | Price |
| ----------------- | ----- |
| VIP               | $100  |
| Front Row         | $50   |
| General Admission | $10   |

---

## Preventing Double-Booking

This was the most critical part of the system. Here is the problem, what I considered, and what I went with.

### The problem

Two users try to book the last VIP ticket at the same time. Without any protection:

```
User A reads:  available_seats = 1
User B reads:  available_seats = 1   (both read before either writes)

User A books: available_seats = 0
User B books: available_seats = 0    oversold
```

Both users saw 1 seat available because neither had committed their write yet. Classic race condition.

### Options considered

**Optimistic locking**

Add a `version` column. When updating, check the version has not changed since you read it. If it has, someone else got there first and you retry.

```sql
UPDATE ticket_tiers
SET available_seats = available_seats - 1, version = version + 1
WHERE id = $1 AND version = $2
```

Works well when conflicts are rare. For ticket booking, conflicts happen constantly. Under load you get retry storms that are wasteful and unpredictable.

**Distributed locking with Redis**

Use Redis `SET NX` as a lock across multiple server instances:

```typescript
const lock = await redis.set(`lock:tier:${tierId}`, "1", "NX", "EX", 5);
if (!lock) throw new Error("Try again");
// book the ticket
await redis.del(`lock:tier:${tierId}`);
```

Works across multiple servers. But if the server crashes after booking and before releasing the lock, the ticket stays locked for 5 seconds. Short TTLs and retry logic help but it adds complexity that is not needed when Postgres can handle this natively.

**Pessimistic locking with SELECT FOR UPDATE (chosen approach)**

Tell Postgres to lock the row exclusively for the duration of the transaction:

```sql
BEGIN;

SELECT * FROM ticket_tiers WHERE id = $1 FOR UPDATE;
-- row is locked, no other transaction can read or write it until we commit

UPDATE ticket_tiers SET available_seats = available_seats - $quantity WHERE id = $1;
INSERT INTO bookings (...) VALUES (...);

COMMIT; -- lock released
```

With this in place:

```
User A acquires lock, checks seats (1), deducts, commits, releases lock
User B waits for lock, re-reads seats (0), rejected with "not enough seats"
```

No race condition. No overselling. The database enforces correctness directly.

### Idempotency

Locking does not help when a user double-clicks or retries after a network drop. Every booking request includes a client-generated UUID as `idempotency_key`. The server checks for it before acquiring any lock:

```typescript
const existing = await client.query("SELECT * FROM bookings WHERE idempotency_key = $1", [
  data.idempotency_key,
]);
if (existing.rows[0]) return existing.rows[0]; // return original, do not create duplicate
```

The column also has a `UNIQUE` constraint at the database level so even if two requests slip through simultaneously, Postgres rejects one of them.

### Database constraints as a safety net

```sql
available_seats INT NOT NULL CHECK (available_seats >= 0)
idempotency_key TEXT UNIQUE NOT NULL
```

Three layers in total: application logic, pessimistic lock, and database constraints.

---

## Caching Strategy

Concert data is read far more than it changes. Redis is used with a Cache-Aside (read-through on miss) pattern for reads.

```
Request comes in
  check Redis first
  HIT  — return cached data, no database query
  MISS — query Postgres, store in Redis, return data
```

| Endpoint              | TTL      | Reason                               |
| --------------------- | -------- | ------------------------------------ |
| GET /api/concerts     | 5 min    | Concert data rarely changes          |
| GET /api/concerts/:id | 5 min    | Same                                 |
| POST /api/bookings    | no cache | Must always hit DB with a fresh lock |

After a successful booking the concert cache is invalidated so the next request shows updated seat counts:

```typescript
if (paymentStatus === "success") {
  await cacheStrategy.delete(`concert:${tier.concert_id}`);
}
```

---

## Design Decisions and Trade-offs

**Pessimistic over optimistic locking** — ticket booking is high-contention by nature. Optimistic locking shines when conflicts are rare. Retry storms from optimistic under high load would be worse than the queuing from pessimistic.

**Payment simulation inside the transaction** — works for this project. In production, real payment provider calls should happen outside the transaction because they are slow and you do not want to hold a DB lock while waiting for an external HTTP call.

**Redis for cache only** — Redis is used for caching here, not as a queue. At higher scale a proper message queue makes more sense, discussed below.

---

## Scaling Discussion

### 99.99% Availability

99.99% means roughly 52 minutes of downtime per year. A single server cannot achieve that.

**Multi-region deployment**

Deploy to at least two AWS regions. Use Route53 with latency-based routing and health checks — if one region goes down, traffic fails over to the healthy one automatically.

**Database high availability**

RDS PostgreSQL Multi-AZ keeps a synchronous standby in a separate availability zone. Failover is automatic and takes about 30 seconds. Read replicas handle concert catalog queries — writes go to the primary, reads go to replicas.

**Application tier**

Stateless Node.js containers behind an Application Load Balancer. Auto-scaling adds instances when CPU is high and removes them during off-peak. ALB health checks pull unhealthy instances out of rotation automatically.

**Cache high availability**

Redis Cluster with replicas and Sentinel for automatic failover. If Redis goes down entirely, cache-aside falls back to Postgres. The application degrades gracefully rather than breaking completely.

---

### Handling 50K Concurrent Users with p95 Under 500ms

#### Availability under concurrent load

When 50K users hit simultaneously, the first thing that breaks is the DB connection pool. All connections are in use, new requests queue up, timeouts cascade, and the app starts returning errors. This is an availability problem under load, not just a performance one.

Mitigations:

**Circuit breaker** — if DB response time exceeds a threshold, stop sending requests and return a graceful error immediately instead of letting everything queue up and timeout. Prevents a slow DB from taking down the entire app.

**Load shedding** — deliberately reject requests with 503 when the system is at capacity. A fast rejection is better than a slow timeout. Users can retry; timeouts just make everything worse.

**Request queuing at the application level** — accept the request, put it in a queue, respond with 202 Accepted, process it asynchronously. Users get an instant response and the system processes bookings at a rate it can handle.

---

#### Fix 1 — Indexes first

Before adding any infrastructure, check whether Postgres is doing sequential scans. Without indexes Postgres scans the whole table on every booking query.

```sql
CREATE INDEX idx_ticket_tiers_concert_id ON ticket_tiers(concert_id);
CREATE INDEX idx_bookings_idempotency_key ON bookings(idempotency_key);
CREATE INDEX idx_bookings_tier_id ON bookings(tier_id);
```

A missing index can take a query from 200ms to 2ms. Always check this before adding hardware.

---

#### Fix 2 — Connection pooling with PgBouncer

Each Node.js instance holds a pool of Postgres connections. Across multiple app instances you can exhaust Postgres's connection limit quickly. PgBouncer multiplexes thousands of app connections into a small number of actual DB connections.

```
50K users -> app instances -> PgBouncer -> 100 Postgres connections
```

Without this you get connection errors under load regardless of how much hardware you throw at it.

---

#### Fix 3 — Horizontal scaling and Node.js clustering

Node.js runs on a single thread. On a machine with 8 CPU cores, 7 sit idle. The cluster module spawns one worker per core:

```
Master Process
  Worker 1  (core 1)
  Worker 2  (core 2)
  Worker 3  (core 3)
  Worker 4  (core 4)
        |
   PostgreSQL
```

```typescript
if (cluster.isPrimary) {
  os.cpus().forEach(() => cluster.fork());
  cluster.on("exit", () => cluster.fork()); // auto-restart crashed workers
} else {
  await startServer();
}
```

In a containerised setup, run multiple container replicas and let Kubernetes HPA scale them based on CPU or request rate. Each worker has its own connection pool — 8 workers x 10 connections = 80 Postgres connections — which is exactly why PgBouncer is needed.

---

#### Fix 4 — Background jobs for reads and writes

**Read path — cache pre-warming**

Instead of every request hitting Postgres on a cache miss, a background job pre-warms the cache on a schedule:

```
Background job runs every 30 seconds
  SELECT * FROM concerts JOIN ticket_tiers
  write results to Redis
  all reads hit Redis, Postgres is never touched during peak
```

This gives a near 100% cache hit rate during high traffic instead of relying on lazy population.

**Write path — async booking processing**

Instead of writing to Postgres synchronously on every booking:

```
POST /bookings
  validate request
  decrement Redis seat counter atomically (instant, microseconds)
  push booking to RabbitMQ queue
  return 202 Accepted to user immediately

Background worker
  consumes from queue
  writes to Postgres in batches
  sends confirmation to user via websocket or email
```

The user gets a fast response. The database write happens at a rate the system can handle.

---

#### Fix 5 — Caching patterns at scale

**Write-through**

Write to both cache and database synchronously before responding. Cache and DB are always consistent. Slightly higher write latency since you wait for both, but no risk of stale data.

```
POST /bookings
  write to Redis AND Postgres
  both succeed before responding to user
  cache is always consistent with DB
```

This is the safer starting point for ticket booking because consistency matters more than write speed.

**Write-behind (write-back)**

Write to cache only, respond immediately, sync to DB asynchronously via a background job. Faster writes but the cache and DB are briefly inconsistent. If the app crashes before the background job runs, you lose data. Needs the outbox pattern below to be safe.

---

#### Fix 6 — Transactional Outbox Pattern

The async write approach has a dangerous failure mode. If the app writes to the queue and then crashes before writing to the DB, the booking is lost:

```
1. Decrement Redis seats    success
2. App crashes here
3. Write to RabbitMQ        never happens
4. Postgres never updated
```

The outbox pattern fixes this by recording the event in the same database transaction as the booking:

```sql
BEGIN;
  INSERT INTO bookings (tier_id, quantity, ...) VALUES (...);
  INSERT INTO outbox (event_type, payload, processed) VALUES ('booking_created', '...', false);
COMMIT;
-- either both succeed or both fail, no partial state
```

A background worker polls the outbox table, publishes events to RabbitMQ, and marks rows as processed. If the worker crashes it just re-reads unprocessed rows on restart. No data loss, guaranteed delivery.

```
Background worker
  SELECT * FROM outbox WHERE processed = false
  publish to RabbitMQ
  UPDATE outbox SET processed = true WHERE id = $1
```

---

#### Fix 7 — Redis atomic counter for maximum throughput

For the highest possible throughput, move seat availability out of Postgres and into Redis entirely:

```typescript
// DECR is atomic in Redis, no lock needed, runs in microseconds
const remaining = await redis.decr(`seats:${tierId}`);
if (remaining < 0) {
  await redis.incr(`seats:${tierId}`); // give the seat back
  throw new Error("Sold out");
}
// seat reserved in Redis, write booking to Postgres via outbox async
```

`DECR` is atomic at the Redis instance level. No two operations can interleave. Sub-millisecond seat reservation with effectively unlimited throughput. The Postgres write happens asynchronously via the outbox pattern described above. This is how high-traffic ticketing platforms handle their hottest events.

---

#### Summary

| Concurrent users | Approach                                                                   |
| ---------------- | -------------------------------------------------------------------------- |
| Under 1K         | Current setup — Postgres with SELECT FOR UPDATE                            |
| 1K to 10K        | PgBouncer, read replicas, Redis cache                                      |
| 10K to 50K       | Horizontal scaling, Node.js clustering, indexes, circuit breaker           |
| 50K and above    | RabbitMQ queue, write-through cache, transactional outbox, background jobs |
| 100K and above   | Redis atomic counter, async DB writes via outbox, multi-region             |

---

## Project Structure

```
ticket-booking/
  server/
    src/
      cache/          Redis client and Cache-Aside strategy
      config/         env, Redis, Winston config
      connections/    Postgres pool, Redis connection
      constants/      HTTP status codes, Postgres error codes
      controllers/    thin request handlers
      db/             init.sql schema and seed data
      middlewares/    error handler, cache, validation
      routes/         Express routers
      services/       booking, concert, payment logic
      types/          TypeScript interfaces
      utils/          error classification, logging
  client/
    src/
      features/
        concerts/     types, API calls, hooks, components
        booking/      types, API calls, hooks, components
      shared/         axios client, shared UI components
      pages/          CatalogPage, BookingPage
      app/            App shell, router
```

---

## Author

Anjesh Ghimire
