import express from "express";
import cors from "cors";

const app = express();
const PORT = 4000;

app.use(cors()); // allow frontend to call backend
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Temporary history (later we can load from SD card or DB)
let history = [];

// ESP32 sends data here
app.post("/receive-data", (req, res) => {
  const { date, time, uvi, level } = req.body;

  const entry = { date, time, uvi, level };
  history.push(entry);

  console.log("📡 Data received:", entry);

  res.json({ success: true, message: "Data received", entry });
});

// Get latest reading
app.get("/latest", (req, res) => {
  if (history.length === 0) {
    return res.json({ message: "No data yet" });
  }
  res.json(history[history.length - 1]);
});

// Get all history
app.get("/history", (req, res) => {
  res.json(history);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Backend running at http://0.0.0.0:${PORT}`);
});
