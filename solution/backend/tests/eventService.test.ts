import { describe, it, expect } from "vitest";
import { saveEvent, getEvents } from "../src/services/eventService.js";

describe("Event Service", () => {
  it("saves and retrieves an event", () => {
    const event = {
      conversationId: "test-persistence",
      eventId: "event-unique-1",
      eventType: "message",
      payload: { text: "Hello persistence" },
      createdAt: new Date().toISOString(),
    };

    saveEvent(event);

    const events = getEvents("test-persistence");

    expect(events).toHaveLength(1);
    expect(events[0].eventId).toBe("event-unique-1");
    expect(events[0].payload).toEqual({ text: "Hello persistence" });
  });
});
