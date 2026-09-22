import db from "../db/database.js";

export interface ConversationEvent {
  conversationId: string;
  eventId: string;
  eventType: string;
  payload: unknown;
  createdAt: string;
}

export function saveEvent(event: ConversationEvent) {
  const statement = db.prepare(`
    INSERT OR IGNORE INTO events (
      conversation_id,
      event_id,
      event_type,
      payload,
      created_at
    )
    VALUES (?, ?, ?, ?, ?)
  `);

  const result = statement.run(
    event.conversationId,
    event.eventId,
    event.eventType,
    JSON.stringify(event.payload),
    event.createdAt
  );

  return result.changes > 0;
}

export function getEvents(conversationId: string) {
  const statement = db.prepare(`
    SELECT
      conversation_id AS conversationId,
      event_id AS eventId,
      event_type AS eventType,
      payload,
      created_at AS createdAt
    FROM events
    WHERE conversation_id = ?
    ORDER BY id ASC
  `);

  const events = statement.all(conversationId) as Array<{
    conversationId: string;
    eventId: string;
    eventType: string;
    payload: string;
    createdAt: string;
  }>;

  return events.map((event) => ({
    ...event,
    payload: JSON.parse(event.payload),
  }));
}