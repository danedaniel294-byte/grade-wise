import { pgTable, text, serial, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  universityId: integer("university_id"),
  currentLevel: integer("current_level"),
  themeColor: text("theme_color"),
  customPrimaryColor: text("custom_primary_color"),
  customSecondaryColor: text("custom_secondary_color"),
  targetCgpa: real("target_cgpa"),
  remainingCredits: real("remaining_credits"),
  remainingSemesters: integer("remaining_semesters"),
  coursesPerSemester: integer("courses_per_semester"),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
