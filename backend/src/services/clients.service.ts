import {
  insertClient,
  listClients,
  updateClientById
} from "../repositories/clients.repository.js";
import {
  CLIENT_STATUSES,
  type Client,
  type ClientPatchInput,
  type CreateClientInput,
  type NormalizedClientPatchInput,
  type NormalizedCreateClientInput
} from "../types/client.js";
import { ClientServiceError } from "./clientServiceError.js";

const REQUIRED_FIELDS = ["business_name", "contact_name", "phone", "status", "start_date"] as const;
const PATCHABLE_FIELDS = [
  "business_name",
  "contact_name",
  "phone",
  "status",
  "start_date",
  "end_date",
  "plan",
  "internal_notes"
] as const;

type RequiredField = (typeof REQUIRED_FIELDS)[number];
type PatchableField = (typeof PATCHABLE_FIELDS)[number];

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  return !Number.isNaN(new Date(value).getTime());
}

function normalizeString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  return value.trim();
}

function isValidStatus(value: string): value is (typeof CLIENT_STATUSES)[number] {
  return CLIENT_STATUSES.includes(value as (typeof CLIENT_STATUSES)[number]);
}

function getRequiredString(input: Record<string, unknown>, field: RequiredField): string {
  const normalized = normalizeString(input[field]);
  if (!normalized) {
    throw new ClientServiceError(400, `Field '${field}' is required`);
  }

  return normalized;
}

function normalizeCreateInput(input: Record<string, unknown>): NormalizedCreateClientInput {
  REQUIRED_FIELDS.forEach((field) => {
    const value = input[field];
    if (typeof value !== "string" || !value.trim()) {
      throw new ClientServiceError(400, `Field '${field}' is required`);
    }
  });

  const businessName = getRequiredString(input, "business_name");
  const contactName = getRequiredString(input, "contact_name");
  const phone = getRequiredString(input, "phone");
  const status = getRequiredString(input, "status");
  const startDate = getRequiredString(input, "start_date");

  if (!isValidStatus(status)) {
    throw new ClientServiceError(400, "Field 'status' is invalid");
  }

  if (!isValidDate(startDate)) {
    throw new ClientServiceError(400, "Field 'start_date' must be YYYY-MM-DD");
  }

  const normalizedEndDate = normalizeString(input.end_date);
  if (normalizedEndDate && !isValidDate(normalizedEndDate)) {
    throw new ClientServiceError(400, "Field 'end_date' must be YYYY-MM-DD");
  }

  const normalizedPlan = normalizeString(input.plan);
  const internalNotes = typeof input.internal_notes === "string" ? input.internal_notes : "";

  return {
    business_name: businessName,
    contact_name: contactName,
    phone,
    status,
    start_date: startDate,
    end_date: normalizedEndDate || null,
    plan: normalizedPlan || null,
    internal_notes: internalNotes
  };
}

function normalizePatchInput(input: Record<string, unknown>): NormalizedClientPatchInput {
  const normalizedPatch: NormalizedClientPatchInput = {};

  PATCHABLE_FIELDS.forEach((field: PatchableField) => {
    const value = input[field];

    if (field === "status") {
      if (typeof value === "string") {
        normalizedPatch.status = value.trim() as (typeof CLIENT_STATUSES)[number];
      }
      return;
    }

    if (field === "end_date" || field === "plan") {
      if (value === null) {
        normalizedPatch[field] = null;
        return;
      }

      if (typeof value === "string") {
        const trimmed = value.trim();
        normalizedPatch[field] = trimmed || null;
      }

      return;
    }

    if (typeof value === "string") {
      normalizedPatch[field] = value.trim();
    }
  });

  if (Object.keys(normalizedPatch).length === 0) {
    throw new ClientServiceError(400, "No valid fields to update");
  }

  if (typeof normalizedPatch.status === "string" && !isValidStatus(normalizedPatch.status)) {
    throw new ClientServiceError(400, "Field 'status' is invalid");
  }

  if (typeof normalizedPatch.start_date === "string" && !isValidDate(normalizedPatch.start_date)) {
    throw new ClientServiceError(400, "Field 'start_date' must be YYYY-MM-DD");
  }

  if (typeof normalizedPatch.end_date === "string" && normalizedPatch.end_date && !isValidDate(normalizedPatch.end_date)) {
    throw new ClientServiceError(400, "Field 'end_date' must be YYYY-MM-DD");
  }

  return normalizedPatch;
}

export async function getClientsService(): Promise<Client[]> {
  return listClients();
}

export async function createClientService(input: CreateClientInput | Record<string, unknown>): Promise<Client> {
  const normalized = normalizeCreateInput(input as Record<string, unknown>);
  return insertClient(normalized);
}

export async function updateClientService(
  id: string,
  input: ClientPatchInput | Record<string, unknown>
): Promise<Client> {
  const normalizedPatch = normalizePatchInput(input as Record<string, unknown>);
  const updatedClient = await updateClientById(id, normalizedPatch);

  if (!updatedClient) {
    throw new ClientServiceError(404, "Client not found");
  }

  return updatedClient;
}
