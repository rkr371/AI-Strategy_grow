import { pgTable, serial, text, boolean, timestamp, integer } from "drizzle-orm/pg-core";

export const dailyMissions = pgTable("daily_missions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  priority: text("priority").notNull().default("medium"),
  completed: boolean("completed").notNull().default(false),
  missionDate: text("mission_date").notNull(),
  xp: integer("xp").notNull().default(50),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const clientLeads = pgTable("client_leads", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  industry: text("industry").notNull(),
  contactType: text("contact_type").notNull(),
  platform: text("platform").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("prospect"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
