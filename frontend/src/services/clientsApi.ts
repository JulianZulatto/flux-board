const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const CLIENT_STATUSES = ["LEAD", "EN_PRUEBA", "ACTIVO", "MOROSO", "BAJA"] as const;

export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export type Client = {
  id: string;
  business_name: string;
  contact_name: string;
  phone: string;
  status: ClientStatus;
  start_date: string;
  end_date: string | null;
  plan: string | null;
  internal_notes: string;
  created_at: string;
  updated_at: string;
};

export type CreateClientInput = {
  business_name: string;
  contact_name: string;
  phone: string;
  status: ClientStatus;
  start_date: string;
  end_date?: string | null;
  plan?: string | null;
  internal_notes?: string;
};

export type UpdateClientInput = Partial<CreateClientInput>;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function getClients() {
  return request<Client[]>("/api/clients");
}

export function createClient(client: CreateClientInput) {
  return request<Client>("/api/clients", {
    method: "POST",
    body: JSON.stringify(client)
  });
}

export function updateClient(id: string, patch: UpdateClientInput) {
  return request<Client>(`/api/clients/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch)
  });
}
