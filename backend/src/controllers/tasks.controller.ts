import type { Request, Response } from "express";
import pool from "../db/pool.js";

const REQUIRED_FIELDS = ["title", "type", "status", "priority", "area"] as const;
const PATCHABLE_FIELDS = ["title", "type", "status", "priority", "area", "notes"] as const;

type RequiredField = (typeof REQUIRED_FIELDS)[number];
type PatchableField = (typeof PATCHABLE_FIELDS)[number];

function getRequiredString(body: Record<string, unknown>, field: RequiredField): string {
  return String(body[field]).trim();
}

export async function getTasks(_req: Request, res: Response) {
  try {
    const query = `
      SELECT
        t.id,
        t.title,
        t.type,
        t.status,
        t.priority,
        t.area,
        t.notes,
        t.created_at,
        t.updated_at,
        COALESCE(
          ARRAY_AGG(c.content ORDER BY c.created_at) FILTER (WHERE c.id IS NOT NULL),
          ARRAY[]::text[]
        ) AS comments
      FROM tasks t
      LEFT JOIN comments c ON c.task_id = t.id
      GROUP BY t.id
      ORDER BY t.created_at DESC;
    `;

    const result = await pool.query(query);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return res.status(500).json({ message: "Failed to fetch tasks" });
  }
}

export async function createTask(req: Request, res: Response) {
  try {
    const body = req.body as Record<string, unknown>;

    for (const field of REQUIRED_FIELDS) {
      if (typeof body[field] !== "string" || !body[field]?.toString().trim()) {
        return res.status(400).json({ message: `Field '${field}' is required` });
      }
    }

    const notes = typeof body.notes === "string" ? body.notes : "";
    const title = getRequiredString(body, "title");
    const type = getRequiredString(body, "type");
    const status = getRequiredString(body, "status");
    const priority = getRequiredString(body, "priority");
    const area = getRequiredString(body, "area");

    const result = await pool.query(
      `
      INSERT INTO tasks (title, type, status, priority, area, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, title, type, status, priority, area, notes, created_at, updated_at;
      `,
      [title, type, status, priority, area, notes]
    );

    return res.status(201).json({ ...result.rows[0], comments: [] });
  } catch (error) {
    console.error("Error creating task:", error);
    return res.status(500).json({ message: "Failed to create task" });
  }
}

export async function updateTask(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const body = req.body as Record<string, unknown>;

    const updates: string[] = [];
    const values: unknown[] = [];

    PATCHABLE_FIELDS.forEach((field: PatchableField) => {
      const value = body[field];
      if (typeof value === "string") {
        values.push(value);
        updates.push(`${field} = $${values.length}`);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    values.push(id);

    const query = `
      UPDATE tasks
      SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${values.length}
      RETURNING id, title, type, status, priority, area, notes, created_at, updated_at;
    `;

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    const commentsResult = await pool.query(
      "SELECT content FROM comments WHERE task_id = $1 ORDER BY created_at",
      [id]
    );

    const comments = commentsResult.rows.map((row: { content: string }) => row.content);
    return res.status(200).json({ ...result.rows[0], comments });
  } catch (error) {
    console.error("Error updating task:", error);
    return res.status(500).json({ message: "Failed to update task" });
  }
}

export async function deleteTask(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM tasks WHERE id = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.status(204).send();
  } catch (error) {
    console.error("Error deleting task:", error);
    return res.status(500).json({ message: "Failed to delete task" });
  }
}

export async function createComment(req: Request, res: Response) {
  try {
    const { id: taskId } = req.params;
    const { content } = req.body as { content?: unknown };

    if (typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ message: "Field 'content' is required" });
    }

    const result = await pool.query(
      `
      INSERT INTO comments (task_id, content)
      VALUES ($1, $2)
      RETURNING id, task_id, content, created_at;
      `,
      [taskId, content.trim()]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    const pgError = error as { code?: string };
    if (pgError.code === "23503") {
      return res.status(404).json({ message: "Task not found" });
    }

    console.error("Error creating comment:", error);
    return res.status(500).json({ message: "Failed to create comment" });
  }
}

export async function deleteComment(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM comments WHERE id = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Comment not found" });
    }

    return res.status(204).send();
  } catch (error) {
    console.error("Error deleting comment:", error);
    return res.status(500).json({ message: "Failed to delete comment" });
  }
}
