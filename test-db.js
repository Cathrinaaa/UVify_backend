// test-db.js
import { db } from "./db.js";
import { uv_history } from "../shared/schema.js";

(async () => {
  try {
    const result = await db.select().from(uv_history).limit(1);
    console.log("✅ Connected to Neon successfully! Sample data:", result);
    process.exit(0);
  } catch (err) {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
  }
})();
