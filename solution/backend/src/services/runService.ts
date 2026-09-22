import db from "../db/database.js";

export type RunStatus =
  | "running"
  | "completed"
  | "failed"
  | "interrupted";

export interface ConversationRun {
  runId: string;
  conversationId: string;
  status: RunStatus;
  createdAt: string;
  updatedAt: string;
}

export function createRun(
  runId: string,
  conversationId: string
) {
  const now = new Date().toISOString();

  const statement = db.prepare(`
    INSERT INTO runs (
      run_id,
      conversation_id,
      status,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?)
  `);

  statement.run(
    runId,
    conversationId,
    "running",
    now,
    now
  );

  return getRun(runId);
}

export function getRun(runId: string) {
  const statement = db.prepare(`
    SELECT
      run_id AS runId,
      conversation_id AS conversationId,
      status,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM runs
    WHERE run_id = ?
  `);

  return statement.get(runId);
}

export function updateRunStatus(
  runId: string,
  status: RunStatus
) {
  const now = new Date().toISOString();

  const statement = db.prepare(`
    UPDATE runs
    SET status = ?, updated_at = ?
    WHERE run_id = ?
  `);

  statement.run(status, now, runId);

  return getRun(runId);
}