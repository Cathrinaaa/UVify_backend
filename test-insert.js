import { db } from "./db.js";
import { uv_history } from "../shared/schema.js";

(async () => {
  try {
    const result = await db.insert(uv_history).values({
      user_id: 1,          // your test user ID
      date: "2025-10-05",
      time: "15:30",
      uvi: 6.5,
      level: "High",
    }).returning();

    console.log("✅ Test reading inserted:", result);
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed to insert test reading:", err);
    process.exit(1);
  }
})();
