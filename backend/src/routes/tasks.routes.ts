import { Router } from "express";
import {
  createComment,
  createTask,
  deleteComment,
  deleteTask,
  getTasks,
  updateTask
} from "../controllers/tasks.controller.js";

const tasksRouter = Router();

tasksRouter.get("/tasks", getTasks);
tasksRouter.post("/tasks", createTask);
tasksRouter.patch("/tasks/:id", updateTask);
tasksRouter.delete("/tasks/:id", deleteTask);
tasksRouter.post("/tasks/:id/comments", createComment);
tasksRouter.delete("/comments/:id", deleteComment);

export default tasksRouter;
