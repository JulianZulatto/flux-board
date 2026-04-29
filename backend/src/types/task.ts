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

export type TaskPatchInput = Partial<Omit<CreateTaskInput, "title">> & {
  title?: string;
};
