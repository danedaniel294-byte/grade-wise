import { pgTable, text, serial, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const semestersTable = pgTable("semesters", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  level: integer("level").notNull(),
  semesterNumber: integer("semester_number").notNull(),
  gpa: real("gpa"),
});

export const coursesTable = pgTable("courses", {
  id: serial("id").primaryKey(),
  semesterId: integer("semester_id").notNull(),
  name: text("name").notNull(),
  creditHours: real("credit_hours").notNull(),
  grade: text("grade"),
  score: real("score"),
  gradePoints: real("grade_points"),
});

export const insertSemesterSchema = createInsertSchema(semestersTable).omit({ id: true });
export const insertCourseSchema = createInsertSchema(coursesTable).omit({ id: true });

export type InsertSemester = z.infer<typeof insertSemesterSchema>;
export type Semester = typeof semestersTable.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof coursesTable.$inferSelect;
