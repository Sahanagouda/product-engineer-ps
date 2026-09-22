# Product Engineering Challenge Submission

## Candidate

* **Name:** Sahana Gouda
* **Email:** [sahanagouda01234@gmail.com](mailto:sahanagouda01234@gmail.com)
* **GitHub:** https://github.com/Sahanagouda
* **Selected problem:** Problem 1 — Resumable Realtime Conversation
* - **Demo video:** https://drive.google.com/file/d/1vlbQiIfcZXi0pqa0wSl6UlG0PU3rUHo5/view?usp=sharing

## Run the project

### Prerequisites

* Node.js 20+
* npm

### Setup

From the project root:

```bash
cd solution/backend
npm install
npm run dev
```

The backend starts on:

```text
http://localhost:3000
```

No environment variables are required for the submitted implementation.

### Health check

```bash
curl http://localhost:3000/health
```

Observed result:

```json
{"status":"ok","message":"Resumable conversation backend is running"}
```

### Successful scenario

Create a conversation run:

```bash
curl -X POST http://localhost:3000/conversations/demo/runs
```

The server returns a `runId` and starts generating the response events.

A reviewer can then inspect persisted events with:

```bash
curl http://localhost:3000/conversations/demo/events
```

The submitted implementation persists generated conversation events in SQLite.

### Recovery / resume scenario

The implementation supports resuming an event stream from an event cursor.

For example, after creating a run, use the returned `runId` and reconnect after event 10:

```bash
curl -N "http://localhost:3000/conversations/demo/stream?afterEventId=run-<RUN_ID>-event-10"
```

For the verified run used during testing:

```bash
curl -N "http://localhost:3000/conversations/demo/stream?afterEventId=run-1790092360613-event-10"
```

Observed behavior: the server replayed events 11 through 30 in order, without replaying event 10.

This demonstrates that a disconnected/reconnected client can resume from its last known event cursor.

The run status can be checked with:

```bash
curl http://localhost:3000/conversations/demo/runs/<RUN_ID>
```

For the verified run, the observed final state was:

```json
{
  "runId": "run-1790092360613",
  "conversationId": "demo",
  "status": "completed",
  "createdAt": "2026-09-22T15:52:40.613Z",
  "updatedAt": "2026-09-22T15:52:43.900Z"
}
```

## Run the tests

From `solution/backend`:

```bash
npm test
```

Observed result:

```text
Test Files  5 passed (5)
Tests       5 passed (5)
```

The five verified test areas are:

* Fake response generation
* Duplicate event handling
* Run state
* Event replay
* Event persistence/service behavior

## Acceptance scenarios and verification

The submitted implementation covers the core resumable realtime conversation behavior:

1. **Run creation**

   * A conversation run can be created through the API.
   * A run starts in the `running` state.

2. **Ordered event generation**

   * A run generates 30 response events.
   * Event IDs follow the run-specific ordered sequence.

3. **Event persistence**

   * Generated events are stored in SQLite.
   * Stored events remain available through the conversation events endpoint.

4. **Realtime streaming**

   * Events are exposed through an SSE stream.

5. **Reconnect / resume**

   * A client can provide the ID of its last received event.
   * The server replays events after that cursor.
   * The verified recovery scenario resumed after event 10 and returned events 11–30 in order.

6. **Duplicate event handling**

   * Duplicate event IDs are ignored through the persistence layer.

7. **Run state**

   * Successful generation transitions the run to `completed`.
   * Generation failures can transition the run to `failed`.

8. **Persistence across server lifecycle**

   * Conversation events are stored in SQLite rather than only being held in process memory.

### Problem-specific benchmark

From `solution/backend`:

```bash
npm run benchmark
```

Observed result:

```text
Total events: 30
Events ordered: true
Benchmark passed
```

The benchmark therefore verified 30 generated events with the expected ordering.

### Failure / recovery scenario demonstrated

The demo demonstrates recovery through an event cursor.

The reviewer can reproduce it by:

1. Creating a run.
2. Obtaining the run ID.
3. Connecting to the SSE stream using an event cursor such as event 10.
4. Observing that events after the cursor are replayed.
5. Confirming that event 11 is the first replayed event and that the sequence continues through event 30.

The verified demonstration used:

```text
afterEventId=run-1790092360613-event-10
```

and produced events 11–30 in order.

## Architecture and data flow

The implementation is a Node.js/TypeScript backend using Express, SQLite, SSE, and a deterministic fake response generator.

The main flow is:

