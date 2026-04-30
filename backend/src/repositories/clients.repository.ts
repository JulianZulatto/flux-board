import pool from "../db/pool.js";
import type { Client, NormalizedClientPatchInput, NormalizedCreateClientInput } from "../types/client.js";

const RETURNING_FIELDS = "id, business_name, contact_name, phone, status, start_date, end_date, plan, internal_notes, created_at, updated_at";

export async function listClients(): Promise<Client[]> {
  const result = await pool.query(
    `
    SELECT
      ${RETURNING_FIELDS}
    FROM clients
    ORDER BY created_at DESC;
    `
  );

  return result.rows as Client[];
}

export async function insertClient(input: NormalizedCreateClientInput): Promise<Client> {
  const result = await pool.query(
    `
    INSERT INTO clients (business_name, contact_name, phone, status, start_date, end_date, plan, internal_notes)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING ${RETURNING_FIELDS};
    `,
    [
      input.business_name,
      input.contact_name,
      input.phone,
      input.status,
      input.start_date,
      input.end_date,
      input.plan,
      input.internal_notes
    ]
  );

  return result.rows[0] as Client;
}

export async function updateClientById(id: string, patch: NormalizedClientPatchInput): Promise<Client | null> {
  const entries = Object.entries(patch) as Array<[keyof NormalizedClientPatchInput, NormalizedClientPatchInput[keyof NormalizedClientPatchInput]]>;
  const updates: string[] = [];
  const values: unknown[] = [];

  entries.forEach(([field, value]) => {
    values.push(value);
    updates.push(`${field} = $${values.length}`);
  });

  values.push(id);

  const result = await pool.query(
    `
    UPDATE clients
    SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${values.length}
    RETURNING ${RETURNING_FIELDS};
    `,
    values
  );

  if (result.rowCount === 0) {
    return null;
  }

  return result.rows[0] as Client;
}
