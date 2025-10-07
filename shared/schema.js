// shared/schema.js
import { pgTable, serial, varchar, text, timestamp, decimal, integer } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  first_name: varchar("first_name", { length: 100 }).notNull(),
  last_name: varchar("last_name", { length: 100 }).notNull(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password_hash: varchar("password_hash", { length: 255 }).notNull(),
  bio: text("bio"),
  location: varchar("location", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// New table: uv_history
export const uv_history = pgTable("uv_history", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull(), // foreign key
  uvi: decimal("uvi", { precision: 5, scale: 2 }).notNull(),
  level: varchar("level", { length: 20 }).notNull(),
  date: varchar("date", { length: 20 }).notNull(),
  time: varchar("time", { length: 20 }).notNull(),
  created_at: timestamp("created_at").defaultNow(),
});
