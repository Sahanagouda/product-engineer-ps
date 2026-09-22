import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { saveEvent } from "../src/services/eventService.js";

describe("Duplicate Event Protection", () => {
  it("ignores duplicate event IDs", () => {
    const event = {
      conversationId: "test-duplicate-" + randomUUID(),
      eventId: "event-" + randomUUID(),
      eventType: "message",
      payload: { text: "Duplicate test" },
      createdAt: new Date().toISOString(),
    };

    const firstSave = saveEvent(event);
    const secondSave = saveEvent(event);

    expect(firstSave).toBe(true);
    expect(secondSave).toBe(false);
  });
});
