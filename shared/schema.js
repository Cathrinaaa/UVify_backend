// ======================================================
// 🌤️ UVify Database Schema (Drizzle ORM)
// ======================================================

import { pgTable, serial, varchar, numeric, integer, timestamp, date, time } from "drizzle-orm/pg-core";

// USERS TABLE
export const users = pgTable("users", {
  user_id: serial("user_id").primaryKey(),
  username: varchar("username", { length: 100 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  email: varchar("email", { length: 150 }),
  created_at: timestamp("created_at").defaultNow(),
  first_name: varchar("first_name", { length: 100 }), 
  last_name: varchar("last_name", { length: 100 }),  
  phone: varchar("phone", { length: 50 }),
});

// UV READINGS TABLE
export const uv_readings = pgTable("uv_readings", {
  reading_id: serial("reading_id").primaryKey(),
  user_id: integer("user_id").references(() => users.user_id),
  date: date("date").notNull(),
  time: time("time").notNull(),
  uvi: numeric("uvi", { precision: 5, scale: 2 }).notNull(),
  level: varchar("level", { length: 20 }).notNull(),
  created_at: timestamp("created_at").defaultNow(),
});
