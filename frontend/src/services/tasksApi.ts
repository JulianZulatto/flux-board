const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export type TaskComment = {
  id: string;
  content: string;
  created_at: string;
};

export type Task = {
  id: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  area: string;
  notes: string;
  created_at: string;
  updated_at: string;
  comments: TaskComment[];
};

export type CreateTaskInput = {
  title: string;
  type: string;
  status: string;
  priority: string;
  area: string;
  notes?: string;
};

export type UpdateTaskInput = Partial<CreateTaskInput>;

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

export function getTasks() {
  return request<Task[]>("/api/tasks");
}

export function createTask(task: CreateTaskInput) {
  return request<Task>("/api/tasks", {
    method: "POST",
    body: JSON.stringify(task)
  });
}

export function updateTask(id: string, patch: UpdateTaskInput) {
  return request<Task>(`/api/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch)
  });
}

export function deleteTask(id: string) {
  return request<void>(`/api/tasks/${id}`, {
    method: "DELETE"
  });
}

export function createComment(taskId: string, content: string) {
  return request<TaskComment & { task_id: string }>(
    `/api/tasks/${taskId}/comments`,
    {
      method: "POST",
      body: JSON.stringify({ content })
    }
  );
}

export function deleteComment(commentId: string) {
  return request<void>(`/api/comments/${commentId}`, {
    method: "DELETE"
  });
}
