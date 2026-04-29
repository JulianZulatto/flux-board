import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import tasksRouter from "./routes/tasks.routes.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "flux-board-backend"
  });
});

app.use("/api", tasksRouter);

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
