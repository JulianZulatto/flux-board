import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, AlertTriangle, CheckCircle2, Clock, BookOpen, Users, Code2, MessageSquare, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createTask as createTaskRequest, getTasks } from "@/services/tasksApi";

type Task = {
  id: string
  title: string
  type: string
  status: string
  priority: string
  area: string
  notes: string
  comments: string[]
}

type TaskPatch = Partial<Omit<Task, "id" | "comments">> & {
  comments?: string[]
}

const statuses = ["Pendiente", "En progreso", "Bloqueado", "En revisión", "Hecho"];
const types = ["Código", "Bug", "Bloqueo técnico", "Aprendizaje aplicado", "Cliente / Soporte", "Decisión con Facu"];
const priorities = ["Baja", "Media", "Alta", "Crítica"];

function badgeClass(value: string) {
  const base = "rounded-full px-2 py-1 text-xs font-medium";
  const map: Record<string, string> = {
    Pendiente: "bg-slate-100 text-slate-700",
    "En progreso": "bg-blue-100 text-blue-700",
    Bloqueado: "bg-red-100 text-red-700",
    "En revisión": "bg-amber-100 text-amber-700",
    Hecho: "bg-emerald-100 text-emerald-700",
    Baja: "bg-slate-100 text-slate-700",
    Media: "bg-sky-100 text-sky-700",
    Alta: "bg-orange-100 text-orange-700",
    Crítica: "bg-red-100 text-red-700",
  };
  return `${base} ${map[value] || "bg-slate-100 text-slate-700"}`;
}

function iconFor(type: string) {
  if (type === "Cliente / Soporte") return <Users className="h-4 w-4" />;
  if (type === "Aprendizaje aplicado") return <BookOpen className="h-4 w-4" />;
  if (type === "Bloqueo técnico") return <AlertTriangle className="h-4 w-4" />;
  if (type === "Código" || type === "Bug") return <Code2 className="h-4 w-4" />;
  return <MessageSquare className="h-4 w-4" />;
}

