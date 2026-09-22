# Resumable Realtime Conversation

## Implementation Documentation

### 1. Overview

This project implements a resumable realtime conversation backend using Node.js, Express, TypeScript, SQLite, and Server-Sent Events (SSE).

The backend generates fake assistant responses, stores events persistently, and allows clients to reconnect using an event cursor.

### 2. Technologies

- Node.js
- TypeScript
- Express
- SQLite
- better-sqlite3
- Server-Sent Events (SSE)
- Vitest

### 3. Implemented Features

- Generate 30 ordered response events
- Stream events using SSE
- Persist conversation events in SQLite
- Retrieve stored conversation events
- Resume streaming using an event cursor
- Ignore duplicate event IDs
- Track run status
- Preserve stored events after server restart
- Automated tests
- Benchmark for 30 ordered events

### 4. API Endpoints

#### Start a generated run

`POST /conversations/:conversationId/runs`

Starts a fake response generation run.

#### Get run status

`GET /conversations/:conversationId/runs/:runId`

Returns the status of a run.

Possible statuses:

- running
- completed
- failed
- interrupted

#### Retrieve events

`GET /conversations/:conversationId/events`

Returns persisted events for a conversation.

#### Submit an event

`POST /conversations/:conversationId/events`

Stores an individual conversation event.

#### Stream events

`GET /conversations/:conversationId/stream`

Streams conversation events using Server-Sent Events.

Optional cursor:

`?afterEventId=<eventId>`

### 5. Persistence

SQLite stores events and run information.

The events table includes:

- conversation ID
- event ID
- event type
- payload
- creation timestamp

The runs table includes:

- run ID
- conversation ID
- status
- creation timestamp
- update timestamp

SQLite persistence allows stored events to remain available after the server restarts.

### 6. Event Identity and Deduplication

Each event has a unique event ID.

The database uses a UNIQUE constraint on event IDs.

Duplicate events are ignored during insertion.

Connected clients also track delivered event IDs to reduce duplicate delivery during replay and live streaming.

### 7. Event Ordering

Events are persisted in SQLite before they are delivered to connected clients.

Events are retrieved using database insertion order, ensuring that replayed events are returned in the same order in which they were stored.

Each generated run creates sequential event IDs:

`run-<runId>-event-1`

`run-<runId>-event-2`

...

`run-<runId>-event-30`

### 8. Replay and Reconnection

Clients can reconnect using the `afterEventId` cursor.

When a client connects with a cursor, the server:

1. Finds the cursor event in persisted history.
2. Replays events after that event.
3. Registers the client for future live events.
4. Tracks event IDs already delivered to that client.

This allows missed events to be recovered without intentionally replaying the cursor event itself.

Unknown cursors are rejected with an SSE error and the connection is closed.

### 9. Run State

Each generated run is stored in SQLite with a status.

Supported states are:

- running
- completed
- failed
- interrupted

A successful generation changes the run from `running` to `completed`.

Generation errors change the run to `failed`.

The current implementation does not yet provide a production-grade automatic interrupted-run recovery mechanism.

### 10. Testing and Verification

The automated test suite contains five tests covering:

- fake response generation
- event persistence
- duplicate event handling
- run state handling
- replay behavior

Run the tests using:

```bash
npm test