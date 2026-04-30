import { useEffect, useMemo, useState } from "react";
import { Building2, Save, UserPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/dateTime";
import {
  CLIENT_STATUSES,
  createClient,
  getClients,
  updateClient,
  type Client,
  type ClientStatus
} from "@/services/clientsApi";

type NewClientForm = {
  business_name: string;
  contact_name: string;
  phone: string;
  status: ClientStatus;
  start_date: string;
  end_date: string;
  plan: string;
  internal_notes: string;
};

type EditClientForm = NewClientForm;

const EMPTY_NEW_CLIENT: NewClientForm = {
  business_name: "",
  contact_name: "",
  phone: "",
  status: "LEAD",
  start_date: "",
  end_date: "",
  plan: "",
  internal_notes: ""
};

function statusBadgeClass(status: ClientStatus) {
  const base = "rounded-full px-2 py-1 text-xs font-medium";
  const map: Record<ClientStatus, string> = {
    LEAD: "bg-slate-100 text-slate-700",
    EN_PRUEBA: "bg-blue-100 text-blue-700",
    ACTIVO: "bg-emerald-100 text-emerald-700",
    MOROSO: "bg-amber-100 text-amber-700",
    BAJA: "bg-red-100 text-red-700"
  };

  return `${base} ${map[status]}`;
}

function toEditForm(client: Client): EditClientForm {
  return {
    business_name: client.business_name,
    contact_name: client.contact_name,
    phone: client.phone,
    status: client.status,
    start_date: client.start_date,
    end_date: client.end_date ?? "",
    plan: client.plan ?? "",
    internal_notes: client.internal_notes
  };
}

export default function ClientsBoard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>(undefined);
  const [newClient, setNewClient] = useState<NewClientForm>(EMPTY_NEW_CLIENT);
  const [editClient, setEditClient] = useState<EditClientForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) || clients[0],
    [clients, selectedClientId]
  );

  useEffect(() => {
    async function loadClients() {
      try {
        setLoading(true);
        setError(null);
        const data = await getClients();
        setClients(data);
        setSelectedClientId(data[0]?.id);
      } catch (_error) {
        setError("No se pudieron cargar los clientes desde el backend.");
      } finally {
        setLoading(false);
      }
    }

    loadClients();
  }, []);

  useEffect(() => {
    if (!selectedClient) {
      setEditClient(null);
      return;
    }

    setEditClient(toEditForm(selectedClient));
  }, [selectedClient]);

  async function handleCreateClient() {
    if (!newClient.business_name.trim() || !newClient.contact_name.trim() || !newClient.phone.trim() || !newClient.start_date) {
      setError("Completá negocio, contacto, telefono y fecha de alta para crear el cliente.");
      return;
    }

    try {
      setCreating(true);
      setError(null);
      const created = await createClient({
        business_name: newClient.business_name.trim(),
        contact_name: newClient.contact_name.trim(),
        phone: newClient.phone.trim(),
        status: newClient.status,
        start_date: newClient.start_date,
        end_date: newClient.end_date.trim() ? newClient.end_date.trim() : null,
        plan: newClient.plan.trim() ? newClient.plan.trim() : null,
        internal_notes: newClient.internal_notes
      });

      setClients((prev) => [created, ...prev]);
      setSelectedClientId(created.id);
      setNewClient(EMPTY_NEW_CLIENT);
    } catch (_error) {
      setError("No se pudo crear el cliente en el backend.");
    } finally {
      setCreating(false);
    }
  }

  async function handleSaveClient() {
    if (!selectedClient || !editClient) return;

    if (!editClient.business_name.trim() || !editClient.contact_name.trim() || !editClient.phone.trim() || !editClient.start_date) {
      setError("Completá negocio, contacto, telefono y fecha de alta para guardar cambios.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const updated = await updateClient(selectedClient.id, {
        business_name: editClient.business_name.trim(),
        contact_name: editClient.contact_name.trim(),
        phone: editClient.phone.trim(),
        status: editClient.status,
        start_date: editClient.start_date,
        end_date: editClient.end_date.trim() ? editClient.end_date.trim() : null,
        plan: editClient.plan.trim() ? editClient.plan.trim() : null,
        internal_notes: editClient.internal_notes
      });

      setClients((prev) => prev.map((client) => (client.id === selectedClient.id ? updated : client)));
    } catch (_error) {
      setError("No se pudo actualizar el cliente en el backend.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-slate-100 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-400">FluxERP</p>
          <h1 className="text-3xl font-bold md:text-5xl">Clientes</h1>
          <p className="max-w-3xl text-slate-300">
            Registro comercial basico para controlar el estado de cada cliente y su informacion principal.
          </p>
        </div>

        {error && <p className="rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">{error}</p>}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-slate-800 bg-slate-900/80 text-slate-100 shadow-2xl">
            <CardContent className="space-y-4 p-4 md:p-6">
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                <Building2 className="h-5 w-5" />
                Listado de clientes
              </h2>

              {loading && <p className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-300">Cargando clientes...</p>}

              {!loading && clients.length === 0 && (
                <p className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-300">Aun no hay clientes registrados.</p>
              )}

              {!loading && clients.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="bg-slate-900">
                      <tr className="text-slate-300">
                        <th className="px-3 py-2">Negocio</th>
                        <th className="px-3 py-2">Contacto</th>
                        <th className="px-3 py-2">Telefono</th>
                        <th className="px-3 py-2">Estado</th>
                        <th className="px-3 py-2">Alta</th>
                        <th className="px-3 py-2">Vencimiento</th>
                        <th className="px-3 py-2">Plan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.map((client) => (
                        <tr
                          key={client.id}
                          onClick={() => setSelectedClientId(client.id)}
                          className={`cursor-pointer border-t border-slate-800 transition ${selectedClient?.id === client.id ? "bg-slate-800" : "bg-slate-950 hover:bg-slate-900"}`}
                        >
                          <td className="px-3 py-2 font-medium">{client.business_name}</td>
                          <td className="px-3 py-2">{client.contact_name}</td>
                          <td className="px-3 py-2">{client.phone}</td>
                          <td className="px-3 py-2">
                            <span className={statusBadgeClass(client.status)}>{client.status}</span>
                          </td>
                          <td className="px-3 py-2">{client.start_date}</td>
                          <td className="px-3 py-2">{client.end_date ?? "-"}</td>
                          <td className="px-3 py-2">{client.plan ?? "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-slate-800 bg-slate-900/80 text-slate-100 shadow-2xl">
              <CardContent className="space-y-4 p-4 md:p-6">
                <h2 className="flex items-center gap-2 text-xl font-semibold">
                  <UserPlus className="h-5 w-5" />
                  Nuevo cliente
                </h2>
                <ClientFormFields
                  form={newClient}
                  onFieldChange={(patch) => setNewClient((prev) => ({ ...prev, ...patch }))}
                />
                <Button onClick={handleCreateClient} className="w-full rounded-xl" disabled={creating}>
                  Crear cliente
                </Button>
              </CardContent>
            </Card>

            {selectedClient && editClient && (
              <Card className="border-slate-800 bg-slate-900/80 text-slate-100 shadow-2xl">
                <CardContent className="space-y-4 p-4 md:p-6">
                  <div className="space-y-1">
                    <h2 className="text-xl font-semibold">Editar cliente</h2>
                    <p className="text-xs text-slate-400">Creado: {formatDateTime(selectedClient.created_at)}</p>
                    <p className="text-xs text-slate-400">Actualizado: {formatDateTime(selectedClient.updated_at)}</p>
                  </div>
                  <ClientFormFields
                    form={editClient}
                    onFieldChange={(patch) => {
                      setEditClient((prev) => {
                        if (!prev) return prev;
                        return { ...prev, ...patch };
                      });
                    }}
                  />
                  <Button onClick={handleSaveClient} className="w-full rounded-xl" disabled={saving}>
                    <Save className="mr-2 h-4 w-4" /> Guardar cambios
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ClientFormFields({
  form,
  onFieldChange
}: {
  form: NewClientForm;
  onFieldChange: (patch: Partial<NewClientForm>) => void;
}) {
  return (
    <>
      <div className="space-y-1">
        <label className="text-xs text-slate-400">Nombre del negocio</label>
        <input
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-slate-400"
          value={form.business_name}
          onChange={(e) => onFieldChange({ business_name: e.target.value })}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-slate-400">Nombre de contacto</label>
        <input
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-slate-400"
          value={form.contact_name}
          onChange={(e) => onFieldChange({ contact_name: e.target.value })}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-slate-400">Telefono</label>
        <input
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-slate-400"
          value={form.phone}
          onChange={(e) => onFieldChange({ phone: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-slate-400">Estado</label>
          <select
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-slate-400"
            value={form.status}
            onChange={(e) => onFieldChange({ status: e.target.value as ClientStatus })}
          >
            {CLIENT_STATUSES.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-400">Plan / servicio</label>
          <input
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-slate-400"
            value={form.plan}
            onChange={(e) => onFieldChange({ plan: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-slate-400">Fecha de alta</label>
          <input
            type="date"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-slate-400"
            value={form.start_date}
            onChange={(e) => onFieldChange({ start_date: e.target.value })}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-400">Fecha de vencimiento</label>
          <input
            type="date"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-slate-400"
            value={form.end_date}
            onChange={(e) => onFieldChange({ end_date: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-slate-400">Notas internas</label>
        <textarea
          className="min-h-24 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-slate-400"
          value={form.internal_notes}
          onChange={(e) => onFieldChange({ internal_notes: e.target.value })}
        />
      </div>
    </>
  );
}
