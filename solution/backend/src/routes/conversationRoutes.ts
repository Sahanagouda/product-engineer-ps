import { Router, Response } from "express";
import {
  saveEvent,
  getEvents,
} from "../services/eventService.js";
import {
  createRun,
  getRun,
  updateRunStatus,
} from "../services/runService.js";
import { generateFakeResponse } from "../services/fakeGenerator.js";

const router = Router();

const clients = new Map<string, Set<Response>>();

const sentEventsByClient = new Map<Response, Set<string>>();

// Send an event to connected clients without duplicates
function sendEvent(conversationId: string, event: any) {
  const conversationClients = clients.get(conversationId);

  if (!conversationClients) return;

  for (const client of conversationClients) {
    const sentEventIds = sentEventsByClient.get(client);

    if (!sentEventIds) continue;

    // Prevent duplicate delivery
    if (sentEventIds.has(event.eventId)) {
      continue;
    }

    const message =
      `id: ${event.eventId}\n` +
      `data: ${JSON.stringify(event)}\n\n`;

    client.write(message);

    sentEventIds.add(event.eventId);
  }
}

// Start a fake generated reply
router.post("/:conversationId/runs", async (req, res) => {
  const { conversationId } = req.params;

  const runId = `run-${Date.now()}`;

  createRun(runId, conversationId);

  res.status(201).json({
    runId,
    status: "running",
  });

  const generatedEvents = generateFakeResponse();

  try {
    for (let index = 0; index < generatedEvents.length; index++) {
      const event = {
        conversationId,
        eventId: `${runId}-event-${index + 1}`,
        eventType: "message",
        payload: {
          text: generatedEvents[index],
        },
        createdAt: new Date().toISOString(),
      };

      const saved = saveEvent(event);

      if (saved) {
        sendEvent(conversationId, event);
      }

      await new Promise((resolve) =>
        setTimeout(resolve, 100)
      );
    }

    updateRunStatus(runId, "completed");
  } catch (error) {
    console.error("Run failed:", error);

    updateRunStatus(runId, "failed");
  }
});

// Get run status
router.get("/:conversationId/runs/:runId", (req, res) => {
  const run = getRun(req.params.runId);

  if (!run) {
    return res.status(404).json({
      error: "Run not found",
    });
  }

  res.json(run);
});

// Retrieve stored events
router.get("/:conversationId/events", (req, res) => {
  try {
    const events = getEvents(req.params.conversationId);

    res.json({
      events,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to retrieve events",
    });
  }
});

// Submit an individual event
router.post("/:conversationId/events", (req, res) => {
  try {
    const { conversationId } = req.params;

    const {
      eventId,
      eventType,
      payload,
    } = req.body;

    if (!eventId || !eventType) {
      return res.status(400).json({
        error: "eventId and eventType are required",
      });
    }

    const event = {
      conversationId,
      eventId,
      eventType,
      payload,
      createdAt: new Date().toISOString(),
    };

    const saved = saveEvent(event);

    if (saved) {
      sendEvent(conversationId, event);
    }

    res.status(201).json({
      message: saved
        ? "Event saved successfully"
        : "Duplicate event ignored",
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to save event",
    });
  }
});

// SSE stream with cursor support
router.get("/:conversationId/stream", (req, res) => {
  const { conversationId } = req.params;

  const afterEventId =
    req.query.afterEventId as string | undefined;

  res.setHeader(
    "Content-Type",
    "text/event-stream"
  );

  res.setHeader(
    "Cache-Control",
    "no-cache"
  );

  res.setHeader(
    "Connection",
    "keep-alive"
  );

  res.flushHeaders();

  if (!clients.has(conversationId)) {
    clients.set(
      conversationId,
      new Set<Response>()
    );
  }

  const conversationClients =
    clients.get(conversationId)!;

  // Register the client before replaying events
  conversationClients.add(res);

  // Track events delivered to this client
  const sentEventIds = new Set<string>();

  sentEventsByClient.set(
    res,
    sentEventIds
  );

  const existingEvents =
    getEvents(conversationId) as any[];

  let startIndex = 0;

  // Validate cursor
  if (afterEventId) {
    const cursorIndex =
      existingEvents.findIndex(
        (event) =>
          event.eventId === afterEventId
      );

    if (cursorIndex === -1) {
      res.write(
        `event: error\ndata: ${JSON.stringify({
          error: "Unknown cursor",
        })}\n\n`
      );

      conversationClients.delete(res);

      sentEventsByClient.delete(res);

      res.end();

      return;
    }

    startIndex = cursorIndex + 1;
  }

  // Replay missed events
  for (const event of existingEvents.slice(startIndex)) {
    if (!sentEventIds.has(event.eventId)) {
      res.write(
        `id: ${event.eventId}\ndata: ${JSON.stringify(event)}\n\n`
      );

      sentEventIds.add(event.eventId);
    }
  }

  // Send periodic heartbeat
  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 15000);

  // Clean up disconnected client
  req.on("close", () => {
    clearInterval(heartbeat);

    conversationClients.delete(res);

    sentEventsByClient.delete(res);

    if (conversationClients.size === 0) {
      clients.delete(conversationId);
    }
  });
});

export default router;