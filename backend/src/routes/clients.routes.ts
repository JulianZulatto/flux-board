import { Router } from "express";
import { createClient, getClients, updateClient } from "../controllers/clients.controller.js";

const clientsRouter = Router();

clientsRouter.get("/clients", getClients);
clientsRouter.post("/clients", createClient);
clientsRouter.patch("/clients/:id", updateClient);

export default clientsRouter;