export default function FluxERPControlBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingTask, setCreatingTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    type: "Código",
    status: "Pendiente",
    priority: "Media",
    area: "FluxERP",
    notes: "",
  });
  const [comment, setComment] = useState("");

  useEffect(() => {
    async function loadTasks() {
      try {
        setLoading(true);
        setError(null);
        const data = await getTasks();
        setTasks(data);
        setSelectedTaskId(data[0]?.id);
      } catch (_error) {
        setError("No se pudieron cargar las tareas desde el backend.");
      } finally {
        setLoading(false);
      }
    }

    loadTasks();
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const text = `${task.title} ${task.type} ${task.status} ${task.priority} ${task.area} ${task.notes}`.toLowerCase();
      const matchesQuery = text.includes(query.toLowerCase());
      const matchesStatus = filterStatus === "Todos" || task.status === filterStatus;
      return matchesQuery && matchesStatus;
    });
  }, [tasks, query, filterStatus]);

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) || filteredTasks[0] || tasks[0];

  const stats = useMemo(() => {
    return {
      total: tasks.length,
      blocked: tasks.filter((t) => t.status === "Bloqueado").length,
      progress: tasks.filter((t) => t.status === "En progreso").length,
      done: tasks.filter((t) => t.status === "Hecho").length,
    };
  }, [tasks]);

  async function addTask() {
    if (!newTask.title.trim()) return;

    try {
      setCreatingTask(true);
      setError(null);
      const createdTask = await createTaskRequest(newTask);
      setTasks((prev) => [createdTask, ...prev]);
      setSelectedTaskId(createdTask.id);
      setNewTask({ title: "", type: "Código", status: "Pendiente", priority: "Media", area: "FluxERP", notes: "" });
    } catch (_error) {
      setError("No se pudo crear la tarea en el backend.");
    } finally {
      setCreatingTask(false);
    }
  }

  function updateTask(id: string, patch: TaskPatch) {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, ...patch } : task)));
  }

  function deleteTask(id: string) {
    setTasks((prev) => prev.filter((task) => task.id !== id));
    if (selectedTaskId === id) setSelectedTaskId(tasks[0]?.id);
  }

  function addComment() {
    if (!selectedTask || !comment.trim()) return;
    setTasks((prev) =>
      prev.map((task) =>
        task.id === selectedTask.id
          ? { ...task, comments: [...task.comments, comment.trim()] }
          : task
      )
    );
    setComment("");
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-slate-100 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-400">FluxERP</p>
          <h1 className="text-3xl font-bold md:text-5xl">Centro de Control Personal</h1>
          <p className="max-w-3xl text-slate-300">
            Un tablero simple para sostener el sistema sin colapsar: tareas, bloqueos, clientes, aprendizaje y decisiones para revisar con Facu.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard icon={<Clock />} label="Total" value={stats.total} />
          <StatCard icon={<AlertTriangle />} label="Bloqueadas" value={stats.blocked} />
          <StatCard icon={<Code2 />} label="En progreso" value={stats.progress} />
          <StatCard icon={<CheckCircle2 />} label="Hechas" value={stats.done} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-slate-800 bg-slate-900/80 text-slate-100 shadow-2xl">
            <CardContent className="space-y-4 p-4 md:p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h2 className="text-xl font-semibold">Tablero de trabajo</h2>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-400"
                      placeholder="Buscar..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                  <select
                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-slate-400"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option>Todos</option>
                    {statuses.map((status) => <option key={status}>{status}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid gap-3">
                {loading && <p className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-300">Cargando tareas...</p>}
                {error && <p className="rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">{error}</p>}
                {!loading && !error && filteredTasks.length === 0 && (
                  <p className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-300">No hay tareas para mostrar.</p>
                )}
                {filteredTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    layout
                    onClick={() => setSelectedTaskId(task.id)}
                    className={`cursor-pointer rounded-2xl border p-4 transition ${selectedTask?.id === task.id ? "border-sky-400 bg-slate-800" : "border-slate-800 bg-slate-950 hover:border-slate-600"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-slate-300">
                          {iconFor(task.type)}
                          <span className="text-xs uppercase tracking-wide">{task.type}</span>
                        </div>
                        <h3 className="font-semibold">{task.title}</h3>
                        <p className="text-sm text-slate-400">{task.area}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTask(task.id);
                        }}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className={badgeClass(task.status)}>{task.status}</span>
                      <span className={badgeClass(task.priority)}>{task.priority}</span>
                      {task.comments.length > 0 && <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">{task.comments.length} comentario(s)</span>}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-slate-800 bg-slate-900/80 text-slate-100 shadow-2xl">
              <CardContent className="space-y-4 p-4 md:p-6">
                <h2 className="text-xl font-semibold">Nueva entrada</h2>
                <input
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-slate-400"
                  placeholder="Ej: Revisar error en ventas"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Tipo" value={newTask.type} options={types} onChange={(value) => setNewTask({ ...newTask, type: value })} />
                  <Select label="Estado" value={newTask.status} options={statuses} onChange={(value) => setNewTask({ ...newTask, status: value })} />
                  <Select label="Prioridad" value={newTask.priority} options={priorities} onChange={(value) => setNewTask({ ...newTask, priority: value })} />
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Área</label>
                    <input
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-slate-400"
                      value={newTask.area}
                      onChange={(e) => setNewTask({ ...newTask, area: e.target.value })}
                    />
                  </div>
                </div>
                <textarea
                  className="min-h-24 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-slate-400"
                  placeholder="Notas: qué entendí, qué falta, qué depende de Facu..."
                  value={newTask.notes}
                  onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                />
                <Button onClick={addTask} className="w-full rounded-xl" disabled={creatingTask}>
                  <Plus className="mr-2 h-4 w-4" /> Agregar al tablero
                </Button>
              </CardContent>
            </Card>

            {selectedTask && (
              <Card className="border-slate-800 bg-slate-900/80 text-slate-100 shadow-2xl">
                <CardContent className="space-y-4 p-4 md:p-6">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Detalle seleccionado</p>
                    <h2 className="text-xl font-semibold">{selectedTask.title}</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Select label="Estado" value={selectedTask.status} options={statuses} onChange={(value) => updateTask(selectedTask.id, { status: value })} />
                    <Select label="Prioridad" value={selectedTask.priority} options={priorities} onChange={(value) => updateTask(selectedTask.id, { priority: value })} />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Notas</label>
                    <textarea
                      className="min-h-28 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-slate-400"
                      value={selectedTask.notes}
                      onChange={(e) => updateTask(selectedTask.id, { notes: e.target.value })}
                    />
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold">Comentarios</h3>
                    <div className="space-y-2">
                      {selectedTask.comments.length === 0 && <p className="text-sm text-slate-400">Todavía no hay comentarios.</p>}
                      {selectedTask.comments.map((item, index) => (
                        <div key={index} className="rounded-xl bg-slate-950 p-3 text-sm text-slate-300">
                          {item}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-slate-400"
                        placeholder="Agregar comentario..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") addComment();
                        }}
                      />
                      <Button onClick={addComment} className="rounded-xl">Agregar</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactElement<{ className?: string }>
  label: string
  value: number
}) {
  return (
    <Card className="border-slate-800 bg-slate-900/80 text-slate-100 shadow-xl">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="rounded-2xl bg-slate-950 p-3 text-slate-300">{React.cloneElement(icon, { className: "h-5 w-5" })}</div>
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-slate-400">{label}</label>
      <select
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-slate-400"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </div>
  );
}