```text
Client
  |
  | POST /conversations/:conversationId/runs
  v
Run service
  |
  v
Fake response generator
  |
  | generate ordered events
  v
Event persistence
  |
  v
SQLite
  |
  +----------------------+
  |                      |
  | GET events            | SSE stream
  v                      v
Stored event history   Connected clients
                         |
                         | reconnect with
                         | afterEventId
                         v
                    Replay events after
                    the client's cursor
```

### Main components

* **Express API**

  * Exposes run, event, and stream endpoints.

* **Run service**

  * Creates runs and tracks their lifecycle.

* **Fake response generator**

  * Produces a deterministic sequence of 30 response events.
  * This keeps the challenge focused on realtime delivery, persistence, and recovery behavior.

* **SQLite persistence**

  * Stores runs and conversation events.
  * Event IDs are unique to prevent duplicate persistence.

* **SSE streaming**

  * Streams newly generated events to connected clients.
  * Supports replay using `afterEventId`.

* **Event/replay service**

  * Retrieves persisted events after a supplied cursor.
  * Tracks already-delivered IDs for a connected client.

## Technology choices

### Node.js + TypeScript

TypeScript provides static typing while Node.js is well suited to lightweight realtime HTTP/SSE services.

### Express

Express keeps the HTTP API small and explicit, which is appropriate for a focused engineering challenge.

### SQLite

SQLite provides durable local persistence without requiring a separate database service. This makes the prototype easy for a reviewer to run and inspect.

For production at larger scale, a server-side database such as PostgreSQL would be more appropriate.

### Server-Sent Events

SSE was chosen because the problem requires server-to-client realtime event delivery. It provides a simple HTTP-based streaming mechanism while allowing the persistent event log to remain the source of truth for reconnect/replay.

### Vitest

Vitest provides fast deterministic automated tests for the core services and recovery behavior.

## Important decisions

### 1. Persist events before relying on realtime delivery

The event store is treated as the durable source of truth. This means a reconnecting client can recover events from SQLite rather than depending on the original network connection remaining alive.

### 2. Use event cursors for resume

The client can reconnect with `afterEventId`. The server uses that cursor to replay only events that come after the client's last known event.

This avoids requiring the client to restart the entire conversation when a connection is interrupted.

### 3. Use unique event IDs

Each generated event has a run-specific event ID such as:

```text
run-<runId>-event-1
run-<runId>-event-2
...
run-<runId>-event-30
```

The database uniqueness constraint and duplicate handling prevent the same event ID from being persisted more than once.

## Assumptions and limitations

* The assistant response is simulated using a deterministic fake generator rather than a real LLM.
* The prototype uses SQLite for simplicity and local reproducibility.
* SSE is used for realtime delivery.
* The implementation supports explicit cursor-based reconnect/replay.
* **Production-grade automatic interrupted-run recovery is not implemented.** If the server process itself is interrupted while generating a run, the submitted implementation does not automatically restart that unfinished generation.
* The implementation therefore demonstrates durable event persistence and reconnect/replay, but not a production-grade distributed job recovery system.
* Authentication, authorization, rate limiting, horizontal scaling, and production observability are outside the scope of this prototype.

## Production and scale

For production or significantly greater scale, the first changes would be:

1. **Move persistence from SQLite to PostgreSQL**

   * This would support concurrent application instances and stronger production database capabilities.

2. **Introduce a durable background job/queue system**

   * Run generation could be represented as a durable job so an interrupted worker can resume or retry unfinished work.

3. **Separate realtime delivery from generation**

   * Workers would generate and persist events independently from SSE connections.
   * Clients could reconnect to any application instance and replay from the durable event store.

4. **Add production observability**

   * Structured logging, metrics, tracing, connection monitoring, and alerts would make failures easier to diagnose.

5. **Add authentication and authorization**

   * Conversation and run access would need to be scoped to authenticated users.

These are proposed production improvements; the submitted implementation currently uses a single Node.js process, SQLite, and in-process realtime client tracking.

## AI usage

ChatGPT was used during development to help interpret the challenge requirements, troubleshoot the local setup, verify API behavior, and review/document the implementation and submission steps.

The implementation was manually run and verified locally. The health endpoint, API behavior, automated tests, recovery/replay behavior, run state, and benchmark were executed and checked during the submission process.



## Credibility note

I do not have a previously shipped product or system to provide for this section. This challenge submission demonstrates my current engineering work, including implementation, testing, documentation, and verification of a resumable realtime conversation backend.
