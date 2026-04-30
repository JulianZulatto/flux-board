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

export type ClientPatchInput = Partial<CreateClientInput>;

export type NormalizedCreateClientInput = {
  business_name: string;
  contact_name: string;
  phone: string;
  status: ClientStatus;
  start_date: string;
  end_date: string | null;
  plan: string | null;
  internal_notes: string;
};

export type NormalizedClientPatchInput = Partial<{
  business_name: string;
  contact_name: string;
  phone: string;
  status: ClientStatus;
  start_date: string;
  end_date: string | null;
  plan: string | null;
  internal_notes: string;
}>;
