import { useEffect, useMemo, useState } from "react";
import { Building2, Eye, Pencil, Plus, Save, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate, toDateInputValue } from "@/lib/date";
import {
  CLIENT_STATUSES,
  createClient,
  getClients,
  updateClient,
  type Client,
  type ClientStatus
} from "@/services/clientsApi";

type ModalMode = "create" | "edit" | "view" | null;

type ClientForm = {
  business_name: string;
  contact_name: string;
  phone: string;
  status: ClientStatus;
  start_date: string;
  end_date: string;
  plan: string;
  internal_notes: string;
};

const EMPTY_FORM: ClientForm = {
  business_name: "",
  contact_name: "",
  phone: "",
  status: "LEAD",
  start_date: "",
  end_date: "",
  plan: "",
  internal_notes: ""
};

function toForm(client: Client): ClientForm {
  return {
    business_name: client.business_name,
    contact_name: client.contact_name,
    phone: client.phone,
    status: client.status,
    start_date: toDateInputValue(client.start_date),
    end_date: toDateInputValue(client.end_date),
    plan: client.plan ?? "",
    internal_notes: client.internal_notes
  };
}

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

export default function ClientsBoard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [form, setForm] = useState<ClientForm>(EMPTY_FORM);

  const editingClient = useMemo(
    () => clients.find((client) => client.id === editingClientId) ?? null,
    [clients, editingClientId]
  );

  useEffect(() => {
    async function loadClients() {
      try {
        setLoading(true);
        setError(null);
        const data = await getClients();
        setClients(data);
      } catch (_error) {
        setError("No se pudieron cargar los clientes desde el backend.");
      } finally {
        setLoading(false);
      }
    }

    loadClients();
  }, []);

  useEffect(() => {
    if (!modalMode) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeModal();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalMode]);

  function openCreateModal() {
    setError(null);
    setEditingClientId(null);
    setForm(EMPTY_FORM);
    setModalMode("create");
  }

  function openEditModal(client: Client) {
    setError(null);
    setEditingClientId(client.id);
    setForm(toForm(client));
    setModalMode("edit");
  }

  function openViewModal(client: Client) {
    setError(null);
    setEditingClientId(client.id);
    setForm(toForm(client));
    setModalMode("view");
  }

  function closeModal() {
    setModalMode(null);
    setEditingClientId(null);
    setForm(EMPTY_FORM);
  }

  function hasRequiredFields(currentForm: ClientForm) {
    return Boolean(
      currentForm.business_name.trim() &&
      currentForm.contact_name.trim() &&
      currentForm.phone.trim() &&
      currentForm.start_date
    );
  }

  async function handleCreateClient() {
    if (!hasRequiredFields(form)) {
      setError("Completa negocio, contacto, telefono y fecha de alta para crear el cliente.");
      return;
    }

    try {
      setCreating(true);
      setError(null);
      const created = await createClient({
        business_name: form.business_name.trim(),
        contact_name: form.contact_name.trim(),
        phone: form.phone.trim(),
        status: form.status,
        start_date: form.start_date,
        end_date: form.end_date.trim() ? form.end_date.trim() : null,
        plan: form.plan.trim() ? form.plan.trim() : null,
        internal_notes: form.internal_notes
      });

      setClients((prev) => [created, ...prev]);
      closeModal();
    } catch (_error) {
      setError("No se pudo crear el cliente en el backend.");
    } finally {
      setCreating(false);
    }
  }

  async function handleSaveClient() {
    if (!editingClientId) return;

    if (!hasRequiredFields(form)) {
      setError("Completa negocio, contacto, telefono y fecha de alta para guardar cambios.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const updated = await updateClient(editingClientId, {
        business_name: form.business_name.trim(),
        contact_name: form.contact_name.trim(),
        phone: form.phone.trim(),
        status: form.status,
        start_date: form.start_date,
        end_date: form.end_date.trim() ? form.end_date.trim() : null,
        plan: form.plan.trim() ? form.plan.trim() : null,
        internal_notes: form.internal_notes
      });

      setClients((prev) => prev.map((client) => (client.id === editingClientId ? updated : client)));
      closeModal();
    } catch (_error) {
      setError("No se pudo actualizar el cliente en el backend.");
    } finally {
      setSaving(false);
    }
  }

  const isCreateMode = modalMode === "create";
  const isEditMode = modalMode === "edit";
  const isViewMode = modalMode === "view";
  const modalTitle = isCreateMode ? "Nuevo cliente" : isEditMode ? "Editar cliente" : "Ver cliente";
  const submitLabel = isCreateMode ? "Crear cliente" : "Guardar cambios";
  const submitAction = isCreateMode ? handleCreateClient : handleSaveClient;
  const submitDisabled = creating || saving || (isEditMode && !editingClient);

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

        <Card className="border-slate-800 bg-slate-900/80 text-slate-100 shadow-2xl">
          <CardContent className="space-y-4 p-4 md:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                <Building2 className="h-5 w-5" />
                Listado de clientes
              </h2>
              <Button
                onClick={openCreateModal}
                className="rounded-xl border border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700"
              >
                <Plus className="mr-2 h-4 w-4" /> Nuevo cliente
              </Button>
            </div>

            {loading && <p className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-300">Cargando clientes...</p>}

            {!loading && clients.length === 0 && (
              <p className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-300">Aun no hay clientes registrados.</p>
            )}

            {!loading && clients.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="bg-slate-900">
                    <tr className="text-slate-300">
                      <th className="px-3 py-2">Negocio</th>
                      <th className="px-3 py-2">Contacto</th>
                      <th className="px-3 py-2">Telefono</th>
                      <th className="px-3 py-2">Estado</th>
                      <th className="px-3 py-2">Alta</th>
                      <th className="px-3 py-2">Vencimiento</th>
                      <th className="px-3 py-2">Plan</th>
                      <th className="px-3 py-2 text-right">Accion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((client) => (
                      <tr key={client.id} className="border-t border-slate-800 bg-slate-950 hover:bg-slate-900">
                        <td className="px-3 py-2 font-medium">{client.business_name}</td>
                        <td className="px-3 py-2">{client.contact_name}</td>
                        <td className="px-3 py-2">{client.phone}</td>
                        <td className="px-3 py-2">
                          <span className={statusBadgeClass(client.status)}>{client.status}</span>
                        </td>
                        <td className="px-3 py-2">{formatDate(client.start_date)}</td>
                        <td className="px-3 py-2">{formatDate(client.end_date)}</td>
                        <td className="px-3 py-2">{client.plan ?? "-"}</td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openViewModal(client)}
                              className="rounded-lg border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700"
                            >
                              <Eye className="mr-1.5 h-3.5 w-3.5" /> Ver
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditModal(client)}
                              className="rounded-lg border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700"
                            >
                              <Pencil className="mr-1.5 h-3.5 w-3.5" /> Editar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {modalMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 md:px-6">
              <h3 className="text-lg font-semibold">{modalTitle}</h3>
              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                aria-label="Cerrar modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-4 md:p-6">
              <ClientFormFields
                form={form}
                readOnly={isViewMode}
                onFieldChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
              />

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={closeModal}
                  className="rounded-xl border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700"
                >
                  {isViewMode ? "Cerrar" : "Cancelar"}
                </Button>
                {!isViewMode && (
                  <Button onClick={submitAction} className="rounded-xl" disabled={submitDisabled}>
                    {isEditMode && <Save className="mr-2 h-4 w-4" />}
                    {submitLabel}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ClientFormFields({
  form,
  readOnly,
  onFieldChange
}: {
  form: ClientForm;
  readOnly: boolean;
  onFieldChange: (patch: Partial<ClientForm>) => void;
}) {
  return (
    <>
      <div className="space-y-1">
        <label className="text-xs text-slate-400">Nombre del negocio</label>
        <input
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-slate-400"
          value={form.business_name}
          readOnly={readOnly}
          onChange={(e) => onFieldChange({ business_name: e.target.value })}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-slate-400">Nombre de contacto</label>
        <input
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-slate-400"
          value={form.contact_name}
          readOnly={readOnly}
          onChange={(e) => onFieldChange({ contact_name: e.target.value })}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-slate-400">Telefono</label>
        <input
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-slate-400"
          value={form.phone}
          readOnly={readOnly}
          onChange={(e) => onFieldChange({ phone: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs text-slate-400">Estado</label>
          <select
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-slate-400"
            value={form.status}
            disabled={readOnly}
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
            readOnly={readOnly}
            onChange={(e) => onFieldChange({ plan: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs text-slate-400">Fecha de alta</label>
          <input
            type="date"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-slate-400"
            value={form.start_date}
            disabled={readOnly}
            onChange={(e) => onFieldChange({ start_date: e.target.value })}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-400">Fecha de vencimiento</label>
          <input
            type="date"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-slate-400"
            value={form.end_date}
            disabled={readOnly}
            onChange={(e) => onFieldChange({ end_date: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-slate-400">Notas internas</label>
        <textarea
          className="min-h-24 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-slate-400"
          value={form.internal_notes}
          readOnly={readOnly}
          onChange={(e) => onFieldChange({ internal_notes: e.target.value })}
        />
      </div>
    </>
  );
}
