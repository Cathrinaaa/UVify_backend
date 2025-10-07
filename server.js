// ======================================================
// 🌤️ UVify Backend Server
// Technologies: Express.js + Drizzle ORM + PostgreSQL (Neon)
// ======================================================

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { db } from "./db.js";
import { users, uv_readings } from "./shared/schema.js";
import { eq, desc } from "drizzle-orm";

// -------------------------
// 🔧 Setup
// -------------------------
dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;

// -------------------------
// 🌐 Middleware
// -------------------------
app.use(cors({
  origin: [
    "http://localhost:5173", // local dev frontend
    "https://your-uvify-frontend.vercel.app", // deployed frontend
  ],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======================================================
// 🧠 API ROUTES
// ======================================================

// 1️⃣ Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// 2️⃣ Create a new user (for setup or registration)
app.post("/register", async (req, res) => {
  const { username, password, email } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Missing username or password" });
  }

  try {
    const result = await db.insert(users).values({
      username,
      password, // ⚠️ store hashed password in production!
      email,
    }).returning();
    res.json({ success: true, user: result[0] });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ success: false, message: "Failed to register user" });
  }
});

// 3️⃣ ESP32 — Save UV reading
app.post("/history/:userId", async (req, res) => {
  const { userId } = req.params;
  const { date, time, uvi, level } = req.body;

  if (!date || !time || uvi === undefined || !level) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    const result = await db.insert(uv_readings).values({
      user_id: Number(userId),
      date,
      time,
      uvi: Number(uvi),
      level,
    }).returning();

    res.json({ success: true, entry: result[0] });
  } catch (error) {
    console.error("❌ Error saving UV reading:", error);
    res.status(500).json({ success: false, message: "Failed to save UV reading" });
  }
});

// 4️⃣ Fetch all readings for a user
app.get("/history/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const results = await db.select()
      .from(uv_readings)
      .where(eq(uv_readings.user_id, Number(userId)))
      .orderBy(desc(uv_readings.created_at));

    res.json(results);
  } catch (error) {
    console.error("❌ Error fetching user history:", error);
    res.status(500).json({ success: false, message: "Failed to fetch history" });
  }
});

// 5️⃣ (Optional) Clear all readings — for testing only
app.delete("/history/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    await db.delete(uv_readings).where(eq(uv_readings.user_id, Number(userId)));
    res.json({ success: true, message: "All readings deleted for user" });
  } catch (error) {
    console.error("❌ Error deleting readings:", error);
    res.status(500).json({ success: false, message: "Failed to delete readings" });
  }
});

// ======================================================
// 🚀 Start Server
// ======================================================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ UVify Backend running on http://0.0.0.0:${PORT}`);
});
