import express from "express";
import "./db/database.js";
import conversationRoutes from "./routes/conversationRoutes.js";

const app = express();

app.use(express.json());
app.use("/conversations", conversationRoutes);

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "Resumable conversation backend is running",
  });
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});