import { describe, it, expect } from "vitest";
import { saveEvent, getEvents } from "../src/services/eventService.js";

describe("SSE Replay Logic", () => {
  it("retrieves events after a cursor in order", () => {
    const conversationId = "replay-" + Date.now();

    for (let i = 1; i <= 5; i++) {
      saveEvent({
        conversationId,
        eventId: `${conversationId}-event-${i}`,
        eventType: "message",
        payload: { text: `Event ${i}` },
        createdAt: new Date().toISOString(),
      });
    }

    const events = getEvents(conversationId);

    const cursorIndex = events.findIndex(
      (event) => event.eventId === `${conversationId}-event-2`
    );

    const replayedEvents = events.slice(cursorIndex + 1);

    expect(replayedEvents).toHaveLength(3);
    expect(replayedEvents[0].eventId).toBe(`${conversationId}-event-3`);
    expect(replayedEvents[2].eventId).toBe(`${conversationId}-event-5`);
  });
});
