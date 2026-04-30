import type { Request, Response } from "express";
import { createClientService, getClientsService, updateClientService } from "../services/clients.service.js";
import { ClientServiceError } from "../services/clientServiceError.js";

function handleControllerError(
  res: Response,
  error: unknown,
  contextMessage: string,
  defaultMessage: string
) {
  if (error instanceof ClientServiceError) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  console.error(contextMessage, error);
  return res.status(500).json({ message: defaultMessage });
}

export async function getClients(_req: Request, res: Response) {
  try {
    const clients = await getClientsService();
    return res.status(200).json(clients);
  } catch (error) {
    return handleControllerError(res, error, "Error fetching clients:", "Failed to fetch clients");
  }
}

export async function createClient(req: Request, res: Response) {
  try {
    const createdClient = await createClientService(req.body as Record<string, unknown>);
    return res.status(201).json(createdClient);
  } catch (error) {
    return handleControllerError(res, error, "Error creating client:", "Failed to create client");
  }
}

export async function updateClient(req: Request, res: Response) {
  try {
    const idParam = req.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;
    const updatedClient = await updateClientService(id, req.body as Record<string, unknown>);
    return res.status(200).json(updatedClient);
  } catch (error) {
    return handleControllerError(res, error, "Error updating client:", "Failed to update client");
  }
}
