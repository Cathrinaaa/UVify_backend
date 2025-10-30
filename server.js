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
// 🌐 Middleware (CORS FIXED)
// -------------------------
app.use(
  cors({
    origin: [
      "http://localhost:5173",                // Local Vite frontend
      "https://v0-uv-ifyfrontend.vercel.app",
      "https://v0-v0uvifyfrontendmain5.vercel.app",
      "https://b5479d6e-0dba-409a-b84d-f50f8210e9c6-00-qg71uy0n0wv4.pike.replit.dev" // Vercel deployed frontend
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.options("*", cors()); // handle preflight OPTIONS requests

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======================================================
// 🧠 Temporary In-Memory Data for Live Dashboard
// ======================================================
let history = [];

// ======================================================
// ✅ API ROUTES
// ======================================================

// 1️⃣ Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});


// 2️⃣ Register new user
app.post("/register", async (req, res) => {
  const { username, password, email, first_name, last_name, phone } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Missing username or password" });
  }

  try {
    const result = await db
      .insert(users)
      .values({
        username,
        password, // ⚠️ TODO: use bcrypt hash later
        email,
        first_name,
        last_name,
        phone,
      })
      .returning();

    res.json({ success: true, user: result[0] });
  } catch (error) {
    console.error("❌ Error registering user:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to register user" });
  }
});

// 3️⃣ Login route
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    // ⚠️ In production: compare hashed passwords using bcrypt
    if (user.password !== password) {
      return res.status(401).json({ success: false, message: "Invalid password" });
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error during login" });
  }
});

// 4️⃣ ESP32 — Save UV reading to DB (main API)
app.post("/history/:userId", async (req, res) => {
  const { userId } = req.params;
  const { date, time, uvi, level } = req.body;

  if (!date || !time || uvi === undefined || !level) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    const result = await db
      .insert(uv_readings)
      .values({
        user_id: Number(userId),
        date,
        time,
        uvi: Number(uvi),
        level,
      })
      .returning();

    res.json({ success: true, entry: result[0] });
  } catch (error) {
    console.error("❌ Error saving UV reading:", error);
    res.status(500).json({ success: false, message: "Failed to save UV reading" });
  }
});

// 5️⃣ Fetch all readings for a user (from Neon DB)
app.get("/history/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const results = await db
      .select()
      .from(uv_readings)
      .where(eq(uv_readings.user_id, Number(userId)))
      .orderBy(desc(uv_readings.created_at));

    res.json(results);
  } catch (error) {
    console.error("❌ Error fetching user history:", error);
    res.status(500).json({ success: false, message: "Failed to fetch history" });
  }
});

// 6️⃣ Delete all readings — for testing
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
// 8️⃣ User Profile Routes
// ======================================================

// ✅ Get user profile by ID
app.get("/profile/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.user_id, Number(userId)));

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error("❌ Error fetching profile:", err);
    res.status(500).json({ success: false, message: "Server error fetching profile" });
  }
});

// ✅ Update user profile by ID
app.put("/profile/:userId", async (req, res) => {
  const { userId } = req.params;
  const { first_name, last_name, email, phone } = req.body;

  try {
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.user_id, Number(userId)));

    if (!existingUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const updated = await db
      .update(users)
      .set({
        first_name,
        last_name,
        email,
        phone,
      })
      .where(eq(users.user_id, Number(userId)))
      .returning();

    res.json({ success: true, user: updated[0] });
  } catch (err) {
    console.error("❌ Error updating profile:", err);
    res.status(500).json({ success: false, message: "Server error updating profile" });
  }
});


// ======================================================
// 🌐 Dashboard + ESP32 (In-Memory + DB Sync)
// ======================================================

// ESP32 sends readings (used by your existing sketch)
app.post("/receive-data", async (req, res) => {
  const { date, time, uvi, level } = req.body;

  if (!date || !time || !uvi || !level) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  const entry = { date, time, uvi, level };
  history.push(entry);
  console.log("📡 Data received:", entry);

  try {
    // Save to Neon DB (assuming single user: ID = 1)
    await db.insert(uv_readings).values({
      user_id: 1,
      date,
      time,
      uvi: Number(uvi),
      level,
    });
    res.json({ success: true, message: "Data saved to DB", entry });
  } catch (error) {
    console.error("❌ DB save failed:", error);
    res.json({ success: true, message: "Saved locally only", entry });
  }
});

// Return latest reading (for dashboard live view)
app.get("/latest", (req, res) => {
  if (history.length === 0) {
    return res.json({ message: "No data yet" });
  }
  res.json(history[history.length - 1]);
});

// Return all readings from database
app.get("/history", async (req, res) => {
  try {
    // Optional: if you later pass userId as query param ?userId=1
    const { userId } = req.query;

    let query = db.select().from(uv_readings).orderBy(desc(uv_readings.created_at));

    // If userId is provided, filter by user
    if (userId) {
      query = query.where(eq(uv_readings.user_id, Number(userId)));
    }

    const results = await query;
    res.json(results);
  } catch (error) {
    console.error("❌ Error fetching UV history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch UV history from database",
    });
  }
});

// ======================================================
// 🚀 Start Server
// ======================================================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ UVify Backend running on http://0.0.0.0:${PORT}`);
});
