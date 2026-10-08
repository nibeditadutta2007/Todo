import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import db from "./db.js";

const app = express();
const port = Number(process.env.PORT) || 3001;
const isProduction = process.env.NODE_ENV === "production";
const guestUser = { id: 0, name: "Guest", email: "guest@daylight.local" };

app.disable("x-powered-by");
app.use(express.json({ limit: "20kb" }));
app.use(cookieParser());

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: isProduction,
  path: "/"
};

function validDate(value) {
  return typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}

function getActiveUser(req) {
  if (req.user && Number.isInteger(req.user.sub)) {
    return { id: req.user.sub, name: req.user.name, email: req.user.email };
  }
  return guestUser;
}

function ensureGuestUser() {
  db.prepare(
    "INSERT OR IGNORE INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)"
  ).run(0, "Guest", "guest@daylight.local", "");
}

ensureGuestUser();

app.post("/api/auth/register", (_req, res) => {
  res.status(201).json({ user: guestUser });
});

app.post("/api/auth/login", (_req, res) => {
  res.json({ user: guestUser });
});

app.post("/api/auth/logout", (_req, res) => {
  res.clearCookie("daylight_session", cookieOptions);
  res.status(204).end();
});

app.get("/api/auth/me", (_req, res) => {
  res.json({ user: guestUser });
});

app.get("/api/todos", (req, res) => {
  const date = req.query.date;
  if (!validDate(date)) return res.status(400).json({ error: "Choose a valid date." });

  const todos = db.prepare(
    "SELECT id, title, description, status, due_date AS dueDate, created_at AS createdAt " +
    "FROM todos WHERE user_id = ? AND due_date = ? ORDER BY id DESC"
  ).all(guestUser.id, date);
  res.json({ todos });
});

app.post("/api/todos", (req, res) => {
  const body = req.body ?? {};
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const dueDate = body.dueDate;

  if (!title || title.length > 120) {
    return res.status(400).json({ error: "Task names must be between 1 and 120 characters." });
  }
  if (description.length > 500) {
    return res.status(400).json({ error: "Notes must be 500 characters or less." });
  }
  if (!validDate(dueDate)) return res.status(400).json({ error: "Choose a valid date." });

  const result = db.prepare(
    "INSERT INTO todos (user_id, title, description, due_date) VALUES (?, ?, ?, ?)"
  ).run(guestUser.id, title, description, dueDate);
  const todo = db.prepare(
    "SELECT id, title, description, status, due_date AS dueDate, created_at AS createdAt " +
    "FROM todos WHERE id = ? AND user_id = ?"
  ).get(result.lastInsertRowid, guestUser.id);
  res.status(201).json({ todo });
});

app.patch("/api/todos/:id", (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body ?? {};
  if (!Number.isSafeInteger(id) || id < 1) {
    return res.status(400).json({ error: "Invalid task." });
  }
  if (!["pending", "ongoing", "done"].includes(status)) {
    return res.status(400).json({ error: "Choose Pending, Ongoing, or Done." });
  }

  const result = db.prepare(
    "UPDATE todos SET status = ? WHERE id = ? AND user_id = ?"
  ).run(status, id, guestUser.id);
  if (result.changes === 0) return res.status(404).json({ error: "Task not found." });

  const todo = db.prepare(
    "SELECT id, title, description, status, due_date AS dueDate, created_at AS createdAt " +
    "FROM todos WHERE id = ? AND user_id = ?"
  ).get(id, guestUser.id);
  res.json({ todo });
});

app.delete("/api/todos/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    return res.status(400).json({ error: "Invalid task." });
  }

  const result = db.prepare("DELETE FROM todos WHERE id = ? AND user_id = ?")
    .run(id, guestUser.id);
  if (result.changes === 0) return res.status(404).json({ error: "Task not found." });
  res.status(204).end();
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "Something went wrong. Please try again." });
});

const root = path.dirname(fileURLToPath(import.meta.url));
if (isProduction) {
  app.use(express.static(path.resolve(root, "../dist")));
  app.get("*path", (_req, res) => res.sendFile(path.resolve(root, "../dist/index.html")));
}

app.listen(port, () => {
  console.log(`Daylight API is running on http://localhost:${port}`);
});
